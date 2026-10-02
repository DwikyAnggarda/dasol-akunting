begin;

-- Explicit POS authorization; accounting approval settings are unchanged.
insert into public.permissions(code,description) values
 ('pos.direct','Post own POS sales and stock additions without a separate reviewer') on conflict(code) do nothing;
insert into public.role_permissions(company_id,role_id,permission_id)
 select r.company_id,r.id,p.id from public.roles r cross join public.permissions p
 where r.code='administrator' and p.code='pos.direct' on conflict do nothing;
alter table public.pos_registers add column direct_enabled boolean not null default false,
 add column qris_demo_enabled boolean not null default false,
 add column qris_bank_account_id uuid,
 add constraint pos_qris_bank_company_fk foreign key(company_id,qris_bank_account_id) references public.bank_accounts(company_id,id);
alter table public.pos_register_products add column archived_at timestamptz,
 add column image_path text, add column category text not null default 'Lainnya' check(length(category) between 1 and 40),
 add column updated_at timestamptz, add column updated_by uuid references auth.users(id),
 add column version integer not null default 1;
create trigger pos_products_updated before update on public.pos_register_products for each row execute function public.set_updated_metadata();
create trigger pos_products_audit after insert or update or delete on public.pos_register_products for each row execute function public.audit_row_change();
alter table public.pos_requests add column completion_mode text not null default 'reviewed' check(completion_mode in('reviewed','direct')),
 add column payment_method text not null default 'cash' check(payment_method in('cash','qris_demo')),
 add column payment_reference text;
do $$declare c record;begin
 for c in select conname from pg_constraint where conrelid='public.pos_requests'::regclass and contype='c' and pg_get_constraintdef(oid) like '%approved_by <> submitted_by%' loop
   execute format('alter table public.pos_requests drop constraint %I',c.conname);
 end loop;
end;$$;
alter table public.pos_requests add constraint pos_completion_actor_check check(status<>'completed' or
 (approved_by is not null and completed_at is not null and journal_id is not null and
 ((completion_mode='reviewed' and approved_by<>submitted_by) or (completion_mode='direct' and approved_by=submitted_by))));
create unique index pos_qris_reference_unique on public.pos_requests(company_id,payment_reference) where payment_method='qris_demo';

create function public.pos_authorize_direct(p_request_id uuid)
returns void language plpgsql security definer set search_path='' as $$
declare q public.pos_requests;r public.pos_registers;
begin
 select * into q from public.pos_requests where id=p_request_id for update;
 r:=public.pos_guard(q.register_id,'pos.direct');
 if q.submitted_by<>auth.uid() or q.completion_mode<>'direct' or q.status<>'pending' or not r.direct_enabled then
   raise exception using errcode='42501',message='Posting langsung POS tidak diizinkan.';end if;
 -- Same actor is recorded truthfully. This is direct POS authorization, not a second-person approval.
 insert into public.approval_actions(company_id,request_id,step,action,actor_user_id,comment)
 select company_id,id,1,'approve',auth.uid(),'Otorisasi langsung POS oleh kasir berizin pos.direct'
 from public.approval_requests where company_id=q.company_id and document_id in(q.invoice_id,q.delivery_id,q.adjustment_id) and status='pending';
 update public.approval_requests set status='approved',completed_at=now()
 where company_id=q.company_id and document_id in(q.invoice_id,q.delivery_id,q.adjustment_id) and status='pending';
 update public.sales_invoices set status='approved',approved_by=auth.uid(),approved_at=now(),updated_by=auth.uid() where id=q.invoice_id and status='pending_approval';
 update public.operational_documents set status='approved',approved_by=auth.uid(),approved_at=now(),updated_by=auth.uid() where id=q.delivery_id and status='pending_approval';
 update public.inventory_adjustments set status='approved',approved_by=auth.uid(),approved_at=now(),updated_by=auth.uid() where id=q.adjustment_id and status='pending_approval';
end;$$;
revoke all on function public.pos_authorize_direct(uuid) from public,anon,authenticated;

-- The private finalizer below retains the validated v1 posting/locking logic.
create function public.pos_finalize_direct(p_register_id uuid,p_request_id uuid)
returns uuid language plpgsql security definer set search_path='' as $$
declare r public.pos_registers;q public.pos_requests;i public.sales_invoices;b public.product_warehouses;
  v_date date;v_line record;v_approval uuid;v_journal uuid;v_delivery_journal uuid;v_receipt uuid;v_receipt_journal uuid;
  v_ar_account uuid;v_ar uuid;v_total numeric;v_number text;v_no integer:=1;v_debit numeric;v_credit numeric;
begin
  r:=public.pos_guard(p_register_id,'pos.direct');
  if not r.direct_enabled then raise exception using errcode='42501',message='Posting langsung POS tidak aktif.';end if;
  select * into q from public.pos_requests where id=p_request_id and register_id=r.id for update;
  if not found or q.submitted_by<>auth.uid() or q.completion_mode<>'direct' then raise exception using errcode='42501',message='Transaksi POS bukan milik Anda.';end if;
  if q.status='completed' then return q.id;end if;
  if q.status<>'pending' then raise exception using message='Transaksi telah dibatalkan.';end if;
  perform 1 from public.sales_invoices where id=q.invoice_id for update;
  perform 1 from public.operational_documents where id=q.delivery_id for update;
  perform 1 from public.inventory_adjustments where id=q.adjustment_id for update;
  perform 1 from public.sales_invoice_lines where invoice_id=q.invoice_id for update;
  perform 1 from public.operational_document_lines where document_id=q.delivery_id for update;
  perform 1 from public.inventory_adjustment_lines where adjustment_id=q.adjustment_id for update;
  if public.pos_document_snapshot(q.invoice_id,q.delivery_id,q.adjustment_id) is distinct from q.document_snapshot then
    raise exception using message='Dokumen POS berubah di akuntansi. Periksa dokumen sebelum melanjutkan.';
  end if;
  if not exists(select 1 from public.contacts where id=r.customer_id and company_id=r.company_id and is_active and deleted_at is null and contact_type in('customer','both'))
     or not exists(select 1 from public.bank_accounts ba join public.chart_of_accounts a on a.id=ba.gl_account_id and a.company_id=ba.company_id
       where ba.id=case q.payment_method when 'qris_demo' then r.qris_bank_account_id else r.bank_account_id end and ba.company_id=r.company_id and ba.is_active and ba.account_type=case q.payment_method when 'qris_demo' then 'bank' else 'cash' end and ba.currency_code='IDR' and a.is_active and a.account_type='asset') then
    raise exception using message='Konfigurasi pelanggan atau kas POS tidak aktif.';
  end if;
  if q.kind='sale' then
    select * into i from public.sales_invoices where id=q.invoice_id and company_id=r.company_id for update;
    v_date:=i.posting_date;
    if i.status<>'pending_approval' then raise exception using message='Status invoice berubah; periksa di akuntansi.';end if;
    perform 1 from public.pos_sessions where id=q.session_id and register_id=r.id and closed_at is null for update;
    if not found then raise exception using message='Sesi kasir telah ditutup.';end if;
    -- Verify the persisted invoice still agrees with the POS request before approval.
    select sum(quantity*unit_price-discount_amount) into v_total from public.sales_invoice_lines where invoice_id=i.id and company_id=r.company_id;
    if v_total is distinct from q.total or i.total<>q.total or i.tax_total<>0 or i.customer_id<>r.customer_id or i.branch_id<>r.branch_id
      or i.currency_code<>'IDR' or i.exchange_rate<>1 or exists(select 1 from public.sales_invoice_lines where invoice_id=i.id and (tax_rate_version_id is not null or discount_amount<>0)) then raise exception using message='Snapshot invoice POS tidak sesuai.';end if;
  else
    select adjustment_date into v_date from public.inventory_adjustments where id=q.adjustment_id and company_id=r.company_id and status='pending_approval' for update;
    if not found then raise exception using message='Status penambahan stok berubah; periksa di akuntansi.';end if;
  end if;
  perform 1 from public.accounting_periods where company_id=r.company_id and v_date between starts_on and ends_on and status='open' for share;
  if not found then raise exception using message='Periode akuntansi tidak terbuka.';end if;
  -- One register lock serializes the POS boundary; stock locks protect other clients too.
  for v_line in select (value->>'product_id')::uuid as product_id,(value->>'quantity')::numeric as quantity from jsonb_array_elements(q.payload->'lines') order by value->>'product_id' loop
    insert into public.product_warehouses(company_id,product_id,warehouse_id,created_by) values(r.company_id,v_line.product_id,r.warehouse_id,auth.uid()) on conflict(company_id,product_id,warehouse_id) do nothing;
    select * into b from public.product_warehouses where company_id=r.company_id and product_id=v_line.product_id and warehouse_id=r.warehouse_id for update;
    if b.last_movement_date>v_date then raise exception using message='Transaksi mundur sebelum pergerakan stok terakhir ditolak.';end if;
    if q.kind='sale' and (b.quantity_on_hand-b.quantity_reserved<v_line.quantity or b.average_cost<=0) then raise exception using message='Stok tersedia atau nilai perolehan tidak mencukupi.';end if;
  end loop;
  perform public.pos_authorize_direct(q.id);
  if q.kind='stock' then
    v_journal:=public.post_inventory_adjustment(r.company_id,q.adjustment_id,'pos-stock:'||q.id);
  else
    v_delivery_journal:=public.post_operational_fulfillment(r.company_id,q.delivery_id,'pos-delivery:'||q.id);
    select account_id into v_ar_account from public.account_mappings where company_id=r.company_id and mapping_code='accounts_receivable';
    if v_ar_account is null or not exists(select 1 from public.chart_of_accounts where company_id=r.company_id and id=v_ar_account and is_active and account_type='asset' and is_control_account) then raise exception using message='Pemetaan piutang belum tersedia.';end if;
    v_number:=public.next_document_number(r.company_id,'SJV',v_date,r.branch_id);
    insert into public.journal_entries(company_id,branch_id,journal_number,document_date,journal_date,posting_date,description,status,source_type,source_id,total_debit,total_credit,idempotency_key,approved_by,approved_at,posted_by,posted_at,created_by)
    values(r.company_id,r.branch_id,v_number,v_date,v_date,v_date,'Penjualan POS '||i.document_number,'draft','sales_invoice',i.id,q.total,q.total,'pos-invoice:'||q.id,auth.uid(),now(),auth.uid(),now(),auth.uid()) returning id into v_journal;
    insert into public.journal_lines(company_id,journal_entry_id,account_id,line_number,description,debit,credit,base_debit,base_credit,contact_id,branch_id,created_by)
    values(r.company_id,v_journal,v_ar_account,1,'Piutang POS',q.total,0,q.total,0,r.customer_id,r.branch_id,auth.uid());
    for v_line in select * from public.sales_invoice_lines where invoice_id=i.id order by line_number loop
      if not exists(select 1 from public.chart_of_accounts where company_id=r.company_id and id=v_line.revenue_account_id and is_active and account_type='revenue') then raise exception using message='Akun pendapatan tidak aktif.';end if;
      v_no:=v_no+1;
      insert into public.journal_lines(company_id,journal_entry_id,account_id,line_number,description,debit,credit,base_debit,base_credit,contact_id,branch_id,created_by)
      values(r.company_id,v_journal,v_line.revenue_account_id,v_no,v_line.description,0,v_line.quantity*v_line.unit_price,0,v_line.quantity*v_line.unit_price,r.customer_id,r.branch_id,auth.uid());
    end loop;
    select sum(debit),sum(credit) into v_debit,v_credit from public.journal_lines where journal_entry_id=v_journal;
    if v_debit is distinct from q.total or v_credit is distinct from q.total then raise exception using message='Jurnal POS tidak seimbang.';end if;
    update public.journal_entries set status='posted' where id=v_journal;
    update public.sales_invoices set status='posted',outstanding_balance=q.total,posted_by=auth.uid(),posted_at=now(),updated_by=auth.uid() where id=i.id;
    insert into public.accounts_receivable(company_id,customer_id,sales_invoice_id,document_number,document_date,due_date,original_amount,outstanding_amount,created_by)
    values(r.company_id,r.customer_id,i.id,i.document_number,i.document_date,i.due_date,q.total,q.total,auth.uid()) returning id into v_ar;
    -- Reuse the existing receipt posting function; its failure rolls back the entire checkout.
    insert into public.customer_receipts(company_id,branch_id,document_number,receipt_date,customer_id,bank_account_id,amount,notes,created_by)
    values(r.company_id,r.branch_id,'POS-'||q.id,v_date,r.customer_id,case q.payment_method when 'qris_demo' then r.qris_bank_account_id else r.bank_account_id end,q.total,case q.payment_method when 'qris_demo' then 'SIMULASI QRIS POS - tidak ada perpindahan dana; '||q.payment_reference else 'Tunai POS; diterima '||q.received::text end,auth.uid()) returning id into v_receipt;
    insert into public.customer_receipt_allocations(company_id,receipt_id,receivable_id,allocated_amount,created_by) values(r.company_id,v_receipt,v_ar,q.total,auth.uid());
    v_receipt_journal:=public.post_customer_receipt(r.company_id,v_receipt,'pos-receipt:'||q.id);
  end if;
  -- Check all resulting journals, including legacy RPC output, before commit.
  if v_journal is null or (q.kind='sale' and (v_delivery_journal is null or v_receipt_journal is null)) then raise exception using message='Jurnal POS belum lengkap.';end if;
  for v_line in select j.id,j.total_debit,j.total_credit,sum(l.debit) as debit,sum(l.credit) as credit from public.journal_entries j
    join public.journal_lines l on l.journal_entry_id=j.id where j.id in(v_journal,v_delivery_journal,v_receipt_journal) group by j.id loop
    if v_line.debit<=0 or v_line.debit<>v_line.credit or v_line.debit<>v_line.total_debit or v_line.credit<>v_line.total_credit then raise exception using message='Jurnal transaksi POS tidak seimbang.';end if;
  end loop;
  update public.pos_requests set status='completed',approved_by=auth.uid(),completed_at=now(),receipt_id=v_receipt,journal_id=v_journal,updated_by=auth.uid() where id=q.id;
  return q.id;
end;$$;

revoke all on function public.pos_finalize_direct(uuid,uuid) from public,anon,authenticated;

create or replace function public.pos_submit(p_register_id uuid,p_key uuid,p_kind text,p_session_id uuid,p_lines jsonb,p_received numeric default null,p_reason text default null)
returns uuid language plpgsql security definer set search_path='' as $$
declare r public.pos_registers;q public.pos_requests;p public.products;v_line jsonb;v_qty numeric;v_cost numeric;
  v_lines jsonb:='[]';v_delivery_lines jsonb:='[]';v_total numeric:=0;v_invoice uuid;v_delivery uuid;v_adjustment uuid;
  v_date date;v_payload jsonb;v_seen uuid[]:='{}';v_header jsonb;
begin
  if p_kind is null or p_kind not in('sale','stock') then raise exception using message='Jenis transaksi POS tidak valid.';end if;
  r:=public.pos_guard(p_register_id,case p_kind when 'sale' then 'sales.create' else 'inventory.write' end);
  if not public.current_user_has_permission(r.company_id,case p_kind when 'sale' then 'sales.submit' else 'inventory.submit' end) then raise exception using errcode='42501',message='Tidak memiliki izin pengajuan POS.';end if;
  if p_key is null or p_lines is null or jsonb_typeof(p_lines)<>'array' or jsonb_array_length(p_lines) not between 1 and 40 then raise exception using message='Pilih 1 sampai 40 produk.';end if;
  v_payload:=jsonb_build_object('kind',p_kind,'session_id',p_session_id,'lines',p_lines,'received',p_received,'reason',p_reason);
  select * into q from public.pos_requests where id=p_key;
  if found then
    if q.register_id<>r.id or q.submitted_by<>auth.uid() or q.payload<>v_payload then raise exception using message='Referensi sudah digunakan untuk transaksi berbeda.';end if;return q.id;
  end if;
  select (now() at time zone timezone)::date into v_date from public.companies where id=r.company_id;
  perform 1 from public.accounting_periods where company_id=r.company_id and v_date between starts_on and ends_on and status='open' for share;
  if not found then raise exception using message='Periode akuntansi tidak terbuka.';end if;
  if p_kind='sale' then
    perform 1 from public.pos_sessions where id=p_session_id and register_id=r.id and cashier_id=auth.uid() and closed_at is null for update;
    if not found then raise exception using message='Buka sesi kasir Anda terlebih dahulu.';end if;
  elsif p_session_id is not null or p_received is not null or length(trim(coalesce(p_reason,''))) not between 5 and 500 then raise exception using message='Alasan penambahan stok harus 5 sampai 500 karakter.';
  end if;
  for v_line in select value from jsonb_array_elements(p_lines) order by value->>'product_id' loop
    select p0.* into p from public.products p0 join public.pos_register_products rp on rp.product_id=p0.id and rp.company_id=p0.company_id
      where rp.register_id=r.id and rp.archived_at is null and p0.id=(v_line->>'product_id')::uuid and p0.is_active and p0.deleted_at is null for share of p0;
    if not found or p.id=any(v_seen) or p.product_type<>'inventory' then raise exception using message='Produk POS tidak valid atau duplikat.';end if;
    v_seen:=array_append(v_seen,p.id);v_qty:=(v_line->>'quantity')::numeric;
    if v_qty is null or v_qty<1 or v_qty>999 or v_qty<>trunc(v_qty) then raise exception using message='Jumlah harus bilangan bulat 1 sampai 999.';end if;
    if p_kind='sale' then
      if p.default_sales_tax_code_id is not null or p.sales_price<=0 or p.sales_price<>trunc(p.sales_price) then raise exception using message='Demo POS hanya mendukung harga Rupiah bulat tanpa konfigurasi pajak.';end if;
      v_cost:=p.sales_price;
    else
      v_cost:=(v_line->>'unit_cost')::numeric;
      if v_cost is null or v_cost<=0 or v_cost>1000000000 or v_cost<>trunc(v_cost) then raise exception using message='Nilai perolehan harus Rupiah bulat dan lebih dari nol.';end if;
    end if;
    v_total:=v_total+v_qty*v_cost;
    v_lines:=v_lines||jsonb_build_array(jsonb_build_object('product_id',p.id,'quantity',v_qty::text,'unit_price',v_cost::text,'unit_cost',v_cost::text,'description',p.name,'warehouse_id',r.warehouse_id,'discount_amount','0'));
    v_delivery_lines:=v_delivery_lines||jsonb_build_array(jsonb_build_object('product_id',p.id,'quantity',v_qty::text,'unit_amount',v_cost::text,'description',p.name,'warehouse_id',r.warehouse_id));
  end loop;
  if v_total<=0 or v_total>1000000000 then raise exception using message='Total POS di luar batas demo.';end if;
  if p_kind='sale' then
    if p_received is null or p_received<v_total or p_received>1000000000 or p_received<>trunc(p_received) then raise exception using message='Uang diterima kurang dari total atau tidak valid.';end if;
    v_header:=jsonb_build_object('branch_id',r.branch_id,'contact_id',r.customer_id,'document_date',v_date,'posting_date',v_date,'due_date',v_date,'notes','Penjualan POS terintegrasi');
    v_invoice:=public.save_invoice_draft(r.company_id,'sales_invoice',null,null,v_header,v_lines);
    perform public.submit_document(r.company_id,'sales_invoice',v_invoice);
    v_delivery:=public.save_operational_document(r.company_id,null,'sales_delivery',v_header,v_delivery_lines,null);
    perform public.submit_operational_document(r.company_id,v_delivery);
  else
    v_adjustment:=public.save_inventory_adjustment(r.company_id,null,jsonb_build_object('branch_id',r.branch_id,'warehouse_id',r.warehouse_id,'offset_account_id',r.stock_offset_account_id,'adjustment_date',v_date,'adjustment_type','increase','reason',p_reason),v_lines,null);
    perform public.submit_inventory_adjustment(r.company_id,v_adjustment);
  end if;
  insert into public.pos_requests(id,company_id,register_id,session_id,kind,payload,document_snapshot,total,received,invoice_id,delivery_id,adjustment_id,submitted_by,created_by)
  values(p_key,r.company_id,r.id,p_session_id,p_kind,v_payload,public.pos_document_snapshot(v_invoice,v_delivery,v_adjustment),v_total,p_received,v_invoice,v_delivery,v_adjustment,auth.uid(),auth.uid());
  return p_key;
end;$$;

create or replace function public.pos_close_session(p_register_id uuid,p_session_id uuid,p_actual numeric)
returns void language plpgsql security definer set search_path='' as $$
declare r public.pos_registers;s public.pos_sessions;v_expected numeric;
begin
  r:=public.pos_guard(p_register_id,'sales.create');
  select * into s from public.pos_sessions where id=p_session_id and register_id=r.id and cashier_id=auth.uid() for update;
  if not found or p_actual is null or p_actual<0 or p_actual>1000000000 or p_actual<>trunc(p_actual) then raise exception using message='Sesi atau saldo aktual tidak valid.';end if;
  if s.closed_at is not null then
    if s.actual_amount<>p_actual then raise exception using message='Sesi telah ditutup dengan saldo berbeda.';end if;return;
  end if;
  if exists(select 1 from public.pos_requests where session_id=s.id and status='pending') then raise exception using message='Selesaikan atau batalkan transaksi tertunda dahulu.';end if;
  select s.opening_amount+coalesce(sum(total),0) into v_expected from public.pos_requests where session_id=s.id and status='completed' and payment_method='cash';
  update public.pos_sessions set expected_amount=v_expected,actual_amount=p_actual,closed_at=now(),updated_by=auth.uid() where id=s.id;
end;$$;


create function public.pos_execute(p_register_id uuid,p_key uuid,p_kind text,p_session_id uuid,p_lines jsonb,p_received numeric default null,p_reason text default null,p_method text default 'cash',p_expected_total numeric default null)
returns uuid language plpgsql security definer set search_path='' as $$
declare r public.pos_registers;q public.pos_requests;v_id uuid;
begin
 r:=public.pos_guard(p_register_id,'pos.direct');
 if not r.direct_enabled or p_method is null or p_method not in('cash','qris_demo') or (p_kind='stock' and p_method<>'cash') then raise exception using message='Metode atau posting langsung POS tidak aktif.';end if;
 if p_method='qris_demo' and (not r.qris_demo_enabled or r.qris_bank_account_id is null) then raise exception using message='QRIS demo belum diaktifkan untuk kasir ini.';end if;
 select * into q from public.pos_requests where id=p_key;
 if found and (q.completion_mode<>'direct' or q.payment_method<>p_method) then raise exception using message='Referensi transaksi sudah digunakan.';end if;
 v_id:=public.pos_submit(r.id,p_key,p_kind,p_session_id,p_lines,p_received,p_reason);
 select * into q from public.pos_requests where id=v_id for update;
 if p_kind='sale' and (p_expected_total is null or p_expected_total<>q.total or (p_method='qris_demo' and p_received<>q.total)) then raise exception using message='Harga berubah. Muat ulang produk sebelum membayar.';end if;
 if q.status='completed' then return q.id;end if;
 update public.pos_requests set completion_mode='direct',payment_method=p_method,
   payment_reference=case p_method when 'qris_demo' then 'DEMO-'||id::text else null end,updated_by=auth.uid() where id=q.id;
 return public.pos_finalize_direct(r.id,q.id);
end;$$;

create function public.pos_finish_pending(p_register_id uuid,p_request_id uuid)
returns uuid language plpgsql security definer set search_path='' as $$
declare r public.pos_registers;q public.pos_requests;
begin
 r:=public.pos_guard(p_register_id,'pos.direct');
 select * into q from public.pos_requests where id=p_request_id and register_id=r.id and submitted_by=auth.uid() for update;
 if not found or not r.direct_enabled then raise exception using errcode='42501',message='Transaksi POS bukan milik Anda.';end if;
 if q.status='completed' then return q.id;end if;
 if q.status<>'pending' then raise exception using message='Transaksi telah dibatalkan.';end if;
 update public.pos_requests set completion_mode='direct',updated_by=auth.uid() where id=q.id;
 return public.pos_finalize_direct(r.id,q.id);
end;$$;

create or replace function public.pos_catalog(p_register_id uuid,p_search text default '')
returns jsonb language plpgsql security definer set search_path='' as $$
declare r public.pos_registers;
begin
 r:=public.pos_guard(p_register_id,'item.read');
 if not public.current_user_has_permission(r.company_id,'inventory.read') then raise exception using errcode='42501',message='Tidak memiliki izin stok.';end if;
 return coalesce((select jsonb_agg(to_jsonb(x)) from (
 select p.id,p.sku,p.name,p.sales_price::text as price,rp.category,rp.image_path,rp.archived_at,rp.version,
 coalesce(b.quantity_on_hand-b.quantity_reserved,0)::text as stock,coalesce(b.average_cost,0)::text as average_cost,
 (p.product_type='inventory' and p.default_sales_tax_code_id is null and p.sales_price>0 and p.sales_price=trunc(p.sales_price) and rp.archived_at is null) as supported
 from public.pos_register_products rp join public.products p on p.id=rp.product_id and p.company_id=rp.company_id
 left join public.product_warehouses b on b.company_id=p.company_id and b.product_id=p.id and b.warehouse_id=r.warehouse_id
 where rp.register_id=r.id and p.is_active and p.deleted_at is null
 and (coalesce(p_search,'')='' or position(lower(left(p_search,100)) in lower(p.name||' '||p.sku))>0)
 order by rp.archived_at nulls first,p.sku,p.id limit 500) x),'[]'::jsonb);
end;$$;

create function public.pos_update_product(p_register_id uuid,p_product_id uuid,p_name text,p_price numeric,p_category text,p_version integer)
returns void language plpgsql security definer set search_path='' as $$
declare r public.pos_registers;
begin
 r:=public.pos_guard(p_register_id,'item.write');
 if length(trim(coalesce(p_name,''))) not between 2 and 100 or p_price is null or p_price<=0 or p_price>1000000000 or p_price<>trunc(p_price) or length(trim(coalesce(p_category,''))) not between 1 and 40 then raise exception using message='Nama, harga, atau kategori tidak valid.';end if;
 perform 1 from public.pos_register_products where register_id=r.id and product_id=p_product_id and version=p_version and archived_at is null for update;
 if not found then raise exception using message='Produk berubah. Muat ulang terlebih dahulu.';end if;
 update public.products set name=trim(p_name),sales_price=p_price,updated_by=auth.uid() where id=p_product_id and company_id=r.company_id and deleted_at is null;
 update public.pos_register_products set category=trim(p_category),updated_by=auth.uid() where register_id=r.id and product_id=p_product_id;
end;$$;

create function public.pos_archive_product(p_register_id uuid,p_product_id uuid,p_archived boolean,p_version integer)
returns void language plpgsql security definer set search_path='' as $$
declare r public.pos_registers;
begin
 r:=public.pos_guard(p_register_id,'item.write');
 if p_archived is null then raise exception using message='Pilihan arsip tidak valid.';end if;
 if exists(select 1 from public.pos_requests q cross join lateral jsonb_array_elements(q.payload->'lines') x where q.register_id=r.id and q.status='pending' and x->>'product_id'=p_product_id::text) then raise exception using message='Selesaikan transaksi tertunda produk ini dahulu.';end if;
 update public.pos_register_products set archived_at=case when p_archived then now() else null end,updated_by=auth.uid()
 where register_id=r.id and product_id=p_product_id and version=p_version;
 if not found then raise exception using message='Produk berubah. Muat ulang terlebih dahulu.';end if;
end;$$;

create function public.pos_transaction_detail(p_register_id uuid,p_request_id uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare r public.pos_registers;q public.pos_requests;v_lines jsonb;v_company text;v_cashier text;
begin
 r:=public.pos_guard(p_register_id,'sales.read');
 select * into q from public.pos_requests where id=p_request_id and register_id=r.id;
 if not found or (q.kind='stock' and not public.current_user_has_permission(r.company_id,'inventory.read')) then raise exception using errcode='42501',message='Transaksi tidak ditemukan.';end if;
 select name into v_company from public.companies where id=r.company_id;
 select coalesce(display_name,email) into v_cashier from public.profiles where id=q.submitted_by;
 select coalesce(jsonb_agg(jsonb_build_object('name',case q.kind when 'sale' then x->>'description' else coalesce(p.name,'Produk') end,
  'sku',p.sku,'quantity',x->>'quantity','price',case q.kind when 'sale' then x->>'unit_price' else x->>'unit_cost' end,
  'total',((x->>'quantity')::numeric*(case q.kind when 'sale' then x->>'unit_price' else x->>'unit_cost' end)::numeric)::text) order by (x->>'line_number')::int),'[]') into v_lines
 from jsonb_array_elements(case q.kind when 'sale' then q.document_snapshot->'invoice_lines' else q.document_snapshot->'adjustment_lines' end) x
 left join public.products p on p.id=(x->>'product_id')::uuid and p.company_id=r.company_id;
 return jsonb_build_object('id',q.id,'kind',q.kind,'status',q.status,'company',v_company,'register',r.name,'cashier',coalesce(v_cashier,'Kasir'),
 'created_at',q.created_at,'completed_at',q.completed_at,'total',q.total::text,'received',q.received::text,
 'change',case when q.kind='sale' then (q.received-q.total)::text else null end,
 'payment_method',q.payment_method,'payment_reference',q.payment_reference,'completion_mode',q.completion_mode,
 'document_number',coalesce(q.document_snapshot->'invoice'->>'document_number',q.document_snapshot->'adjustment'->>'document_number'),
 'receipt_number',(select document_number from public.customer_receipts where id=q.receipt_id),'lines',v_lines,'reason',q.payload->>'reason');
end;$$;

create function public.pos_image_access(p_name text,p_write boolean)
returns boolean language plpgsql stable security definer set search_path='' as $$
declare parts text[];
begin
 if auth.uid() is null or p_name !~ '^[0-9a-f-]{36}/[0-9a-f-]{36}/[0-9a-f-]{36}/[0-9a-f-]{36}\.(jpg|png|webp)$' then return false;end if;
 parts:=string_to_array(p_name,'/');
 return exists(select 1 from public.pos_registers r join public.pos_register_products rp on rp.register_id=r.id and rp.company_id=r.company_id
 where r.company_id::text=parts[1] and r.id::text=parts[2] and rp.product_id::text=parts[3] and r.is_active
 and public.current_user_has_permission(r.company_id,case when p_write then 'item.write' else 'item.read' end));
end;$$;
revoke all on function public.pos_image_access(text,boolean) from public,anon;
grant execute on function public.pos_image_access(text,boolean) to authenticated;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
 values('pos-product-images','pos-product-images',false,3145728,array['image/jpeg','image/png','image/webp']) on conflict(id) do nothing;
create policy pos_images_select on storage.objects for select to authenticated using(bucket_id='pos-product-images' and public.pos_image_access(name,false));
create policy pos_images_insert on storage.objects for insert to authenticated with check(bucket_id='pos-product-images' and public.pos_image_access(name,true));
create policy pos_images_delete on storage.objects for delete to authenticated using(bucket_id='pos-product-images' and public.pos_image_access(name,true));

create function public.pos_set_product_image(p_register_id uuid,p_product_id uuid,p_path text,p_version integer)
returns void language plpgsql security definer set search_path='' as $$
declare r public.pos_registers;
begin
 r:=public.pos_guard(p_register_id,'item.write');
 if p_path is not null and (not public.pos_image_access(p_path,true)
 or split_part(p_path,'/',2)<>r.id::text or split_part(p_path,'/',3)<>p_product_id::text
 or not exists(select 1 from storage.objects where bucket_id='pos-product-images' and name=p_path)) then raise exception using message='Foto produk tidak valid.';end if;
 update public.pos_register_products set image_path=p_path,updated_by=auth.uid() where register_id=r.id and product_id=p_product_id and version=p_version;
 if not found then raise exception using message='Produk berubah. Muat ulang terlebih dahulu.';end if;
end;$$;

revoke all on function public.pos_execute(uuid,uuid,text,uuid,jsonb,numeric,text,text,numeric),public.pos_finish_pending(uuid,uuid),public.pos_update_product(uuid,uuid,text,numeric,text,integer),public.pos_archive_product(uuid,uuid,boolean,integer),public.pos_transaction_detail(uuid,uuid),public.pos_set_product_image(uuid,uuid,text,integer) from public,anon;
grant execute on function public.pos_execute(uuid,uuid,text,uuid,jsonb,numeric,text,text,numeric),public.pos_finish_pending(uuid,uuid),public.pos_update_product(uuid,uuid,text,numeric,text,integer),public.pos_archive_product(uuid,uuid,boolean,integer),public.pos_transaction_detail(uuid,uuid),public.pos_set_product_image(uuid,uuid,text,integer) to authenticated;

create function public.pos_summary(p_register_id uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare r public.pos_registers;v_zone text;v_today date;
begin
 r:=public.pos_guard(p_register_id,'sales.read');
 select timezone,(now() at time zone timezone)::date into v_zone,v_today from public.companies where id=r.company_id;
 return (select jsonb_build_object('total',coalesce(sum(total),0)::text,'count',count(*),
 'cash',coalesce(sum(total) filter(where payment_method='cash'),0)::text,
 'qris',coalesce(sum(total) filter(where payment_method='qris_demo'),0)::text,
 'session_cash',(select (s.opening_amount+coalesce(sum(q.total),0))::text from public.pos_sessions s left join public.pos_requests q on q.session_id=s.id and q.kind='sale' and q.status='completed' and q.payment_method='cash' where s.register_id=r.id and s.closed_at is null group by s.id))
 from public.pos_requests where register_id=r.id and kind='sale' and status='completed' and (completed_at at time zone v_zone)::date=v_today);
end;$$;
revoke all on function public.pos_summary(uuid) from public,anon;
grant execute on function public.pos_summary(uuid) to authenticated;

create function public.pos_add_product(p_register_id uuid,p_key uuid,p_sku text,p_name text,p_price numeric,p_category text)
returns uuid language plpgsql security definer set search_path='' as $$
declare v_id uuid;
begin
 if length(trim(coalesce(p_category,''))) not between 1 and 40 then raise exception using message='Kategori tidak valid.';end if;
 v_id:=public.pos_create_product(p_register_id,p_key,p_sku,p_name,p_price);
 update public.pos_register_products set category=trim(p_category),updated_by=auth.uid() where register_id=p_register_id and product_id=v_id and category<>trim(p_category);
 return v_id;
end;$$;
revoke all on function public.pos_add_product(uuid,uuid,text,text,numeric,text) from public,anon;
grant execute on function public.pos_add_product(uuid,uuid,text,text,numeric,text) to authenticated;
commit;
