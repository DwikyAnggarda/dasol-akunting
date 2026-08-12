begin;

create or replace function public.save_return_document(p_company_id uuid,p_return_id uuid,p_return_type text,p_source_invoice_id uuid,p_return_date date,p_reason text,p_lines jsonb,p_version integer default null)
returns uuid language plpgsql volatile security definer set search_path='' as $$
declare v_id uuid;v_doc public.return_documents%rowtype;v_source record;v_line record;v_original record;v_no integer:=0;v_net numeric;v_tax numeric;v_subtotal numeric:=0;v_tax_total numeric:=0;v_domain text:=case p_return_type when 'sales_return' then 'sales' else 'purchase' end;
begin
 if p_return_type not in('sales_return','purchase_return') or not public.current_user_has_permission(p_company_id,v_domain||case when p_return_id is null then '.create' else '.update' end) then raise exception using errcode='42501',message='Tidak memiliki izin menyimpan retur.';end if;
 if length(trim(p_reason))<5 or jsonb_typeof(p_lines)<>'array' or jsonb_array_length(p_lines)=0 then raise exception using message='Alasan dan baris retur wajib diisi.';end if;
 if p_return_type='sales_return' then select id,branch_id,customer_id contact_id into v_source from public.sales_invoices where company_id=p_company_id and id=p_source_invoice_id and status in('posted','partially_paid','paid');else select id,branch_id,supplier_id contact_id into v_source from public.purchase_invoices where company_id=p_company_id and id=p_source_invoice_id and status in('posted','partially_paid','paid');end if;
 if not found then raise exception using message='Invoice posted tidak ditemukan.';end if;
 if p_return_id is null then
  insert into public.return_documents(company_id,branch_id,return_type,document_number,return_date,source_invoice_id,contact_id,reason,created_by) values(p_company_id,v_source.branch_id,p_return_type,'DRAFT-'||upper(substr(p_return_type,1,2))||'-'||substr(gen_random_uuid()::text,1,8),p_return_date,p_source_invoice_id,v_source.contact_id,trim(p_reason),auth.uid()) returning id into v_id;
 else
  select * into v_doc from public.return_documents where company_id=p_company_id and id=p_return_id and return_type=p_return_type for update;
  if not found or v_doc.status not in('draft','rejected') or v_doc.version<>p_version then raise exception using message='Draft retur berubah atau tidak ditemukan.';end if;
  update public.return_documents set return_date=p_return_date,reason=trim(p_reason),status='draft',rejection_reason=null,updated_by=auth.uid() where id=p_return_id;delete from public.return_document_lines where return_id=p_return_id;v_id:=p_return_id;
 end if;
 for v_line in select * from jsonb_to_recordset(p_lines) as x(source_line_id uuid,warehouse_id uuid,quantity numeric) loop
  v_no:=v_no+1;
  if p_return_type='sales_return' then
   select line.id,line.product_id,line.description,line.quantity,line.unit_price unit_amount,line.discount_amount,line.revenue_account_id account_id,coalesce(tax.rate,0) tax_rate,code.output_account_id tax_account
   into v_original from public.sales_invoice_lines line left join public.tax_rate_versions tax on tax.id=line.tax_rate_version_id left join public.tax_codes code on code.id=tax.tax_code_id
   where line.company_id=p_company_id and line.invoice_id=p_source_invoice_id and line.id=v_line.source_line_id;
  else
   select line.id,line.product_id,line.description,line.quantity,line.unit_cost unit_amount,line.discount_amount,line.expense_account_id account_id,coalesce(tax.rate,0) tax_rate,code.input_account_id tax_account
   into v_original from public.purchase_invoice_lines line left join public.tax_rate_versions tax on tax.id=line.tax_rate_version_id left join public.tax_codes code on code.id=tax.tax_code_id
   where line.company_id=p_company_id and line.invoice_id=p_source_invoice_id and line.id=v_line.source_line_id;
  end if;
  if not found or v_line.quantity<=0 then raise exception using message='Baris sumber retur tidak valid.';end if;
  if v_line.quantity+coalesce((select sum(existing.quantity) from public.return_document_lines existing join public.return_documents document on document.id=existing.return_id where existing.source_line_id=v_line.source_line_id and document.status in('pending_approval','approved','posted') and document.id<>coalesce(p_return_id,'00000000-0000-0000-0000-000000000000'::uuid)),0)>v_original.quantity then raise exception using message='Kuantitas retur melebihi invoice.';end if;
  if exists(select 1 from public.products where id=v_original.product_id and product_type='inventory') and(v_line.warehouse_id is null or not exists(select 1 from public.warehouses where company_id=p_company_id and id=v_line.warehouse_id and is_active)) then raise exception using message='Gudang wajib untuk produk inventory.';end if;
  v_net:=round(v_line.quantity/v_original.quantity*(v_original.quantity*v_original.unit_amount-v_original.discount_amount),4);v_tax:=round(v_net*v_original.tax_rate/100,4);v_subtotal:=v_subtotal+v_net;v_tax_total:=v_tax_total+v_tax;
  insert into public.return_document_lines(company_id,return_id,line_number,source_line_id,product_id,warehouse_id,description,quantity,unit_amount,discount_amount,net_amount,tax_amount,total,account_id,tax_account_id,created_by)
  values(p_company_id,v_id,v_no,v_line.source_line_id,v_original.product_id,v_line.warehouse_id,v_original.description,v_line.quantity,v_original.unit_amount,round(v_line.quantity/v_original.quantity*v_original.discount_amount,4),v_net,v_tax,v_net+v_tax,v_original.account_id,v_original.tax_account,auth.uid());
 end loop;
 update public.return_documents set subtotal=v_subtotal,tax_total=v_tax_total,total=v_subtotal+v_tax_total where id=v_id;return v_id;
end;$$;

commit;
