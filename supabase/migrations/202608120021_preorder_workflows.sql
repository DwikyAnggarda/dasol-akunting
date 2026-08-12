begin;

alter table public.operational_documents drop constraint operational_documents_document_type_check;
alter table public.operational_documents add constraint operational_documents_document_type_check
  check(document_type in('sales_quotation','sales_order','sales_delivery','purchase_request','purchase_order','goods_receipt'));

create or replace function public.next_operational_number(p_company_id uuid,p_document_date date,p_branch_id uuid,p_document_type text)
returns text language plpgsql volatile security definer set search_path='' as $$
declare v_sequence public.document_sequences%rowtype;v_period text;v_value bigint;v_number text;v_width integer;v_code text:=case p_document_type when 'sales_quotation' then 'SQ' when 'sales_order' then 'SO' when 'sales_delivery' then 'SD' when 'purchase_request' then 'PR' when 'purchase_order' then 'PO' when 'goods_receipt' then 'GR' end;
begin
 if v_code is null then raise exception using message='Tipe dokumen operasional tidak valid.';end if;
 select * into v_sequence from public.document_sequences where company_id=p_company_id and document_type=v_code and branch_scope=coalesce(p_branch_id,'00000000-0000-0000-0000-000000000000'::uuid) for update;
 if not found then insert into public.document_sequences(company_id,branch_id,document_type,pattern,reset_frequency,created_by) values(p_company_id,p_branch_id,v_code,v_code||'-{YYYY}-{MM}-{####}','monthly',auth.uid()) returning * into v_sequence;end if;
 v_period:=to_char(p_document_date,'YYYY-MM');if v_sequence.current_period is distinct from v_period then v_value:=1;else v_value:=v_sequence.next_value;end if;update public.document_sequences set current_period=v_period,next_value=v_value+1 where id=v_sequence.id;
 v_number:=replace(replace(v_sequence.pattern,'{YYYY}',to_char(p_document_date,'YYYY')),'{MM}',to_char(p_document_date,'MM'));v_width:=coalesce(length((regexp_match(v_number,'\{(#+)\}'))[1]),0);return regexp_replace(v_number,'\{#+\}',lpad(v_value::text,v_width,'0'));
end;$$;

create or replace function public.save_operational_document(p_company_id uuid,p_document_id uuid,p_document_type text,p_header jsonb,p_lines jsonb,p_version integer default null)
returns uuid language plpgsql volatile security definer set search_path='' as $$
declare v_id uuid;v_current public.operational_documents%rowtype;v_line record;v_no integer:=0;v_total numeric(24,4):=0;v_domain text:=case when p_document_type like 'sales_%' then 'sales' else 'purchase' end;v_source_doc uuid;
 v_branch uuid:=(p_header->>'branch_id')::uuid;v_contact uuid:=(p_header->>'contact_id')::uuid;v_date date:=(p_header->>'document_date')::date;v_notes text:=nullif(trim(p_header->>'notes'),'');
begin
 if p_document_type not in('sales_quotation','sales_order','sales_delivery','purchase_request','purchase_order','goods_receipt') or not public.current_user_has_permission(p_company_id,v_domain||case when p_document_id is null then '.create' else '.update' end) then raise exception using errcode='42501',message='Tidak memiliki izin menyimpan dokumen.';end if;
 if not exists(select 1 from public.branches where company_id=p_company_id and id=v_branch and is_active) then raise exception using message='Cabang aktif tidak ditemukan.';end if;
 if not exists(select 1 from public.contacts where company_id=p_company_id and id=v_contact and is_active and(case when v_domain='sales' then contact_type in('customer','both') else contact_type in('supplier','both') end)) then raise exception using message='Kontak aktif tidak valid.';end if;
 if jsonb_typeof(p_lines)<>'array' or jsonb_array_length(p_lines)=0 or jsonb_array_length(p_lines)>200 then raise exception using message='Dokumen wajib memiliki 1 sampai 200 baris.';end if;
 if p_document_id is null then insert into public.operational_documents(company_id,branch_id,document_type,document_number,document_date,contact_id,notes,created_by) values(p_company_id,v_branch,p_document_type,'DRAFT-'||upper(substr(p_document_type,1,2))||'-'||substr(gen_random_uuid()::text,1,8),v_date,v_contact,v_notes,auth.uid()) returning id into v_id;
 else select * into v_current from public.operational_documents where company_id=p_company_id and id=p_document_id and document_type=p_document_type for update;if not found or v_current.status not in('draft','rejected') then raise exception using message='Draft tidak ditemukan.';end if;if v_current.version<>p_version then raise exception using errcode='40001',message='Dokumen telah diubah pengguna lain.';end if;v_source_doc:=v_current.source_document_id;update public.operational_documents set branch_id=v_branch,document_date=v_date,contact_id=v_contact,notes=v_notes,status='draft',rejection_reason=null,updated_by=auth.uid() where id=p_document_id;delete from public.operational_document_lines where document_id=p_document_id;v_id:=p_document_id;end if;
 for v_line in select * from jsonb_to_recordset(p_lines) as x(source_line_id uuid,product_id uuid,warehouse_id uuid,description text,quantity numeric,unit_amount numeric)
 loop v_no:=v_no+1;if v_line.quantity<=0 or v_line.unit_amount<0 or length(trim(v_line.description))<2 then raise exception using message='Baris dokumen tidak valid.';end if;
  if not exists(select 1 from public.products where company_id=p_company_id and id=v_line.product_id and product_type='inventory' and is_active) or not exists(select 1 from public.warehouses where company_id=p_company_id and id=v_line.warehouse_id and branch_id=v_branch and is_active) then raise exception using message='Produk atau gudang tidak valid.';end if;
  if v_source_doc is not null and p_document_type in('sales_delivery','goods_receipt') and not exists(select 1 from public.operational_document_lines source where source.id=v_line.source_line_id and source.document_id=v_source_doc and source.product_id=v_line.product_id and v_line.quantity<=source.quantity-source.fulfilled_quantity) then raise exception using message='Baris konversi melebihi sisa order.';end if;
  insert into public.operational_document_lines(company_id,document_id,line_number,source_line_id,product_id,warehouse_id,description,quantity,unit_amount,total,created_by) values(p_company_id,v_id,v_no,case when v_source_doc is null or p_document_type in('sales_order','purchase_order') then null else v_line.source_line_id end,v_line.product_id,v_line.warehouse_id,trim(v_line.description),v_line.quantity,v_line.unit_amount,round(v_line.quantity*v_line.unit_amount,4),auth.uid());v_total:=v_total+round(v_line.quantity*v_line.unit_amount,4);
 end loop;update public.operational_documents set total=v_total where id=v_id;return v_id;
end;$$;

create or replace function public.convert_operational_document(p_company_id uuid,p_source_id uuid)
returns uuid language plpgsql volatile security definer set search_path='' as $$
declare v_source public.operational_documents%rowtype;v_target_type text;v_domain text;v_target uuid;v_line record;v_no integer:=0;v_total numeric:=0;v_is_preorder boolean;
begin
 select * into v_source from public.operational_documents where company_id=p_company_id and id=p_source_id and document_type in('sales_quotation','sales_order','purchase_request','purchase_order') and status='approved' for update;if not found then raise exception using message='Dokumen approved tidak ditemukan.';end if;
 v_domain:=case when v_source.document_type like 'sales_%' then 'sales' else 'purchase' end;
 v_target_type:=case v_source.document_type when 'sales_quotation' then 'sales_order' when 'sales_order' then 'sales_delivery' when 'purchase_request' then 'purchase_order' else 'goods_receipt' end;
 v_is_preorder:=v_source.document_type in('sales_quotation','purchase_request');
 if not public.current_user_has_permission(p_company_id,v_domain||'.create') then raise exception using errcode='42501',message='Tidak memiliki izin konversi dokumen.';end if;
 insert into public.operational_documents(company_id,branch_id,document_type,document_number,document_date,contact_id,source_document_id,notes,created_by) values(p_company_id,v_source.branch_id,v_target_type,'DRAFT-'||upper(substr(v_target_type,1,2))||'-'||substr(gen_random_uuid()::text,1,8),current_date,v_source.contact_id,p_source_id,'Konversi dari '||v_source.document_number,auth.uid()) returning id into v_target;
 for v_line in select * from public.operational_document_lines where document_id=p_source_id and (v_is_preorder or fulfilled_quantity<quantity) order by line_number loop
  v_no:=v_no+1;insert into public.operational_document_lines(company_id,document_id,line_number,source_line_id,product_id,warehouse_id,description,quantity,unit_amount,total,created_by) values(p_company_id,v_target,v_no,case when v_is_preorder then null else v_line.id end,v_line.product_id,v_line.warehouse_id,v_line.description,case when v_is_preorder then v_line.quantity else v_line.quantity-v_line.fulfilled_quantity end,v_line.unit_amount,case when v_is_preorder then v_line.total else round((v_line.quantity-v_line.fulfilled_quantity)*v_line.unit_amount,4) end,auth.uid());v_total:=v_total+case when v_is_preorder then v_line.total else round((v_line.quantity-v_line.fulfilled_quantity)*v_line.unit_amount,4) end;
 end loop;
 if v_no=0 then raise exception using message='Dokumen tidak memiliki kuantitas tersisa.';end if;
 update public.operational_documents set total=v_total where id=v_target;
 if v_is_preorder then update public.operational_document_lines set fulfilled_quantity=quantity where document_id=p_source_id;update public.operational_documents set status='completed',closed_reason='Dikonversi menjadi '||v_target_type,updated_by=auth.uid() where id=p_source_id;end if;
 return v_target;
end;$$;

commit;
