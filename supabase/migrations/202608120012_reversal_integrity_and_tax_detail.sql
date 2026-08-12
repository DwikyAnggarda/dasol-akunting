begin;

alter function public.reverse_journal_entry(uuid,uuid,date,text,text) rename to reverse_journal_entry_core;
revoke all on function public.reverse_journal_entry_core(uuid,uuid,date,text,text) from public,anon,authenticated;

create or replace function public.reverse_journal_entry(p_company_id uuid,p_journal_id uuid,p_reversal_date date,p_reason text,p_idempotency_key text)
returns uuid language plpgsql volatile security definer set search_path='' as $$
declare v_source text;
begin
  select source_type into v_source from public.journal_entries where id=p_journal_id and company_id=p_company_id;
  if v_source is distinct from 'manual_journal' then raise exception using message='Jurnal dokumen bisnis harus direversal dari dokumen sumbernya.';end if;
  return public.reverse_journal_entry_core(p_company_id,p_journal_id,p_reversal_date,p_reason,p_idempotency_key);
end;$$;

create or replace function public.reverse_settlement(p_company_id uuid,p_settlement_type text,p_settlement_id uuid,p_reversal_date date,p_reason text,p_idempotency_key text)
returns uuid language plpgsql volatile security definer set search_path='' as $$
declare v_journal uuid;v_reversal uuid;v_permission text;v_number text;
begin
  v_permission:=case p_settlement_type when 'customer_receipt' then 'sales.post' when 'supplier_payment' then 'purchase.post' else null end;
  if auth.uid() is null or v_permission is null or not public.current_user_has_permission(p_company_id,v_permission) or not public.current_user_has_permission(p_company_id,'journal.reverse') then raise exception using message='Tidak memiliki izin reversal pembayaran.';end if;
  if length(trim(p_reason))<5 then raise exception using message='Alasan reversal minimal lima karakter.';end if;
  select id into v_reversal from public.journal_entries where company_id=p_company_id and idempotency_key=p_idempotency_key;
  if found then return v_reversal;end if;
  if p_settlement_type='customer_receipt' then
    select document_number into v_number from public.customer_receipts where id=p_settlement_id and company_id=p_company_id and status='posted' for update;
  else select document_number into v_number from public.supplier_payments where id=p_settlement_id and company_id=p_company_id and status='posted' for update;end if;
  if v_number is null then raise exception using message='Pembayaran posted tidak ditemukan.';end if;
  select id into v_journal from public.journal_entries where company_id=p_company_id and source_type=p_settlement_type and source_id=p_settlement_id and status='posted';
  if v_journal is null then raise exception using message='Jurnal sumber tidak ditemukan.';end if;
  v_reversal:=public.reverse_journal_entry_core(p_company_id,v_journal,p_reversal_date,p_reason,p_idempotency_key);
  if p_settlement_type='customer_receipt' then
    update public.accounts_receivable ar set outstanding_amount=ar.outstanding_amount+a.allocated_amount,status=case when ar.outstanding_amount+a.allocated_amount>=ar.original_amount then 'open' else 'partially_paid' end from public.customer_receipt_allocations a where a.receipt_id=p_settlement_id and a.receivable_id=ar.id;
    update public.sales_invoices i set outstanding_balance=ar.outstanding_amount,status=case when ar.outstanding_amount=0 then 'paid' when ar.outstanding_amount<i.total then 'partially_paid' else 'posted' end from public.accounts_receivable ar where ar.sales_invoice_id=i.id and ar.id in(select receivable_id from public.customer_receipt_allocations where receipt_id=p_settlement_id);
    update public.customer_receipts set status='reversed',reversed_by=auth.uid(),reversed_at=now(),reversal_reason=trim(p_reason),updated_by=auth.uid() where id=p_settlement_id;
  else
    update public.accounts_payable ap set outstanding_amount=ap.outstanding_amount+a.allocated_amount,status=case when ap.outstanding_amount+a.allocated_amount>=ap.original_amount then 'open' else 'partially_paid' end from public.supplier_payment_allocations a where a.payment_id=p_settlement_id and a.payable_id=ap.id;
    update public.purchase_invoices i set outstanding_balance=ap.outstanding_amount,status=case when ap.outstanding_amount=0 then 'paid' when ap.outstanding_amount<i.total then 'partially_paid' else 'posted' end from public.accounts_payable ap where ap.purchase_invoice_id=i.id and ap.id in(select payable_id from public.supplier_payment_allocations where payment_id=p_settlement_id);
    update public.supplier_payments set status='reversed',reversed_by=auth.uid(),reversed_at=now(),reversal_reason=trim(p_reason),updated_by=auth.uid() where id=p_settlement_id;
  end if;
  insert into public.audit_logs(company_id,actor_user_id,action,entity_type,entity_id,document_number,reason,after_data) values(p_company_id,auth.uid(),'reverse',p_settlement_type,p_settlement_id,v_number,trim(p_reason),jsonb_build_object('reversal_journal_id',v_reversal));
  return v_reversal;
end;$$;

create or replace function public.reverse_invoice(p_company_id uuid,p_document_type text,p_invoice_id uuid,p_reversal_date date,p_reason text,p_idempotency_key text)
returns uuid language plpgsql volatile security definer set search_path='' as $$
declare v_journal uuid;v_number text;v_permission text;v_reversal uuid;v_status text;v_outstanding numeric(24,4);v_total numeric(24,4);
begin
  v_permission:=case p_document_type when 'sales_invoice' then 'sales.post' when 'purchase_invoice' then 'purchase.post' else null end;
  if auth.uid() is null or v_permission is null or not public.current_user_has_permission(p_company_id,v_permission) or not public.current_user_has_permission(p_company_id,'journal.reverse') then raise exception using message='Tidak memiliki izin reversal invoice.';end if;
  if length(trim(p_reason))<5 then raise exception using message='Alasan reversal minimal lima karakter.';end if;
  if p_document_type='sales_invoice' then select document_number,status,outstanding_balance,total into v_number,v_status,v_outstanding,v_total from public.sales_invoices where id=p_invoice_id and company_id=p_company_id for update;
  else select document_number,status,outstanding_balance,total into v_number,v_status,v_outstanding,v_total from public.purchase_invoices where id=p_invoice_id and company_id=p_company_id for update;end if;
  if v_status='reversed' then select reversal_journal_id into v_reversal from public.journal_reversals r join public.journal_entries j on j.id=r.original_journal_id where j.company_id=p_company_id and j.source_type=p_document_type and j.source_id=p_invoice_id;return v_reversal;end if;
  if v_status<>'posted' or v_outstanding<>v_total then raise exception using message='Hanya invoice posted yang belum memiliki pembayaran dapat direversal.';end if;
  select id into v_journal from public.journal_entries where company_id=p_company_id and source_type=p_document_type and source_id=p_invoice_id and status='posted';
  if v_journal is null then raise exception using message='Jurnal sumber invoice tidak ditemukan.';end if;
  v_reversal:=public.reverse_journal_entry_core(p_company_id,v_journal,p_reversal_date,p_reason,p_idempotency_key);
  if p_document_type='sales_invoice' then
    update public.accounts_receivable set status='reversed',outstanding_amount=0,updated_by=auth.uid() where company_id=p_company_id and sales_invoice_id=p_invoice_id;
    update public.sales_invoices set status='reversed',outstanding_balance=0,updated_by=auth.uid() where id=p_invoice_id;
  else
    update public.accounts_payable set status='reversed',outstanding_amount=0,updated_by=auth.uid() where company_id=p_company_id and purchase_invoice_id=p_invoice_id;
    update public.purchase_invoices set status='reversed',outstanding_balance=0,updated_by=auth.uid() where id=p_invoice_id;
  end if;
  insert into public.audit_logs(company_id,actor_user_id,action,entity_type,entity_id,document_number,reason,after_data) values(p_company_id,auth.uid(),'reverse',p_document_type,p_invoice_id,v_number,trim(p_reason),jsonb_build_object('reversal_journal_id',v_reversal));
  return v_reversal;
end;$$;

create or replace function public.capture_posted_invoice_taxes() returns trigger language plpgsql security definer set search_path='' as $$
begin
  if new.status not in('posted','partially_paid','paid') or old.status in('posted','partially_paid','paid') then return new;end if;
  if tg_table_name='sales_invoices' then
    insert into public.document_line_taxes(company_id,document_type,document_id,document_line_id,tax_code_id,tax_rate_version_id,tax_base,rate,tax_amount,created_by)
    select new.company_id,'sales_invoice',new.id,line.id,rate.tax_code_id,rate.id,round(line.quantity*line.unit_price-line.discount_amount,4),rate.rate,round((line.quantity*line.unit_price-line.discount_amount)*rate.rate/100,4),auth.uid() from public.sales_invoice_lines line join public.tax_rate_versions rate on rate.id=line.tax_rate_version_id where line.invoice_id=new.id on conflict do nothing;
  else
    insert into public.document_line_taxes(company_id,document_type,document_id,document_line_id,tax_code_id,tax_rate_version_id,tax_base,rate,tax_amount,created_by)
    select new.company_id,'purchase_invoice',new.id,line.id,rate.tax_code_id,rate.id,round(line.quantity*line.unit_cost-line.discount_amount,4),rate.rate,round((line.quantity*line.unit_cost-line.discount_amount)*rate.rate/100,4),auth.uid() from public.purchase_invoice_lines line join public.tax_rate_versions rate on rate.id=line.tax_rate_version_id where line.invoice_id=new.id on conflict do nothing;
  end if;return new;
end;$$;
drop trigger if exists capture_sales_invoice_taxes on public.sales_invoices;
create trigger capture_sales_invoice_taxes after update of status on public.sales_invoices for each row execute function public.capture_posted_invoice_taxes();
drop trigger if exists capture_purchase_invoice_taxes on public.purchase_invoices;
create trigger capture_purchase_invoice_taxes after update of status on public.purchase_invoices for each row execute function public.capture_posted_invoice_taxes();

revoke all on function public.reverse_journal_entry(uuid,uuid,date,text,text) from public,anon;
revoke all on function public.reverse_invoice(uuid,text,uuid,date,text,text) from public,anon;
grant execute on function public.reverse_journal_entry(uuid,uuid,date,text,text) to authenticated;
grant execute on function public.reverse_invoice(uuid,text,uuid,date,text,text) to authenticated;

commit;
