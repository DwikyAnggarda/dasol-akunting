begin;

create table public.bank_accounts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete restrict,
  code text not null,
  name text not null,
  bank_name text,
  masked_account_number text,
  currency_code char(3) not null default 'IDR' references public.currencies(code),
  gl_account_id uuid not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(), created_by uuid references auth.users(id),
  updated_at timestamptz, updated_by uuid references auth.users(id), version integer not null default 1 check(version>0),
  unique(company_id,id), unique(company_id,code),
  foreign key(company_id,gl_account_id) references public.chart_of_accounts(company_id,id) on delete restrict
);

create table public.customer_receipts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete restrict,
  branch_id uuid not null references public.branches(id) on delete restrict,
  document_number text not null,
  receipt_date date not null,
  customer_id uuid not null,
  bank_account_id uuid not null,
  amount numeric(24,4) not null check(amount>0),
  status text not null default 'draft' check(status in('draft','posted','reversed')),
  notes text,
  posted_by uuid references auth.users(id), posted_at timestamptz,
  created_at timestamptz not null default now(), created_by uuid not null references auth.users(id),
  updated_at timestamptz, updated_by uuid references auth.users(id), version integer not null default 1 check(version>0),
  unique(company_id,id), unique(company_id,document_number),
  foreign key(company_id,customer_id) references public.contacts(company_id,id) on delete restrict,
  foreign key(company_id,bank_account_id) references public.bank_accounts(company_id,id) on delete restrict
);

create table public.customer_receipt_allocations (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete restrict,
  receipt_id uuid not null,
  receivable_id uuid not null references public.accounts_receivable(id) on delete restrict,
  allocated_amount numeric(24,4) not null check(allocated_amount>0),
  created_at timestamptz not null default now(), created_by uuid references auth.users(id),
  unique(receipt_id,receivable_id),
  foreign key(company_id,receipt_id) references public.customer_receipts(company_id,id) on delete cascade
);

create table public.supplier_payments (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete restrict,
  branch_id uuid not null references public.branches(id) on delete restrict,
  document_number text not null,
  payment_date date not null,
  supplier_id uuid not null,
  bank_account_id uuid not null,
  amount numeric(24,4) not null check(amount>0),
  status text not null default 'draft' check(status in('draft','posted','reversed')),
  notes text,
  posted_by uuid references auth.users(id), posted_at timestamptz,
  created_at timestamptz not null default now(), created_by uuid not null references auth.users(id),
  updated_at timestamptz, updated_by uuid references auth.users(id), version integer not null default 1 check(version>0),
  unique(company_id,id), unique(company_id,document_number),
  foreign key(company_id,supplier_id) references public.contacts(company_id,id) on delete restrict,
  foreign key(company_id,bank_account_id) references public.bank_accounts(company_id,id) on delete restrict
);

create table public.supplier_payment_allocations (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete restrict,
  payment_id uuid not null,
  payable_id uuid not null references public.accounts_payable(id) on delete restrict,
  allocated_amount numeric(24,4) not null check(allocated_amount>0),
  created_at timestamptz not null default now(), created_by uuid references auth.users(id),
  unique(payment_id,payable_id),
  foreign key(company_id,payment_id) references public.supplier_payments(company_id,id) on delete cascade
);

create table public.fixed_asset_categories (
  id uuid primary key default gen_random_uuid(), company_id uuid not null references public.companies(id) on delete restrict,
  code text not null, name text not null, asset_account_id uuid not null, accumulated_depreciation_account_id uuid not null, depreciation_expense_account_id uuid not null,
  default_useful_life_months integer not null check(default_useful_life_months>0),
  created_at timestamptz not null default now(), created_by uuid references auth.users(id), updated_at timestamptz, updated_by uuid references auth.users(id), version integer not null default 1 check(version>0),
  unique(company_id,id),unique(company_id,code),
  foreign key(company_id,asset_account_id) references public.chart_of_accounts(company_id,id),
  foreign key(company_id,accumulated_depreciation_account_id) references public.chart_of_accounts(company_id,id),
  foreign key(company_id,depreciation_expense_account_id) references public.chart_of_accounts(company_id,id)
);

create table public.fixed_assets (
  id uuid primary key default gen_random_uuid(), company_id uuid not null references public.companies(id) on delete restrict,
  category_id uuid not null, asset_code text not null, name text not null, acquisition_date date not null, in_service_date date not null,
  acquisition_cost numeric(24,4) not null check(acquisition_cost>0), residual_value numeric(24,4) not null default 0 check(residual_value>=0),
  useful_life_months integer not null check(useful_life_months>0), depreciation_method text not null default 'straight_line' check(depreciation_method='straight_line'),
  accumulated_depreciation numeric(24,4) not null default 0 check(accumulated_depreciation>=0), status text not null default 'active' check(status in('draft','active','disposed')),
  created_at timestamptz not null default now(), created_by uuid references auth.users(id), updated_at timestamptz, updated_by uuid references auth.users(id), version integer not null default 1 check(version>0),
  unique(company_id,id),unique(company_id,asset_code), check(residual_value<acquisition_cost), check(in_service_date>=acquisition_date),
  foreign key(company_id,category_id) references public.fixed_asset_categories(company_id,id)
);

create table public.tax_export_profiles (
  id uuid primary key default gen_random_uuid(), company_id uuid not null references public.companies(id) on delete restrict,
  code text not null, name text not null, adapter_code text not null, adapter_version text not null, status text not null default 'demo' check(status in('demo','verified','inactive')),
  schema_checksum text, source_reference text, effective_from date not null, configuration jsonb not null default '{}',
  created_at timestamptz not null default now(), created_by uuid references auth.users(id), updated_at timestamptz, updated_by uuid references auth.users(id), version integer not null default 1 check(version>0),
  unique(company_id,id),unique(company_id,code,adapter_version)
);

create table public.tax_export_batches (
  id uuid primary key default gen_random_uuid(), company_id uuid not null references public.companies(id) on delete restrict,
  profile_id uuid not null, period_start date not null, period_end date not null, status text not null default 'draft' check(status in('draft','validated','final','stale','failed')),
  artifact_path text, validation_errors jsonb not null default '[]', finalized_at timestamptz, finalized_by uuid references auth.users(id),
  created_at timestamptz not null default now(), created_by uuid not null references auth.users(id),
  check(period_start<=period_end), foreign key(company_id,profile_id) references public.tax_export_profiles(company_id,id)
);

create index customer_receipts_company_date_idx on public.customer_receipts(company_id,receipt_date desc,status);
create index supplier_payments_company_date_idx on public.supplier_payments(company_id,payment_date desc,status);
create index fixed_assets_company_status_idx on public.fixed_assets(company_id,status,asset_code);
create index tax_batches_company_period_idx on public.tax_export_batches(company_id,period_start,period_end,status);

create trigger bank_accounts_updated before update on public.bank_accounts for each row execute function public.set_updated_metadata();
create trigger customer_receipts_updated before update on public.customer_receipts for each row execute function public.set_updated_metadata();
create trigger supplier_payments_updated before update on public.supplier_payments for each row execute function public.set_updated_metadata();
create trigger asset_categories_updated before update on public.fixed_asset_categories for each row execute function public.set_updated_metadata();
create trigger fixed_assets_updated before update on public.fixed_assets for each row execute function public.set_updated_metadata();
create trigger tax_profiles_updated before update on public.tax_export_profiles for each row execute function public.set_updated_metadata();

do $$ declare table_name text; begin
foreach table_name in array array['bank_accounts','customer_receipts','customer_receipt_allocations','supplier_payments','supplier_payment_allocations','fixed_asset_categories','fixed_assets','tax_export_profiles','tax_export_batches'] loop
  execute format('alter table public.%I enable row level security',table_name);
  execute format('create policy %I on public.%I for select to authenticated using(public.current_user_has_company_access(company_id))',table_name||'_read',table_name);
end loop; end $$;
create policy bank_accounts_write on public.bank_accounts for all to authenticated using(public.current_user_has_permission(company_id,'settings.manage')) with check(public.current_user_has_permission(company_id,'settings.manage'));
create policy receipts_draft_write on public.customer_receipts for all to authenticated using(status='draft' and public.current_user_has_permission(company_id,'sales.create')) with check(status='draft' and public.current_user_has_permission(company_id,'sales.create'));
create policy receipt_allocations_write on public.customer_receipt_allocations for all to authenticated using(public.current_user_has_permission(company_id,'sales.create') and exists(select 1 from public.customer_receipts receipt where receipt.id=customer_receipt_allocations.receipt_id and receipt.status='draft')) with check(public.current_user_has_permission(company_id,'sales.create') and exists(select 1 from public.customer_receipts receipt where receipt.id=customer_receipt_allocations.receipt_id and receipt.status='draft'));
create policy payments_draft_write on public.supplier_payments for all to authenticated using(status='draft' and public.current_user_has_permission(company_id,'purchase.create')) with check(status='draft' and public.current_user_has_permission(company_id,'purchase.create'));
create policy payment_allocations_write on public.supplier_payment_allocations for all to authenticated using(public.current_user_has_permission(company_id,'purchase.create') and exists(select 1 from public.supplier_payments payment where payment.id=supplier_payment_allocations.payment_id and payment.status='draft')) with check(public.current_user_has_permission(company_id,'purchase.create') and exists(select 1 from public.supplier_payments payment where payment.id=supplier_payment_allocations.payment_id and payment.status='draft'));
create policy fixed_categories_write on public.fixed_asset_categories for all to authenticated using(public.current_user_has_permission(company_id,'settings.manage')) with check(public.current_user_has_permission(company_id,'settings.manage'));
create policy fixed_assets_write on public.fixed_assets for all to authenticated using(status='draft' and public.current_user_has_permission(company_id,'settings.manage')) with check(status='draft' and public.current_user_has_permission(company_id,'settings.manage'));
create policy tax_profiles_write on public.tax_export_profiles for all to authenticated using(public.current_user_has_permission(company_id,'settings.manage')) with check(public.current_user_has_permission(company_id,'settings.manage'));

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('financial-attachments','financial-attachments',false,10485760,array['application/pdf','image/jpeg','image/png','text/csv'])
on conflict(id) do update set public=false,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;
create policy financial_attachments_read on storage.objects for select to authenticated using(bucket_id='financial-attachments' and public.current_user_has_company_access(((storage.foldername(name))[1])::uuid));
create policy financial_attachments_insert on storage.objects for insert to authenticated with check(bucket_id='financial-attachments' and public.current_user_has_company_access(((storage.foldername(name))[1])::uuid));

create or replace function public.post_customer_receipt(p_company_id uuid,p_receipt_id uuid,p_idempotency_key text)
returns uuid language plpgsql volatile security definer set search_path='' as $$
declare v_receipt public.customer_receipts%rowtype;v_journal uuid;v_bank uuid;v_ar uuid;v_allocated numeric(24,4);v_number text;v_row record;
begin
 if auth.uid() is null or not public.current_user_has_permission(p_company_id,'sales.post') then raise exception using message='Tidak memiliki izin posting penerimaan.';end if;
 select * into v_receipt from public.customer_receipts where id=p_receipt_id and company_id=p_company_id for update;
 if not found then raise exception using message='Penerimaan pelanggan tidak ditemukan.';end if;
 if v_receipt.status='posted' then select id into v_journal from public.journal_entries where source_type='customer_receipt' and source_id=p_receipt_id and company_id=p_company_id;return v_journal;end if;
 if not exists(select 1 from public.accounting_periods where company_id=p_company_id and v_receipt.receipt_date between starts_on and ends_on and status='open') then raise exception using message='Periode akuntansi tidak terbuka.';end if;
 select gl_account_id into v_bank from public.bank_accounts where id=v_receipt.bank_account_id and company_id=p_company_id;
 select account_id into v_ar from public.account_mappings where company_id=p_company_id and mapping_code='accounts_receivable';
 select coalesce(sum(allocated_amount),0) into v_allocated from public.customer_receipt_allocations where receipt_id=p_receipt_id;
 if v_allocated<>v_receipt.amount or v_bank is null or v_ar is null then raise exception using message='Alokasi penerimaan atau pemetaan akun tidak valid.';end if;
 for v_row in select allocation.*,ar.outstanding_amount,ar.customer_id from public.customer_receipt_allocations allocation join public.accounts_receivable ar on ar.id=allocation.receivable_id where allocation.receipt_id=p_receipt_id for update of ar loop
   if v_row.customer_id<>v_receipt.customer_id or v_row.allocated_amount>v_row.outstanding_amount then raise exception using message='Alokasi piutang tidak valid.';end if;
 end loop;
 v_number:=public.next_document_number(p_company_id,'CR',v_receipt.receipt_date,v_receipt.branch_id);
 insert into public.journal_entries(company_id,branch_id,journal_number,document_date,journal_date,posting_date,description,status,source_type,source_id,total_debit,total_credit,idempotency_key,posted_by,posted_at,created_by)
 values(p_company_id,v_receipt.branch_id,v_number,v_receipt.receipt_date,v_receipt.receipt_date,v_receipt.receipt_date,'Penerimaan '||v_receipt.document_number,'draft','customer_receipt',p_receipt_id,v_receipt.amount,v_receipt.amount,p_idempotency_key,auth.uid(),now(),auth.uid()) returning id into v_journal;
 insert into public.journal_lines(company_id,journal_entry_id,account_id,line_number,description,debit,credit,base_debit,base_credit,contact_id,branch_id,created_by) values
 (p_company_id,v_journal,v_bank,1,'Kas diterima '||v_receipt.document_number,v_receipt.amount,0,v_receipt.amount,0,v_receipt.customer_id,v_receipt.branch_id,auth.uid()),
 (p_company_id,v_journal,v_ar,2,'Pelunasan piutang '||v_receipt.document_number,0,v_receipt.amount,0,v_receipt.amount,v_receipt.customer_id,v_receipt.branch_id,auth.uid());
 update public.journal_entries set status='posted' where id=v_journal;
 update public.accounts_receivable ar set outstanding_amount=ar.outstanding_amount-allocation.allocated_amount,status=case when ar.outstanding_amount-allocation.allocated_amount=0 then 'paid' else 'partially_paid' end
 from public.customer_receipt_allocations allocation where allocation.receipt_id=p_receipt_id and allocation.receivable_id=ar.id;
 update public.sales_invoices invoice set outstanding_balance=ar.outstanding_amount,status=case when ar.outstanding_amount=0 then 'paid' else 'partially_paid' end from public.accounts_receivable ar where ar.sales_invoice_id=invoice.id and ar.id in(select receivable_id from public.customer_receipt_allocations where receipt_id=p_receipt_id);
 update public.customer_receipts set status='posted',document_number=v_number,posted_by=auth.uid(),posted_at=now() where id=p_receipt_id;
 insert into public.audit_logs(company_id,actor_user_id,action,entity_type,entity_id,document_number) values(p_company_id,auth.uid(),'post','customer_receipt',p_receipt_id,v_number);return v_journal;
exception when unique_violation then select id into v_journal from public.journal_entries where company_id=p_company_id and(idempotency_key=p_idempotency_key or(source_type='customer_receipt' and source_id=p_receipt_id));if v_journal is null then raise;end if;return v_journal;end;$$;

create or replace function public.post_supplier_payment(p_company_id uuid,p_payment_id uuid,p_idempotency_key text)
returns uuid language plpgsql volatile security definer set search_path='' as $$
declare v_payment public.supplier_payments%rowtype;v_journal uuid;v_bank uuid;v_ap uuid;v_allocated numeric(24,4);v_number text;v_row record;
begin
 if auth.uid() is null or not public.current_user_has_permission(p_company_id,'purchase.post') then raise exception using message='Tidak memiliki izin posting pembayaran.';end if;
 select * into v_payment from public.supplier_payments where id=p_payment_id and company_id=p_company_id for update;
 if not found then raise exception using message='Pembayaran pemasok tidak ditemukan.';end if;
 if v_payment.status='posted' then select id into v_journal from public.journal_entries where source_type='supplier_payment' and source_id=p_payment_id and company_id=p_company_id;return v_journal;end if;
 if not exists(select 1 from public.accounting_periods where company_id=p_company_id and v_payment.payment_date between starts_on and ends_on and status='open') then raise exception using message='Periode akuntansi tidak terbuka.';end if;
 select gl_account_id into v_bank from public.bank_accounts where id=v_payment.bank_account_id and company_id=p_company_id;select account_id into v_ap from public.account_mappings where company_id=p_company_id and mapping_code='accounts_payable';
 select coalesce(sum(allocated_amount),0) into v_allocated from public.supplier_payment_allocations where payment_id=p_payment_id;if v_allocated<>v_payment.amount or v_bank is null or v_ap is null then raise exception using message='Alokasi pembayaran atau pemetaan akun tidak valid.';end if;
 for v_row in select allocation.*,ap.outstanding_amount,ap.supplier_id from public.supplier_payment_allocations allocation join public.accounts_payable ap on ap.id=allocation.payable_id where allocation.payment_id=p_payment_id for update of ap loop if v_row.supplier_id<>v_payment.supplier_id or v_row.allocated_amount>v_row.outstanding_amount then raise exception using message='Alokasi utang tidak valid.';end if;end loop;
 v_number:=public.next_document_number(p_company_id,'SP',v_payment.payment_date,v_payment.branch_id);
 insert into public.journal_entries(company_id,branch_id,journal_number,document_date,journal_date,posting_date,description,status,source_type,source_id,total_debit,total_credit,idempotency_key,posted_by,posted_at,created_by) values(p_company_id,v_payment.branch_id,v_number,v_payment.payment_date,v_payment.payment_date,v_payment.payment_date,'Pembayaran '||v_payment.document_number,'draft','supplier_payment',p_payment_id,v_payment.amount,v_payment.amount,p_idempotency_key,auth.uid(),now(),auth.uid()) returning id into v_journal;
 insert into public.journal_lines(company_id,journal_entry_id,account_id,line_number,description,debit,credit,base_debit,base_credit,contact_id,branch_id,created_by) values
 (p_company_id,v_journal,v_ap,1,'Pelunasan utang '||v_payment.document_number,v_payment.amount,0,v_payment.amount,0,v_payment.supplier_id,v_payment.branch_id,auth.uid()),
 (p_company_id,v_journal,v_bank,2,'Kas keluar '||v_payment.document_number,0,v_payment.amount,0,v_payment.amount,v_payment.supplier_id,v_payment.branch_id,auth.uid());
 update public.journal_entries set status='posted' where id=v_journal;
 update public.accounts_payable ap set outstanding_amount=ap.outstanding_amount-allocation.allocated_amount,status=case when ap.outstanding_amount-allocation.allocated_amount=0 then 'paid' else 'partially_paid' end from public.supplier_payment_allocations allocation where allocation.payment_id=p_payment_id and allocation.payable_id=ap.id;
 update public.purchase_invoices invoice set outstanding_balance=ap.outstanding_amount,status=case when ap.outstanding_amount=0 then 'paid' else 'partially_paid' end from public.accounts_payable ap where ap.purchase_invoice_id=invoice.id and ap.id in(select payable_id from public.supplier_payment_allocations where payment_id=p_payment_id);
 update public.supplier_payments set status='posted',document_number=v_number,posted_by=auth.uid(),posted_at=now() where id=p_payment_id;insert into public.audit_logs(company_id,actor_user_id,action,entity_type,entity_id,document_number) values(p_company_id,auth.uid(),'post','supplier_payment',p_payment_id,v_number);return v_journal;
exception when unique_violation then select id into v_journal from public.journal_entries where company_id=p_company_id and(idempotency_key=p_idempotency_key or(source_type='supplier_payment' and source_id=p_payment_id));if v_journal is null then raise;end if;return v_journal;end;$$;

create or replace function public.verify_subledger_reconciliation(p_company_id uuid)
returns jsonb language sql stable security definer set search_path='' as $$
with mapped as(select mapping_code,account_id from public.account_mappings where company_id=p_company_id and mapping_code in('accounts_receivable','accounts_payable')),
ledger as(select mapped.mapping_code,coalesce(sum(case when entry.status<>'posted' or entry.status is null then 0 when mapped.mapping_code='accounts_receivable' then line.debit-line.credit else line.credit-line.debit end),0) balance from mapped left join public.journal_lines line on line.account_id=mapped.account_id and line.company_id=p_company_id left join public.journal_entries entry on entry.id=line.journal_entry_id group by mapped.mapping_code),
sub as(select 'accounts_receivable' mapping_code,coalesce(sum(outstanding_amount),0) balance from public.accounts_receivable where company_id=p_company_id and status<>'reversed' union all select 'accounts_payable',coalesce(sum(outstanding_amount),0) from public.accounts_payable where company_id=p_company_id and status<>'reversed')
select case when public.current_user_has_permission(p_company_id,'report.financial.read') then jsonb_build_object('ar_ledger',coalesce((select balance from ledger where mapping_code='accounts_receivable'),0)::text,'ar_subledger',(select balance::text from sub where mapping_code='accounts_receivable'),'ar_balanced',coalesce((select balance from ledger where mapping_code='accounts_receivable'),0)=(select balance from sub where mapping_code='accounts_receivable'),'ap_ledger',coalesce((select balance from ledger where mapping_code='accounts_payable'),0)::text,'ap_subledger',(select balance::text from sub where mapping_code='accounts_payable'),'ap_balanced',coalesce((select balance from ledger where mapping_code='accounts_payable'),0)=(select balance from sub where mapping_code='accounts_payable')) else '{}'::jsonb end;$$;

revoke all on function public.post_customer_receipt(uuid,uuid,text) from public,anon;revoke all on function public.post_supplier_payment(uuid,uuid,text) from public,anon;revoke all on function public.verify_subledger_reconciliation(uuid) from public,anon;
grant execute on function public.post_customer_receipt(uuid,uuid,text) to authenticated;grant execute on function public.post_supplier_payment(uuid,uuid,text) to authenticated;grant execute on function public.verify_subledger_reconciliation(uuid) to authenticated;
grant select,insert,update,delete on public.bank_accounts,public.customer_receipts,public.customer_receipt_allocations,public.supplier_payments,public.supplier_payment_allocations,public.fixed_asset_categories,public.fixed_assets,public.tax_export_profiles to authenticated;
grant select on public.tax_export_batches to authenticated;

commit;
