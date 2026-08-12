begin;

create or replace function public.submit_document(
  p_company_id uuid,
  p_document_type text,
  p_document_id uuid
)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_document_number text;
  v_created_by uuid;
  v_permission text;
  v_request_id uuid;
  v_workflow_id uuid;
begin
  if auth.uid() is null then raise exception using message = 'Autentikasi diperlukan.'; end if;
  v_permission := case p_document_type when 'sales_invoice' then 'sales.submit' when 'purchase_invoice' then 'purchase.submit' else null end;
  if v_permission is null or not public.current_user_has_permission(p_company_id, v_permission) then raise exception using message = 'Tidak memiliki izin submit dokumen.'; end if;

  if p_document_type = 'sales_invoice' then
    select document_number, created_by into v_document_number, v_created_by from public.sales_invoices where id = p_document_id and company_id = p_company_id and status in ('draft','rejected') for update;
    if not found then raise exception using message = 'Draft invoice penjualan tidak ditemukan.'; end if;
  elsif p_document_type = 'purchase_invoice' then
    select document_number, created_by into v_document_number, v_created_by from public.purchase_invoices where id = p_document_id and company_id = p_company_id and status in ('draft','rejected') for update;
    if not found then raise exception using message = 'Draft invoice pembelian tidak ditemukan.'; end if;
  end if;

  select id into v_workflow_id from public.approval_workflows where company_id = p_company_id and document_type = p_document_type and is_active order by created_at limit 1;
  insert into public.approval_requests(company_id, document_type, document_id, document_number, workflow_id, submitted_by, created_by)
  values (p_company_id, p_document_type, p_document_id, v_document_number, v_workflow_id, auth.uid(), auth.uid())
  on conflict (company_id, document_type, document_id) do update set status = 'pending', submitted_by = auth.uid(), submitted_at = now(), current_step = 1, completed_at = null
  returning id into v_request_id;
  insert into public.approval_actions(company_id, request_id, step, action, actor_user_id) values (p_company_id, v_request_id, 0, 'submit', auth.uid());

  if p_document_type = 'sales_invoice' then update public.sales_invoices set status = 'pending_approval', submitted_by = auth.uid(), submitted_at = now() where id = p_document_id;
  else update public.purchase_invoices set status = 'pending_approval', submitted_by = auth.uid(), submitted_at = now() where id = p_document_id; end if;
  insert into public.audit_logs(company_id, actor_user_id, action, entity_type, entity_id, document_number) values (p_company_id, auth.uid(), 'submit', p_document_type, p_document_id, v_document_number);
  return v_request_id;
end;
$$;

create or replace function public.approve_document(
  p_company_id uuid,
  p_request_id uuid,
  p_comment text default null
)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_request public.approval_requests%rowtype;
  v_allow_self boolean := false;
  v_permission text;
begin
  if auth.uid() is null then raise exception using message = 'Autentikasi diperlukan.'; end if;
  select * into v_request from public.approval_requests where id = p_request_id and company_id = p_company_id and status = 'pending' for update;
  if not found then raise exception using message = 'Permintaan persetujuan tidak ditemukan.'; end if;
  v_permission := case v_request.document_type when 'sales_invoice' then 'sales.approve' when 'purchase_invoice' then 'purchase.approve' else null end;
  if v_permission is null or not public.current_user_has_permission(p_company_id, v_permission) then raise exception using message = 'Tidak memiliki izin persetujuan.'; end if;
  select coalesce(workflow.allow_self_approval, setting.allow_self_approval, false) into v_allow_self
  from public.company_settings setting left join public.approval_workflows workflow on workflow.id = v_request.workflow_id where setting.company_id = p_company_id;
  if not v_allow_self and v_request.submitted_by = auth.uid() then raise exception using message = 'Pembuat dokumen tidak boleh menyetujui dokumennya sendiri.'; end if;

  update public.approval_requests set status = 'approved', completed_at = now() where id = p_request_id;
  insert into public.approval_actions(company_id, request_id, step, action, actor_user_id, comment) values (p_company_id, p_request_id, v_request.current_step, 'approve', auth.uid(), nullif(trim(p_comment),''));
  if v_request.document_type = 'sales_invoice' then update public.sales_invoices set status = 'approved', approved_by = auth.uid(), approved_at = now() where id = v_request.document_id;
  else update public.purchase_invoices set status = 'approved', approved_by = auth.uid(), approved_at = now() where id = v_request.document_id; end if;
  insert into public.audit_logs(company_id, actor_user_id, action, entity_type, entity_id, document_number, reason) values (p_company_id, auth.uid(), 'approve', v_request.document_type, v_request.document_id, v_request.document_number, nullif(trim(p_comment),''));
end;
$$;

create or replace function public.reject_document(
  p_company_id uuid,
  p_request_id uuid,
  p_comment text
)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_request public.approval_requests%rowtype;
  v_permission text;
begin
  if length(trim(p_comment)) < 3 then raise exception using message = 'Alasan penolakan wajib diisi.'; end if;
  select * into v_request from public.approval_requests where id = p_request_id and company_id = p_company_id and status = 'pending' for update;
  if not found then raise exception using message = 'Permintaan persetujuan tidak ditemukan.'; end if;
  v_permission := case v_request.document_type when 'sales_invoice' then 'sales.approve' when 'purchase_invoice' then 'purchase.approve' else null end;
  if v_permission is null or not public.current_user_has_permission(p_company_id, v_permission) then raise exception using message = 'Tidak memiliki izin penolakan.'; end if;
  update public.approval_requests set status = 'rejected', completed_at = now() where id = p_request_id;
  insert into public.approval_actions(company_id, request_id, step, action, actor_user_id, comment) values (p_company_id, p_request_id, v_request.current_step, 'reject', auth.uid(), trim(p_comment));
  if v_request.document_type = 'sales_invoice' then update public.sales_invoices set status = 'rejected' where id = v_request.document_id;
  else update public.purchase_invoices set status = 'rejected' where id = v_request.document_id; end if;
  insert into public.audit_logs(company_id, actor_user_id, action, entity_type, entity_id, document_number, reason) values (p_company_id, auth.uid(), 'reject', v_request.document_type, v_request.document_id, v_request.document_number, trim(p_comment));
end;
$$;

create or replace function public.post_sales_invoice(
  p_company_id uuid,
  p_invoice_id uuid,
  p_idempotency_key text
)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_invoice public.sales_invoices%rowtype;
  v_journal_id uuid;
  v_journal_number text;
  v_subtotal numeric(24,4);
  v_tax numeric(24,4);
  v_total numeric(24,4);
  v_line_count integer;
  v_ar_account uuid;
  v_tax_account uuid;
begin
  if auth.uid() is null then raise exception using message = 'Autentikasi diperlukan.'; end if;
  if not public.current_user_has_permission(p_company_id, 'sales.post') then raise exception using message = 'Tidak memiliki izin posting invoice penjualan.'; end if;
  select * into v_invoice from public.sales_invoices where id = p_invoice_id and company_id = p_company_id for update;
  if not found then raise exception using message = 'Invoice penjualan tidak ditemukan.'; end if;
  if v_invoice.status in ('posted','partially_paid','paid') then select id into v_journal_id from public.journal_entries where company_id = p_company_id and source_type = 'sales_invoice' and source_id = p_invoice_id; return v_journal_id; end if;
  if v_invoice.status <> 'approved' then raise exception using message = 'Invoice harus berstatus approved sebelum posting.'; end if;
  if not exists (select 1 from public.accounting_periods where company_id = p_company_id and v_invoice.posting_date between starts_on and ends_on and status = 'open') then raise exception using message = 'Periode akuntansi tidak terbuka.'; end if;
  if exists (select 1 from public.sales_invoice_lines line join public.tax_rate_versions rate on rate.id=line.tax_rate_version_id where line.invoice_id=p_invoice_id and (rate.price_includes_tax or v_invoice.document_date<rate.effective_from or (rate.effective_to is not null and v_invoice.document_date>rate.effective_to))) then raise exception using message='Versi pajak invoice tidak berlaku atau inclusive posting belum didukung.';end if;

  select count(*), coalesce(sum(round(line.quantity * line.unit_price - line.discount_amount, 4)),0),
    coalesce(sum(round((line.quantity * line.unit_price - line.discount_amount) * coalesce(rate.rate,0) / 100, 4)),0)
  into v_line_count, v_subtotal, v_tax
  from public.sales_invoice_lines line
  left join public.tax_rate_versions rate on rate.id = line.tax_rate_version_id and rate.company_id = p_company_id
  where line.invoice_id = p_invoice_id and line.company_id = p_company_id;
  v_total := v_subtotal + v_tax;
  if v_line_count = 0 or v_total <= 0 then raise exception using message = 'Invoice tidak memiliki baris yang valid.'; end if;
  select account_id into v_ar_account from public.account_mappings where company_id = p_company_id and mapping_code = 'accounts_receivable';
  select account_id into v_tax_account from public.account_mappings where company_id = p_company_id and mapping_code = 'output_tax';
  if v_ar_account is null or (v_tax > 0 and v_tax_account is null) then raise exception using message = 'Pemetaan akun penjualan belum lengkap.'; end if;
  if exists (select 1 from public.sales_invoice_lines line join public.products product on product.id = line.product_id where line.invoice_id = p_invoice_id and product.product_type = 'inventory') then raise exception using message = 'Posting invoice inventory memerlukan delivery yang telah diposting.'; end if;

  v_journal_number := public.next_document_number(p_company_id, 'SJV', v_invoice.posting_date, v_invoice.branch_id);
  insert into public.journal_entries(company_id, branch_id, journal_number, document_date, journal_date, posting_date, description, status, source_type, source_id, currency_code, exchange_rate, total_debit, total_credit, idempotency_key, approved_by, approved_at, posted_by, posted_at, created_by)
  values (p_company_id, v_invoice.branch_id, v_journal_number, v_invoice.document_date, v_invoice.document_date, v_invoice.posting_date, 'Invoice ' || v_invoice.document_number, 'draft', 'sales_invoice', p_invoice_id, v_invoice.currency_code, v_invoice.exchange_rate, v_total, v_total, p_idempotency_key, v_invoice.approved_by, v_invoice.approved_at, auth.uid(), now(), auth.uid()) returning id into v_journal_id;
  insert into public.journal_lines(company_id, journal_entry_id, account_id, line_number, description, debit, credit, base_debit, base_credit, contact_id, branch_id, created_by)
  values (p_company_id, v_journal_id, v_ar_account, 1, 'Piutang ' || v_invoice.document_number, v_total, 0, v_total, 0, v_invoice.customer_id, v_invoice.branch_id, auth.uid());
  insert into public.journal_lines(company_id, journal_entry_id, account_id, line_number, description, debit, credit, base_debit, base_credit, contact_id, branch_id, tax_code_id, created_by)
  select p_company_id, v_journal_id, line.revenue_account_id, row_number() over (order by line.line_number) + 1, line.description, 0, round(line.quantity * line.unit_price - line.discount_amount,4), 0, round(line.quantity * line.unit_price - line.discount_amount,4), v_invoice.customer_id, v_invoice.branch_id, rate.tax_code_id, auth.uid()
  from public.sales_invoice_lines line left join public.tax_rate_versions rate on rate.id = line.tax_rate_version_id where line.invoice_id = p_invoice_id;
  if v_tax > 0 then
    insert into public.journal_lines(company_id, journal_entry_id, account_id, line_number, description, debit, credit, base_debit, base_credit, contact_id, branch_id, created_by)
    values (p_company_id, v_journal_id, v_tax_account, v_line_count + 2, 'Pajak keluaran ' || v_invoice.document_number, 0, v_tax, 0, v_tax, v_invoice.customer_id, v_invoice.branch_id, auth.uid());
  end if;
  update public.journal_entries set status = 'posted' where id = v_journal_id;
  update public.sales_invoices set status = 'posted', subtotal = v_subtotal, tax_total = v_tax, total = v_total, outstanding_balance = v_total, posted_by = auth.uid(), posted_at = now() where id = p_invoice_id;
  insert into public.accounts_receivable(company_id, customer_id, sales_invoice_id, document_number, document_date, due_date, original_amount, outstanding_amount, created_by) values (p_company_id, v_invoice.customer_id, p_invoice_id, v_invoice.document_number, v_invoice.document_date, v_invoice.due_date, v_total, v_total, auth.uid());
  insert into public.audit_logs(company_id, actor_user_id, action, entity_type, entity_id, document_number, after_data) values (p_company_id, auth.uid(), 'post', 'sales_invoice', p_invoice_id, v_invoice.document_number, jsonb_build_object('journal_id',v_journal_id,'total',v_total::text));
  return v_journal_id;
exception when unique_violation then
  select id into v_journal_id from public.journal_entries where company_id = p_company_id and (idempotency_key = p_idempotency_key or (source_type = 'sales_invoice' and source_id = p_invoice_id));
  if v_journal_id is null then raise; end if;
  return v_journal_id;
end;
$$;

create or replace function public.post_purchase_invoice(
  p_company_id uuid,
  p_invoice_id uuid,
  p_idempotency_key text
)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_invoice public.purchase_invoices%rowtype;
  v_journal_id uuid;
  v_journal_number text;
  v_subtotal numeric(24,4);
  v_tax numeric(24,4);
  v_total numeric(24,4);
  v_line_count integer;
  v_ap_account uuid;
  v_tax_account uuid;
begin
  if auth.uid() is null then raise exception using message = 'Autentikasi diperlukan.'; end if;
  if not public.current_user_has_permission(p_company_id, 'purchase.post') then raise exception using message = 'Tidak memiliki izin posting invoice pembelian.'; end if;
  select * into v_invoice from public.purchase_invoices where id = p_invoice_id and company_id = p_company_id for update;
  if not found then raise exception using message = 'Invoice pembelian tidak ditemukan.'; end if;
  if v_invoice.status in ('posted','partially_paid','paid') then select id into v_journal_id from public.journal_entries where company_id = p_company_id and source_type = 'purchase_invoice' and source_id = p_invoice_id; return v_journal_id; end if;
  if v_invoice.status <> 'approved' then raise exception using message = 'Invoice harus berstatus approved sebelum posting.'; end if;
  if not exists (select 1 from public.accounting_periods where company_id = p_company_id and v_invoice.posting_date between starts_on and ends_on and status = 'open') then raise exception using message = 'Periode akuntansi tidak terbuka.'; end if;
  if exists (select 1 from public.purchase_invoice_lines line join public.tax_rate_versions rate on rate.id=line.tax_rate_version_id where line.invoice_id=p_invoice_id and (rate.price_includes_tax or v_invoice.document_date<rate.effective_from or (rate.effective_to is not null and v_invoice.document_date>rate.effective_to))) then raise exception using message='Versi pajak invoice tidak berlaku atau inclusive posting belum didukung.';end if;
  if exists (select 1 from public.purchase_invoice_lines line join public.products product on product.id = line.product_id where line.invoice_id = p_invoice_id and product.product_type = 'inventory') then raise exception using message = 'Posting invoice inventory memerlukan goods receipt yang telah diposting.'; end if;

  select count(*), coalesce(sum(round(line.quantity * line.unit_cost - line.discount_amount,4)),0), coalesce(sum(round((line.quantity * line.unit_cost - line.discount_amount) * coalesce(rate.rate,0) / 100,4)),0)
  into v_line_count, v_subtotal, v_tax from public.purchase_invoice_lines line left join public.tax_rate_versions rate on rate.id = line.tax_rate_version_id and rate.company_id = p_company_id where line.invoice_id = p_invoice_id and line.company_id = p_company_id;
  v_total := v_subtotal + v_tax;
  if v_line_count = 0 or v_total <= 0 then raise exception using message = 'Invoice tidak memiliki baris yang valid.'; end if;
  select account_id into v_ap_account from public.account_mappings where company_id = p_company_id and mapping_code = 'accounts_payable';
  select account_id into v_tax_account from public.account_mappings where company_id = p_company_id and mapping_code = 'input_tax';
  if v_ap_account is null or (v_tax > 0 and v_tax_account is null) then raise exception using message = 'Pemetaan akun pembelian belum lengkap.'; end if;

  v_journal_number := public.next_document_number(p_company_id, 'PJV', v_invoice.posting_date, v_invoice.branch_id);
  insert into public.journal_entries(company_id, branch_id, journal_number, document_date, journal_date, posting_date, description, status, source_type, source_id, total_debit, total_credit, idempotency_key, approved_by, approved_at, posted_by, posted_at, created_by)
  values (p_company_id, v_invoice.branch_id, v_journal_number, v_invoice.document_date, v_invoice.document_date, v_invoice.posting_date, 'Invoice pembelian ' || v_invoice.document_number, 'draft', 'purchase_invoice', p_invoice_id, v_total, v_total, p_idempotency_key, v_invoice.approved_by, v_invoice.approved_at, auth.uid(), now(), auth.uid()) returning id into v_journal_id;
  insert into public.journal_lines(company_id,journal_entry_id,account_id,line_number,description,debit,credit,base_debit,base_credit,contact_id,branch_id,tax_code_id,created_by)
  select p_company_id,v_journal_id,line.expense_account_id,row_number() over(order by line.line_number),line.description,round(line.quantity*line.unit_cost-line.discount_amount,4),0,round(line.quantity*line.unit_cost-line.discount_amount,4),0,v_invoice.supplier_id,v_invoice.branch_id,rate.tax_code_id,auth.uid()
  from public.purchase_invoice_lines line left join public.tax_rate_versions rate on rate.id=line.tax_rate_version_id where line.invoice_id=p_invoice_id;
  if v_tax > 0 then insert into public.journal_lines(company_id,journal_entry_id,account_id,line_number,description,debit,credit,base_debit,base_credit,contact_id,branch_id,created_by) values(p_company_id,v_journal_id,v_tax_account,v_line_count+1,'Pajak masukan '||v_invoice.document_number,v_tax,0,v_tax,0,v_invoice.supplier_id,v_invoice.branch_id,auth.uid()); end if;
  insert into public.journal_lines(company_id,journal_entry_id,account_id,line_number,description,debit,credit,base_debit,base_credit,contact_id,branch_id,created_by) values(p_company_id,v_journal_id,v_ap_account,v_line_count+2,'Utang '||v_invoice.document_number,0,v_total,0,v_total,v_invoice.supplier_id,v_invoice.branch_id,auth.uid());
  update public.journal_entries set status='posted' where id=v_journal_id;
  update public.purchase_invoices set status='posted',subtotal=v_subtotal,tax_total=v_tax,total=v_total,outstanding_balance=v_total,posted_by=auth.uid(),posted_at=now() where id=p_invoice_id;
  insert into public.accounts_payable(company_id,supplier_id,purchase_invoice_id,document_number,document_date,due_date,original_amount,outstanding_amount,created_by) values(p_company_id,v_invoice.supplier_id,p_invoice_id,v_invoice.document_number,v_invoice.document_date,v_invoice.due_date,v_total,v_total,auth.uid());
  insert into public.audit_logs(company_id,actor_user_id,action,entity_type,entity_id,document_number,after_data) values(p_company_id,auth.uid(),'post','purchase_invoice',p_invoice_id,v_invoice.document_number,jsonb_build_object('journal_id',v_journal_id,'total',v_total::text));
  return v_journal_id;
exception when unique_violation then
  select id into v_journal_id from public.journal_entries where company_id=p_company_id and (idempotency_key=p_idempotency_key or(source_type='purchase_invoice' and source_id=p_invoice_id));
  if v_journal_id is null then raise; end if;
  return v_journal_id;
end;
$$;

create or replace function public.get_dashboard_metrics(p_company_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
with account_balances as (
  select account.mapping_code, coalesce(sum(case when entry.status='posted' then line.debit-line.credit else 0 end),0) balance
  from public.account_mappings account
  left join public.journal_lines line on line.account_id=account.account_id and line.company_id=account.company_id
  left join public.journal_entries entry on entry.id=line.journal_entry_id and entry.status='posted'
  where account.company_id=p_company_id and account.mapping_code in ('cash','bank')
  group by account.mapping_code
), monthly as (
  select coalesce(sum(case when coa.account_type in ('revenue','other_income') then line.credit-line.debit else 0 end),0) revenue,
    coalesce(sum(case when coa.account_type in ('expense','other_expense') then line.debit-line.credit else 0 end),0) expenses,
    coalesce(sum(case when coa.account_type='cost_of_goods_sold' then line.debit-line.credit else 0 end),0) cogs
  from public.journal_entries entry join public.journal_lines line on line.journal_entry_id=entry.id join public.chart_of_accounts coa on coa.id=line.account_id
  where entry.company_id=p_company_id and entry.status='posted' and entry.posting_date between date_trunc('month',current_date)::date and current_date
), recent as (
  select coalesce(jsonb_agg(jsonb_build_object('document_number',entry.journal_number,'date',entry.posting_date::text,'description',entry.description,'amount',entry.total_debit::text,'status',entry.status) order by entry.posting_date desc,entry.created_at desc),'[]'::jsonb) data
  from (select * from public.journal_entries where company_id=p_company_id and status='posted' order by posting_date desc,created_at desc limit 8) entry
)
select case when public.current_user_has_company_access(p_company_id) then jsonb_build_object(
  'cash_balance',coalesce((select sum(balance) from account_balances),0)::text,
  'accounts_receivable',coalesce((select sum(outstanding_amount) from public.accounts_receivable where company_id=p_company_id and status in('open','partially_paid')),0)::text,
  'overdue_receivable',coalesce((select sum(outstanding_amount) from public.accounts_receivable where company_id=p_company_id and outstanding_amount>0 and due_date<current_date),0)::text,
  'accounts_payable',coalesce((select sum(outstanding_amount) from public.accounts_payable where company_id=p_company_id and status in('open','partially_paid')),0)::text,
  'overdue_payable',coalesce((select sum(outstanding_amount) from public.accounts_payable where company_id=p_company_id and outstanding_amount>0 and due_date<current_date),0)::text,
  'revenue_this_month',(select revenue::text from monthly),'expenses_this_month',(select expenses::text from monthly),
  'gross_profit',(select (revenue-cogs)::text from monthly),'net_profit',(select (revenue-cogs-expenses)::text from monthly),
  'low_stock_count',(select count(*)::int from public.product_warehouses balance join public.products product on product.id=balance.product_id where balance.company_id=p_company_id and balance.quantity_on_hand<=product.minimum_stock),
  'pending_approvals',(select count(*)::int from public.approval_requests where company_id=p_company_id and status='pending'),
  'recent_transactions',(select data from recent)
) else '{}'::jsonb end;
$$;

revoke all on function public.submit_document(uuid,text,uuid) from public,anon;
revoke all on function public.approve_document(uuid,uuid,text) from public,anon;
revoke all on function public.reject_document(uuid,uuid,text) from public,anon;
revoke all on function public.post_sales_invoice(uuid,uuid,text) from public,anon;
revoke all on function public.post_purchase_invoice(uuid,uuid,text) from public,anon;
revoke all on function public.get_dashboard_metrics(uuid) from public,anon;
grant execute on function public.submit_document(uuid,text,uuid) to authenticated;
grant execute on function public.approve_document(uuid,uuid,text) to authenticated;
grant execute on function public.reject_document(uuid,uuid,text) to authenticated;
grant execute on function public.post_sales_invoice(uuid,uuid,text) to authenticated;
grant execute on function public.post_purchase_invoice(uuid,uuid,text) to authenticated;
grant execute on function public.get_dashboard_metrics(uuid) to authenticated;

commit;
