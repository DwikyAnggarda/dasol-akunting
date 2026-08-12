begin;

alter table public.purchase_invoices add column if not exists notes text;

create or replace function public.save_invoice_draft(
  p_company_id uuid,
  p_document_type text,
  p_invoice_id uuid,
  p_version integer,
  p_header jsonb,
  p_lines jsonb
)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_account_id uuid;
  v_before jsonb;
  v_branch_id uuid := nullif(p_header->>'branch_id', '')::uuid;
  v_contact_id uuid := nullif(p_header->>'contact_id', '')::uuid;
  v_contact_type text;
  v_date date := (p_header->>'document_date')::date;
  v_discount numeric(24,4);
  v_due_date date := (p_header->>'due_date')::date;
  v_invoice_id uuid := coalesce(p_invoice_id, gen_random_uuid());
  v_line jsonb;
  v_line_amount numeric(24,4);
  v_line_number integer := 0;
  v_permission text;
  v_posting_date date := (p_header->>'posting_date')::date;
  v_price numeric(24,6);
  v_product public.products%rowtype;
  v_quantity numeric(24,6);
  v_rate public.tax_rate_versions%rowtype;
  v_subtotal numeric(24,4) := 0;
  v_tax numeric(24,4) := 0;
  v_tax_rate_id uuid;
  v_total numeric(24,4);
  v_warehouse_id uuid;
begin
  if auth.uid() is null then
    raise exception using message = 'Autentikasi diperlukan.';
  end if;
  if p_document_type not in ('sales_invoice', 'purchase_invoice') then
    raise exception using message = 'Jenis invoice tidak valid.';
  end if;
  if jsonb_typeof(p_lines) <> 'array' or jsonb_array_length(p_lines) = 0 then
    raise exception using message = 'Invoice wajib memiliki minimal satu baris.';
  end if;
  if v_due_date < v_date then
    raise exception using message = 'Tanggal jatuh tempo tidak boleh sebelum tanggal dokumen.';
  end if;
  if not exists (
    select 1 from public.branches
    where id = v_branch_id and company_id = p_company_id and is_active
  ) then
    raise exception using message = 'Cabang tidak valid atau tidak aktif.';
  end if;
  select contact_type into v_contact_type
  from public.contacts
  where id = v_contact_id and company_id = p_company_id and is_active;
  if v_contact_type is null
     or (p_document_type = 'sales_invoice' and v_contact_type not in ('customer','both'))
     or (p_document_type = 'purchase_invoice' and v_contact_type not in ('supplier','both')) then
    raise exception using message = 'Kontak invoice tidak valid atau tidak aktif.';
  end if;

  v_permission := case
    when p_document_type = 'sales_invoice' and p_invoice_id is null then 'sales.create'
    when p_document_type = 'sales_invoice' then 'sales.update'
    when p_invoice_id is null then 'purchase.create'
    else 'purchase.update'
  end;
  if not public.current_user_has_permission(p_company_id, v_permission) then
    raise exception using message = 'Tidak memiliki izin menyimpan invoice.';
  end if;

  if p_invoice_id is not null then
    if p_document_type = 'sales_invoice' then
      select to_jsonb(invoice) into v_before
      from public.sales_invoices invoice
      where invoice.id = p_invoice_id and invoice.company_id = p_company_id
        and invoice.status in ('draft','rejected')
      for update;
    else
      select to_jsonb(invoice) into v_before
      from public.purchase_invoices invoice
      where invoice.id = p_invoice_id and invoice.company_id = p_company_id
        and invoice.status in ('draft','rejected')
      for update;
    end if;
    if v_before is null then
      raise exception using message = 'Draft invoice tidak ditemukan atau tidak dapat diedit.';
    end if;
    if p_version is null or (v_before->>'version')::integer <> p_version then
      raise exception using message = 'Data telah berubah. Muat ulang halaman sebelum menyimpan.';
    end if;
  end if;

  -- Validate every line and compute totals only from trusted master data/rates.
  for v_line in select value from jsonb_array_elements(p_lines)
  loop
    v_line_number := v_line_number + 1;
    v_quantity := nullif(v_line->>'quantity','')::numeric;
    v_price := nullif(v_line->>'unit_price','')::numeric;
    v_discount := coalesce(nullif(v_line->>'discount_amount','')::numeric, 0);
    if v_quantity is null or v_quantity <= 0 or v_price is null or v_price < 0
       or v_discount < 0 or v_discount > v_quantity * v_price then
      raise exception using message = 'Kuantitas, harga, atau diskon pada baris invoice tidak valid.';
    end if;
    select * into v_product from public.products
    where id = nullif(v_line->>'product_id','')::uuid
      and company_id = p_company_id and is_active;
    if not found then
      raise exception using message = 'Produk invoice tidak valid atau tidak aktif.';
    end if;
    v_warehouse_id := nullif(v_line->>'warehouse_id','')::uuid;
    if v_warehouse_id is not null and not exists (
      select 1 from public.warehouses
      where id = v_warehouse_id and company_id = p_company_id and is_active
    ) then
      raise exception using message = 'Gudang invoice tidak valid atau tidak aktif.';
    end if;
    v_tax_rate_id := nullif(v_line->>'tax_rate_version_id','')::uuid;
    if v_tax_rate_id is not null then
      select * into v_rate from public.tax_rate_versions
      where id = v_tax_rate_id and company_id = p_company_id and status = 'active'
        and v_date between effective_from and coalesce(effective_to, 'infinity'::date);
      if not found or v_rate.price_includes_tax then
        raise exception using message = 'Versi tarif pajak tidak berlaku atau harga termasuk pajak belum didukung.';
      end if;
    else
      v_rate.rate := 0;
    end if;
    v_line_amount := round(v_quantity * v_price - v_discount, 4);
    v_subtotal := v_subtotal + v_line_amount;
    v_tax := v_tax + round(v_line_amount * coalesce(v_rate.rate, 0) / 100, 4);
  end loop;
  v_total := v_subtotal + v_tax;
  if v_total <= 0 then
    raise exception using message = 'Total invoice harus lebih besar dari nol.';
  end if;

  if p_document_type = 'sales_invoice' then
    if p_invoice_id is null then
      insert into public.sales_invoices(
        id,company_id,branch_id,document_number,document_date,posting_date,due_date,
        customer_id,currency_code,exchange_rate,status,subtotal,tax_total,total,
        outstanding_balance,notes,created_by,updated_by
      ) values (
        v_invoice_id,p_company_id,v_branch_id,'DRAFT-'||upper(substr(replace(v_invoice_id::text,'-',''),1,12)),
        v_date,v_posting_date,v_due_date,v_contact_id,
        upper(coalesce(nullif(p_header->>'currency_code',''),'IDR')),
        coalesce(nullif(p_header->>'exchange_rate','')::numeric,1),'draft',
        v_subtotal,v_tax,v_total,0,nullif(trim(p_header->>'notes'),''),auth.uid(),auth.uid()
      );
    else
      update public.sales_invoices set
        branch_id=v_branch_id,document_date=v_date,posting_date=v_posting_date,
        due_date=v_due_date,customer_id=v_contact_id,
        currency_code=upper(coalesce(nullif(p_header->>'currency_code',''),'IDR')),
        exchange_rate=coalesce(nullif(p_header->>'exchange_rate','')::numeric,1),
        status='draft',subtotal=v_subtotal,tax_total=v_tax,total=v_total,
        outstanding_balance=0,notes=nullif(trim(p_header->>'notes'),''),updated_by=auth.uid()
      where id=v_invoice_id and company_id=p_company_id;
      delete from public.sales_invoice_lines where invoice_id=v_invoice_id and company_id=p_company_id;
    end if;
  else
    if p_invoice_id is null then
      insert into public.purchase_invoices(
        id,company_id,branch_id,document_number,supplier_reference,document_date,
        posting_date,due_date,supplier_id,status,subtotal,tax_total,total,
        outstanding_balance,notes,created_by,updated_by
      ) values (
        v_invoice_id,p_company_id,v_branch_id,'DRAFT-'||upper(substr(replace(v_invoice_id::text,'-',''),1,12)),
        nullif(trim(p_header->>'supplier_reference'),''),v_date,v_posting_date,
        v_due_date,v_contact_id,'draft',v_subtotal,v_tax,v_total,0,
        nullif(trim(p_header->>'notes'),''),auth.uid(),auth.uid()
      );
    else
      update public.purchase_invoices set
        branch_id=v_branch_id,supplier_reference=nullif(trim(p_header->>'supplier_reference'),''),
        document_date=v_date,posting_date=v_posting_date,due_date=v_due_date,
        supplier_id=v_contact_id,status='draft',subtotal=v_subtotal,tax_total=v_tax,
        total=v_total,outstanding_balance=0,notes=nullif(trim(p_header->>'notes'),''),updated_by=auth.uid()
      where id=v_invoice_id and company_id=p_company_id;
      delete from public.purchase_invoice_lines where invoice_id=v_invoice_id and company_id=p_company_id;
    end if;
  end if;

  v_line_number := 0;
  for v_line in select value from jsonb_array_elements(p_lines)
  loop
    v_line_number := v_line_number + 1;
    v_quantity := (v_line->>'quantity')::numeric;
    v_price := (v_line->>'unit_price')::numeric;
    v_discount := coalesce(nullif(v_line->>'discount_amount','')::numeric, 0);
    v_warehouse_id := nullif(v_line->>'warehouse_id','')::uuid;
    v_tax_rate_id := nullif(v_line->>'tax_rate_version_id','')::uuid;
    select * into v_product from public.products
    where id = (v_line->>'product_id')::uuid and company_id = p_company_id;
    v_account_id := case when p_document_type='sales_invoice'
      then v_product.sales_account_id else v_product.purchase_account_id end;
    if p_document_type='sales_invoice' then
      insert into public.sales_invoice_lines(
        company_id,invoice_id,line_number,product_id,warehouse_id,description,
        quantity,unit_price,discount_amount,tax_rate_version_id,revenue_account_id,created_by,updated_by
      ) values (
        p_company_id,v_invoice_id,v_line_number,v_product.id,v_warehouse_id,
        coalesce(nullif(trim(v_line->>'description'),''),v_product.name),v_quantity,
        v_price,v_discount,v_tax_rate_id,v_account_id,auth.uid(),auth.uid()
      );
    else
      insert into public.purchase_invoice_lines(
        company_id,invoice_id,line_number,product_id,warehouse_id,description,
        quantity,unit_cost,discount_amount,tax_rate_version_id,expense_account_id,created_by,updated_by
      ) values (
        p_company_id,v_invoice_id,v_line_number,v_product.id,v_warehouse_id,
        coalesce(nullif(trim(v_line->>'description'),''),v_product.name),v_quantity,
        v_price,v_discount,v_tax_rate_id,v_account_id,auth.uid(),auth.uid()
      );
    end if;
  end loop;

  insert into public.audit_logs(
    company_id,actor_user_id,action,entity_type,entity_id,document_number,before_data,after_data
  ) values (
    p_company_id,auth.uid(),case when p_invoice_id is null then 'create' else 'update' end,
    p_document_type,v_invoice_id,
    case when p_document_type='sales_invoice'
      then (select document_number from public.sales_invoices where id=v_invoice_id)
      else (select document_number from public.purchase_invoices where id=v_invoice_id) end,
    v_before,jsonb_build_object('subtotal',v_subtotal::text,'tax_total',v_tax::text,'total',v_total::text,'line_count',v_line_number)
  );
  return v_invoice_id;
end;
$$;

create or replace function public.delete_invoice_draft(
  p_company_id uuid,
  p_document_type text,
  p_invoice_id uuid,
  p_version integer
)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_document_number text;
  v_permission text;
begin
  v_permission := case p_document_type
    when 'sales_invoice' then 'sales.update'
    when 'purchase_invoice' then 'purchase.update'
    else null
  end;
  if auth.uid() is null or v_permission is null
     or not public.current_user_has_permission(p_company_id,v_permission) then
    raise exception using message = 'Tidak memiliki izin menghapus draft.';
  end if;
  if exists (
    select 1 from public.approval_requests
    where company_id=p_company_id and document_type=p_document_type and document_id=p_invoice_id
  ) then
    raise exception using message = 'Dokumen yang pernah diajukan tidak boleh dihapus. Gunakan pembatalan atau reversal.';
  end if;
  if p_document_type='sales_invoice' then
    select document_number into v_document_number from public.sales_invoices
    where id=p_invoice_id and company_id=p_company_id and status='draft' and version=p_version for update;
    if not found then raise exception using message='Draft tidak ditemukan atau telah berubah.'; end if;
    delete from public.sales_invoice_lines where invoice_id=p_invoice_id and company_id=p_company_id;
    delete from public.sales_invoices where id=p_invoice_id and company_id=p_company_id;
  else
    select document_number into v_document_number from public.purchase_invoices
    where id=p_invoice_id and company_id=p_company_id and status='draft' and version=p_version for update;
    if not found then raise exception using message='Draft tidak ditemukan atau telah berubah.'; end if;
    delete from public.purchase_invoice_lines where invoice_id=p_invoice_id and company_id=p_company_id;
    delete from public.purchase_invoices where id=p_invoice_id and company_id=p_company_id;
  end if;
  insert into public.audit_logs(company_id,actor_user_id,action,entity_type,entity_id,document_number)
  values(p_company_id,auth.uid(),'delete_draft',p_document_type,p_invoice_id,v_document_number);
end;
$$;

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
  v_permission text;
  v_request_id uuid;
  v_workflow_id uuid;
begin
  if auth.uid() is null then raise exception using message = 'Autentikasi diperlukan.'; end if;
  v_permission := case p_document_type when 'sales_invoice' then 'sales.submit' when 'purchase_invoice' then 'purchase.submit' else null end;
  if v_permission is null or not public.current_user_has_permission(p_company_id, v_permission) then raise exception using message = 'Tidak memiliki izin submit dokumen.'; end if;

  if p_document_type = 'sales_invoice' then
    select document_number into v_document_number from public.sales_invoices
    where id=p_document_id and company_id=p_company_id and status in ('draft','rejected') and total>0
      and exists(select 1 from public.sales_invoice_lines where invoice_id=p_document_id)
    for update;
    if not found then raise exception using message = 'Draft invoice penjualan tidak ditemukan atau belum valid.'; end if;
    if v_document_number like 'DRAFT-%' then
      v_document_number := public.next_document_number(p_company_id,'SI',current_date,
        (select branch_id from public.sales_invoices where id=p_document_id));
      update public.sales_invoices set document_number=v_document_number,updated_by=auth.uid() where id=p_document_id;
    end if;
  elsif p_document_type = 'purchase_invoice' then
    select document_number into v_document_number from public.purchase_invoices
    where id=p_document_id and company_id=p_company_id and status in ('draft','rejected') and total>0
      and exists(select 1 from public.purchase_invoice_lines where invoice_id=p_document_id)
    for update;
    if not found then raise exception using message = 'Draft invoice pembelian tidak ditemukan atau belum valid.'; end if;
    if v_document_number like 'DRAFT-%' then
      v_document_number := public.next_document_number(p_company_id,'PI',current_date,
        (select branch_id from public.purchase_invoices where id=p_document_id));
      update public.purchase_invoices set document_number=v_document_number,updated_by=auth.uid() where id=p_document_id;
    end if;
  else
    raise exception using message = 'Jenis dokumen tidak valid.';
  end if;

  select id into v_workflow_id from public.approval_workflows
  where company_id=p_company_id and document_type=p_document_type and is_active
  order by created_at limit 1;
  insert into public.approval_requests(company_id,document_type,document_id,document_number,workflow_id,submitted_by,created_by)
  values(p_company_id,p_document_type,p_document_id,v_document_number,v_workflow_id,auth.uid(),auth.uid())
  on conflict(company_id,document_type,document_id) do update set
    document_number=excluded.document_number,status='pending',submitted_by=auth.uid(),submitted_at=now(),current_step=1,completed_at=null
  returning id into v_request_id;
  insert into public.approval_actions(company_id,request_id,step,action,actor_user_id)
  values(p_company_id,v_request_id,0,'submit',auth.uid());
  if p_document_type='sales_invoice' then
    update public.sales_invoices set status='pending_approval',submitted_by=auth.uid(),submitted_at=now(),updated_by=auth.uid() where id=p_document_id;
  else
    update public.purchase_invoices set status='pending_approval',submitted_by=auth.uid(),submitted_at=now(),updated_by=auth.uid() where id=p_document_id;
  end if;
  insert into public.audit_logs(company_id,actor_user_id,action,entity_type,entity_id,document_number)
  values(p_company_id,auth.uid(),'submit',p_document_type,p_document_id,v_document_number);
  return v_request_id;
end;
$$;

drop trigger if exists audit_sales_invoices on public.sales_invoices;
create trigger audit_sales_invoices after insert or update or delete on public.sales_invoices
for each row execute function public.audit_row_change();
drop trigger if exists audit_purchase_invoices on public.purchase_invoices;
create trigger audit_purchase_invoices after insert or update or delete on public.purchase_invoices
for each row execute function public.audit_row_change();

revoke all on function public.save_invoice_draft(uuid,text,uuid,integer,jsonb,jsonb) from public,anon;
revoke all on function public.delete_invoice_draft(uuid,text,uuid,integer) from public,anon;
grant execute on function public.save_invoice_draft(uuid,text,uuid,integer,jsonb,jsonb) to authenticated;
grant execute on function public.delete_invoice_draft(uuid,text,uuid,integer) to authenticated;

commit;
