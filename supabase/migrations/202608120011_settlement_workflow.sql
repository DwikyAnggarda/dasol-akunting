begin;

alter table public.customer_receipts
  add column if not exists reversed_by uuid references auth.users(id),
  add column if not exists reversed_at timestamptz,
  add column if not exists reversal_reason text;
alter table public.supplier_payments
  add column if not exists reversed_by uuid references auth.users(id),
  add column if not exists reversed_at timestamptz,
  add column if not exists reversal_reason text;

create or replace function public.save_settlement_draft(
  p_company_id uuid,
  p_settlement_type text,
  p_settlement_id uuid,
  p_version integer,
  p_header jsonb,
  p_allocations jsonb
)
returns uuid language plpgsql volatile security definer set search_path='' as $$
declare
  v_allocation jsonb;
  v_amount numeric(24,4) := 0;
  v_bank_id uuid := nullif(p_header->>'bank_account_id','')::uuid;
  v_before jsonb;
  v_branch_id uuid := nullif(p_header->>'branch_id','')::uuid;
  v_contact_id uuid := nullif(p_header->>'contact_id','')::uuid;
  v_date date := (p_header->>'settlement_date')::date;
  v_expected_contact uuid;
  v_item_id uuid;
  v_item_outstanding numeric(24,4);
  v_permission text;
  v_settlement_id uuid := coalesce(p_settlement_id,gen_random_uuid());
  v_value numeric(24,4);
begin
  if p_settlement_type not in('customer_receipt','supplier_payment') then raise exception using message='Jenis pembayaran tidak valid.';end if;
  v_permission:=case when p_settlement_type='customer_receipt' then 'sales.create' else 'purchase.create' end;
  if auth.uid() is null or not public.current_user_has_permission(p_company_id,v_permission) then raise exception using message='Tidak memiliki izin menyimpan pembayaran.';end if;
  if jsonb_typeof(p_allocations)<>'array' or jsonb_array_length(p_allocations)=0 then raise exception using message='Minimal satu alokasi wajib dipilih.';end if;
  if not exists(select 1 from public.branches where id=v_branch_id and company_id=p_company_id and is_active) then raise exception using message='Cabang tidak valid.';end if;
  if not exists(select 1 from public.bank_accounts where id=v_bank_id and company_id=p_company_id and is_active) then raise exception using message='Akun bank/kas tidak valid.';end if;
  if not exists(select 1 from public.contacts where id=v_contact_id and company_id=p_company_id and is_active) then raise exception using message='Kontak tidak valid.';end if;
  if (select count(*) from jsonb_array_elements(p_allocations))<>(select count(distinct value->>'item_id') from jsonb_array_elements(p_allocations)) then raise exception using message='Dokumen tidak boleh dialokasikan lebih dari sekali.';end if;
  for v_allocation in select value from jsonb_array_elements(p_allocations) loop
    v_item_id:=(v_allocation->>'item_id')::uuid;
    v_value:=(v_allocation->>'amount')::numeric;
    if v_value<=0 then raise exception using message='Nilai alokasi harus lebih besar dari nol.';end if;
    if p_settlement_type='customer_receipt' then
      select customer_id,outstanding_amount into v_expected_contact,v_item_outstanding from public.accounts_receivable where id=v_item_id and company_id=p_company_id and status in('open','partially_paid');
    else
      select supplier_id,outstanding_amount into v_expected_contact,v_item_outstanding from public.accounts_payable where id=v_item_id and company_id=p_company_id and status in('open','partially_paid');
    end if;
    if v_expected_contact is null or v_expected_contact<>v_contact_id or v_value>v_item_outstanding then raise exception using message='Alokasi tidak sesuai kontak atau melebihi saldo terutang.';end if;
    v_amount:=v_amount+v_value;
  end loop;

  if p_settlement_id is not null then
    if p_settlement_type='customer_receipt' then select to_jsonb(row_data) into v_before from public.customer_receipts row_data where id=p_settlement_id and company_id=p_company_id and status='draft' for update;
    else select to_jsonb(row_data) into v_before from public.supplier_payments row_data where id=p_settlement_id and company_id=p_company_id and status='draft' for update;end if;
    if v_before is null then raise exception using message='Draft pembayaran tidak ditemukan.';end if;
    if p_version is null or (v_before->>'version')::integer<>p_version then raise exception using message='Data telah berubah. Muat ulang sebelum menyimpan.';end if;
  end if;

  if p_settlement_type='customer_receipt' then
    if p_settlement_id is null then
      insert into public.customer_receipts(id,company_id,branch_id,document_number,receipt_date,customer_id,bank_account_id,amount,status,notes,created_by,updated_by)
      values(v_settlement_id,p_company_id,v_branch_id,'DRAFT-'||upper(substr(replace(v_settlement_id::text,'-',''),1,12)),v_date,v_contact_id,v_bank_id,v_amount,'draft',nullif(trim(p_header->>'notes'),''),auth.uid(),auth.uid());
    else
      update public.customer_receipts set branch_id=v_branch_id,receipt_date=v_date,customer_id=v_contact_id,bank_account_id=v_bank_id,amount=v_amount,notes=nullif(trim(p_header->>'notes'),''),updated_by=auth.uid() where id=v_settlement_id;
      delete from public.customer_receipt_allocations where receipt_id=v_settlement_id;
    end if;
    insert into public.customer_receipt_allocations(company_id,receipt_id,receivable_id,allocated_amount,created_by)
    select p_company_id,v_settlement_id,(value->>'item_id')::uuid,(value->>'amount')::numeric,auth.uid() from jsonb_array_elements(p_allocations);
  else
    if p_settlement_id is null then
      insert into public.supplier_payments(id,company_id,branch_id,document_number,payment_date,supplier_id,bank_account_id,amount,status,notes,created_by,updated_by)
      values(v_settlement_id,p_company_id,v_branch_id,'DRAFT-'||upper(substr(replace(v_settlement_id::text,'-',''),1,12)),v_date,v_contact_id,v_bank_id,v_amount,'draft',nullif(trim(p_header->>'notes'),''),auth.uid(),auth.uid());
    else
      update public.supplier_payments set branch_id=v_branch_id,payment_date=v_date,supplier_id=v_contact_id,bank_account_id=v_bank_id,amount=v_amount,notes=nullif(trim(p_header->>'notes'),''),updated_by=auth.uid() where id=v_settlement_id;
      delete from public.supplier_payment_allocations where payment_id=v_settlement_id;
    end if;
    insert into public.supplier_payment_allocations(company_id,payment_id,payable_id,allocated_amount,created_by)
    select p_company_id,v_settlement_id,(value->>'item_id')::uuid,(value->>'amount')::numeric,auth.uid() from jsonb_array_elements(p_allocations);
  end if;
  insert into public.audit_logs(company_id,actor_user_id,action,entity_type,entity_id,before_data,after_data)
  values(p_company_id,auth.uid(),case when p_settlement_id is null then 'create' else 'update' end,p_settlement_type,v_settlement_id,v_before,jsonb_build_object('amount',v_amount::text,'allocation_count',jsonb_array_length(p_allocations)));
  return v_settlement_id;
end;$$;

create or replace function public.delete_settlement_draft(p_company_id uuid,p_settlement_type text,p_settlement_id uuid,p_version integer)
returns void language plpgsql volatile security definer set search_path='' as $$
declare v_permission text;v_number text;
begin
  v_permission:=case p_settlement_type when 'customer_receipt' then 'sales.create' when 'supplier_payment' then 'purchase.create' else null end;
  if auth.uid() is null or v_permission is null or not public.current_user_has_permission(p_company_id,v_permission) then raise exception using message='Tidak memiliki izin menghapus draft.';end if;
  if p_settlement_type='customer_receipt' then
    select document_number into v_number from public.customer_receipts where id=p_settlement_id and company_id=p_company_id and status='draft' and version=p_version for update;
    if not found then raise exception using message='Draft tidak ditemukan atau telah berubah.';end if;
    delete from public.customer_receipt_allocations where receipt_id=p_settlement_id;delete from public.customer_receipts where id=p_settlement_id;
  else
    select document_number into v_number from public.supplier_payments where id=p_settlement_id and company_id=p_company_id and status='draft' and version=p_version for update;
    if not found then raise exception using message='Draft tidak ditemukan atau telah berubah.';end if;
    delete from public.supplier_payment_allocations where payment_id=p_settlement_id;delete from public.supplier_payments where id=p_settlement_id;
  end if;
  insert into public.audit_logs(company_id,actor_user_id,action,entity_type,entity_id,document_number) values(p_company_id,auth.uid(),'delete_draft',p_settlement_type,p_settlement_id,v_number);
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
  v_reversal:=public.reverse_journal_entry(p_company_id,v_journal,p_reversal_date,p_reason,p_idempotency_key);
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

drop trigger if exists audit_customer_receipts on public.customer_receipts;
create trigger audit_customer_receipts after insert or update or delete on public.customer_receipts for each row execute function public.audit_row_change();
drop trigger if exists audit_supplier_payments on public.supplier_payments;
create trigger audit_supplier_payments after insert or update or delete on public.supplier_payments for each row execute function public.audit_row_change();

revoke all on function public.save_settlement_draft(uuid,text,uuid,integer,jsonb,jsonb) from public,anon;
revoke all on function public.delete_settlement_draft(uuid,text,uuid,integer) from public,anon;
revoke all on function public.reverse_settlement(uuid,text,uuid,date,text,text) from public,anon;
grant execute on function public.save_settlement_draft(uuid,text,uuid,integer,jsonb,jsonb) to authenticated;
grant execute on function public.delete_settlement_draft(uuid,text,uuid,integer) to authenticated;
grant execute on function public.reverse_settlement(uuid,text,uuid,date,text,text) to authenticated;

commit;
