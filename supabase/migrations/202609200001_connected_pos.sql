begin;

-- Additive POS boundary. No existing accounting function or policy is replaced.
create table public.pos_registers (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id),
  code text not null, name text not null,
  branch_id uuid not null, warehouse_id uuid not null,
  customer_id uuid not null, bank_account_id uuid not null,
  stock_offset_account_id uuid not null, template_product_id uuid not null,
  is_active boolean not null default false,
  created_at timestamptz not null default now(), created_by uuid not null references auth.users(id),
  updated_at timestamptz, updated_by uuid references auth.users(id), version integer not null default 1 check(version>0),
  unique(company_id,id), unique(company_id,code),
  foreign key(company_id,branch_id) references public.branches(company_id,id),
  foreign key(company_id,warehouse_id) references public.warehouses(company_id,id),
  foreign key(company_id,customer_id) references public.contacts(company_id,id),
  foreign key(company_id,bank_account_id) references public.bank_accounts(company_id,id),
  foreign key(company_id,stock_offset_account_id) references public.chart_of_accounts(company_id,id),
  foreign key(company_id,template_product_id) references public.products(company_id,id)
);
create table public.pos_register_products (
  company_id uuid not null, register_id uuid not null, product_id uuid not null,
  created_at timestamptz not null default now(), created_by uuid not null references auth.users(id),
  primary key(register_id,product_id),
  foreign key(company_id,register_id) references public.pos_registers(company_id,id),
  foreign key(company_id,product_id) references public.products(company_id,id)
);
create index pos_register_products_company_idx on public.pos_register_products(company_id,product_id);
create table public.pos_sessions (
  id uuid primary key, company_id uuid not null, register_id uuid not null,
  cashier_id uuid not null references auth.users(id),
  opening_amount numeric(24,4) not null check(opening_amount between 0 and 1000000000),
  expected_amount numeric(24,4), actual_amount numeric(24,4) check(actual_amount between 0 and 1000000000),
  opened_at timestamptz not null default now(), closed_at timestamptz,
  created_at timestamptz not null default now(), created_by uuid not null references auth.users(id),
  updated_at timestamptz, updated_by uuid references auth.users(id), version integer not null default 1 check(version>0),
  unique(company_id,id),
  foreign key(company_id,register_id) references public.pos_registers(company_id,id),
  check((closed_at is null and actual_amount is null and expected_amount is null) or
        (closed_at is not null and actual_amount is not null and expected_amount is not null))
);
create unique index pos_one_open_session on public.pos_sessions(register_id) where closed_at is null;
create index pos_sessions_company_idx on public.pos_sessions(company_id,opened_at desc);
create table public.pos_requests (
  id uuid primary key, company_id uuid not null, register_id uuid not null,
  session_id uuid, kind text not null check(kind in('sale','stock')),
  status text not null default 'pending' check(status in('pending','completed','cancelled')),
  payload jsonb not null, document_snapshot jsonb not null, total numeric(24,4) not null check(total>0 and total<=1000000000),
  received numeric(24,4), invoice_id uuid, delivery_id uuid, adjustment_id uuid,
  receipt_id uuid, journal_id uuid references public.journal_entries(id),
  submitted_by uuid not null references auth.users(id), approved_by uuid references auth.users(id),
  completed_at timestamptz,
  created_at timestamptz not null default now(), created_by uuid not null references auth.users(id),
  updated_at timestamptz, updated_by uuid references auth.users(id), version integer not null default 1 check(version>0),
  unique(company_id,id), unique(invoice_id), unique(delivery_id), unique(adjustment_id), unique(receipt_id),
  foreign key(company_id,register_id) references public.pos_registers(company_id,id),
  foreign key(company_id,session_id) references public.pos_sessions(company_id,id),
  foreign key(company_id,invoice_id) references public.sales_invoices(company_id,id),
  foreign key(company_id,delivery_id) references public.operational_documents(company_id,id),
  foreign key(company_id,adjustment_id) references public.inventory_adjustments(company_id,id),
  foreign key(company_id,receipt_id) references public.customer_receipts(company_id,id),
  check((kind='sale' and session_id is not null and invoice_id is not null and delivery_id is not null and received>=total and received<=1000000000)
     or (kind='stock' and adjustment_id is not null and session_id is null and received is null)),
  check(status<>'completed' or (approved_by is not null and approved_by<>submitted_by and completed_at is not null and journal_id is not null))
);
create index pos_requests_company_date_idx on public.pos_requests(company_id,created_at desc);
create index pos_requests_session_idx on public.pos_requests(session_id,status);

alter table public.pos_registers enable row level security;
alter table public.pos_register_products enable row level security;
alter table public.pos_sessions enable row level security;
alter table public.pos_requests enable row level security;
create policy pos_registers_read on public.pos_registers for select to authenticated
  using(public.current_user_has_permission(company_id,'sales.read') or public.current_user_has_permission(company_id,'inventory.read'));
create policy pos_products_read on public.pos_register_products for select to authenticated using(public.current_user_has_permission(company_id,'item.read'));
create policy pos_sessions_read on public.pos_sessions for select to authenticated using(public.current_user_has_permission(company_id,'sales.read'));
create policy pos_requests_read on public.pos_requests for select to authenticated using(public.current_user_has_permission(company_id,case kind when 'sale' then 'sales.read' else 'inventory.read' end));
revoke all on public.pos_registers,public.pos_register_products,public.pos_sessions,public.pos_requests from public,anon,authenticated;
grant select on public.pos_registers,public.pos_register_products,public.pos_sessions,public.pos_requests to authenticated;
grant all on public.pos_registers,public.pos_register_products,public.pos_sessions,public.pos_requests to service_role;

create trigger pos_registers_updated before update on public.pos_registers for each row execute function public.set_updated_metadata();
create trigger pos_sessions_updated before update on public.pos_sessions for each row execute function public.set_updated_metadata();
create trigger pos_requests_updated before update on public.pos_requests for each row execute function public.set_updated_metadata();
create trigger pos_registers_audit after insert or update or delete on public.pos_registers for each row execute function public.audit_row_change();
create trigger pos_sessions_audit after insert or update or delete on public.pos_sessions for each row execute function public.audit_row_change();
create trigger pos_requests_audit after insert or update or delete on public.pos_requests for each row execute function public.audit_row_change();

create function public.pos_guard(p_register_id uuid,p_permission text)
returns public.pos_registers language plpgsql security definer set search_path='' as $$
declare r public.pos_registers;
begin
  select * into r from public.pos_registers where id=p_register_id for update;
  if not found or not r.is_active or auth.uid() is null or not public.current_user_has_permission(r.company_id,p_permission)
     or not exists(select 1 from public.companies where id=r.company_id and status='active' and base_currency_code='IDR') then
    raise exception using errcode='42501',message='Tidak memiliki akses POS aktif.';
  end if;
  if not exists(select 1 from public.branches where id=r.branch_id and company_id=r.company_id and is_active)
     or not exists(select 1 from public.warehouses where id=r.warehouse_id and company_id=r.company_id and branch_id=r.branch_id and is_active) then
    raise exception using message='Cabang atau gudang POS tidak aktif.';
  end if;
  return r;
end;$$;
revoke all on function public.pos_guard(uuid,text) from public,anon,authenticated;

create function public.pos_document_snapshot(p_invoice uuid,p_delivery uuid,p_adjustment uuid)
returns jsonb language sql stable security definer set search_path='' as $$
 select jsonb_build_object(
   'invoice',(select to_jsonb(x) from public.sales_invoices x where id=p_invoice),
   'invoice_lines',(select jsonb_agg(to_jsonb(x) order by id) from public.sales_invoice_lines x where invoice_id=p_invoice),
   'delivery',(select to_jsonb(x) from public.operational_documents x where id=p_delivery),
   'delivery_lines',(select jsonb_agg(to_jsonb(x) order by id) from public.operational_document_lines x where document_id=p_delivery),
   'adjustment',(select to_jsonb(x) from public.inventory_adjustments x where id=p_adjustment),
   'adjustment_lines',(select jsonb_agg(to_jsonb(x) order by id) from public.inventory_adjustment_lines x where adjustment_id=p_adjustment));
$$;
revoke all on function public.pos_document_snapshot(uuid,uuid,uuid) from public,anon,authenticated;

create function public.pos_catalog(p_register_id uuid,p_search text default '')
returns jsonb language plpgsql security definer set search_path='' as $$
declare r public.pos_registers;
begin
  r:=public.pos_guard(p_register_id,'item.read');
  if not public.current_user_has_permission(r.company_id,'inventory.read') then raise exception using errcode='42501',message='Tidak memiliki izin stok.';end if;
  return coalesce((select jsonb_agg(to_jsonb(x)) from (
    select p.id,p.sku,p.name,p.sales_price::text as price,
      coalesce(b.quantity_on_hand-b.quantity_reserved,0)::text as stock,
      coalesce(b.average_cost,0)::text as average_cost,
      (p.product_type='inventory' and p.default_sales_tax_code_id is null and p.sales_price>0 and p.sales_price=trunc(p.sales_price)) as supported
    from public.pos_register_products rp join public.products p on p.id=rp.product_id and p.company_id=rp.company_id
    left join public.product_warehouses b on b.company_id=p.company_id and b.product_id=p.id and b.warehouse_id=r.warehouse_id
    where rp.register_id=r.id and p.is_active and p.deleted_at is null
      and (coalesce(p_search,'')='' or position(lower(left(p_search,100)) in lower(p.name||' '||p.sku))>0)
    order by p.sku,p.id limit 80
  ) x),'[]'::jsonb);
end;$$;

create function public.pos_open_session(p_register_id uuid,p_key uuid,p_opening numeric)
returns uuid language plpgsql security definer set search_path='' as $$
declare r public.pos_registers;s public.pos_sessions;
begin
  r:=public.pos_guard(p_register_id,'sales.create');
  if p_key is null or p_opening is null or p_opening<0 or p_opening>1000000000 or p_opening<>trunc(p_opening) then raise exception using message='Saldo awal tidak valid.';end if;
  select * into s from public.pos_sessions where id=p_key;
  if found then
    if s.register_id<>r.id or s.cashier_id<>auth.uid() or s.opening_amount<>p_opening then raise exception using message='Referensi sesi sudah digunakan.';end if;
    return s.id;
  end if;
  if exists(select 1 from public.pos_sessions where register_id=r.id and closed_at is null) then raise exception using message='Sesi kasir masih terbuka.';end if;
  insert into public.pos_sessions(id,company_id,register_id,cashier_id,opening_amount,created_by)
  values(p_key,r.company_id,r.id,auth.uid(),p_opening,auth.uid());return p_key;
end;$$;

create function public.pos_close_session(p_register_id uuid,p_session_id uuid,p_actual numeric)
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
  select s.opening_amount+coalesce(sum(total),0) into v_expected from public.pos_requests where session_id=s.id and status='completed';
  update public.pos_sessions set expected_amount=v_expected,actual_amount=p_actual,closed_at=now(),updated_by=auth.uid() where id=s.id;
end;$$;

create function public.pos_submit(p_register_id uuid,p_key uuid,p_kind text,p_session_id uuid,p_lines jsonb,p_received numeric default null,p_reason text default null)
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
      where rp.register_id=r.id and p0.id=(v_line->>'product_id')::uuid and p0.is_active and p0.deleted_at is null for share of p0;
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

create function public.pos_complete(p_register_id uuid,p_request_id uuid)
returns uuid language plpgsql security definer set search_path='' as $$
declare r public.pos_registers;q public.pos_requests;i public.sales_invoices;b public.product_warehouses;
  v_date date;v_line record;v_approval uuid;v_journal uuid;v_delivery_journal uuid;v_receipt uuid;v_receipt_journal uuid;
  v_ar_account uuid;v_ar uuid;v_total numeric;v_number text;v_no integer:=1;v_debit numeric;v_credit numeric;
begin
  r:=public.pos_guard(p_register_id,'approval.read');
  select * into q from public.pos_requests where id=p_request_id and register_id=r.id for update;
  if not found or not public.current_user_has_permission(r.company_id,case q.kind when 'sale' then 'sales.approve' else 'inventory.approve' end)
    or not public.current_user_has_permission(r.company_id,case q.kind when 'sale' then 'sales.post' else 'inventory.post' end) then raise exception using errcode='42501',message='Tidak memiliki izin persetujuan dan posting POS.';end if;
  if q.submitted_by=auth.uid() then raise exception using errcode='42501',message='Persetujuan wajib oleh pengguna lain.';end if;
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
       where ba.id=r.bank_account_id and ba.company_id=r.company_id and ba.is_active and ba.account_type='cash' and ba.currency_code='IDR' and a.is_active and a.account_type='asset') then
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
  if q.kind='stock' then
    perform public.decide_inventory_adjustment(r.company_id,q.adjustment_id,'approve','Persetujuan penambahan stok melalui POS');
    v_journal:=public.post_inventory_adjustment(r.company_id,q.adjustment_id,'pos-stock:'||q.id);
  else
    select id into v_approval from public.approval_requests where company_id=r.company_id and document_type='sales_invoice' and document_id=i.id and status='pending';
    perform public.approve_document(r.company_id,v_approval,'Persetujuan penjualan melalui POS');
    perform public.decide_operational_document(r.company_id,q.delivery_id,'approve','Persetujuan pengeluaran stok POS');
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
    values(r.company_id,r.branch_id,'POS-'||q.id,v_date,r.customer_id,r.bank_account_id,q.total,'Tunai simulasi POS; diterima '||q.received::text,auth.uid()) returning id into v_receipt;
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

create function public.pos_cancel(p_register_id uuid,p_request_id uuid)
returns void language plpgsql security definer set search_path='' as $$
declare r public.pos_registers;q public.pos_requests;
begin
  r:=public.pos_guard(p_register_id,'sales.read');
  select * into q from public.pos_requests where id=p_request_id and register_id=r.id and submitted_by=auth.uid() for update;
  if not found then raise exception using errcode='42501',message='Transaksi Anda tidak ditemukan.';end if;
  if q.status='cancelled' then return;end if;
  if q.status<>'pending' then raise exception using message='Transaksi selesai tidak dapat dibatalkan; gunakan retur resmi.';end if;
  if q.kind='sale' then
    if exists(select 1 from public.sales_invoices where id=q.invoice_id and status<>'pending_approval') or exists(select 1 from public.operational_documents where id=q.delivery_id and status<>'pending_approval') then raise exception using message='Dokumen telah diproses di akuntansi.';end if;
    update public.sales_invoices set status='rejected',updated_by=auth.uid() where id=q.invoice_id;
    update public.operational_documents set status='rejected',rejection_reason='Dibatalkan kasir POS',updated_by=auth.uid() where id=q.delivery_id;
  else
    if exists(select 1 from public.inventory_adjustments where id=q.adjustment_id and status<>'pending_approval') then raise exception using message='Dokumen telah diproses di akuntansi.';end if;
    update public.inventory_adjustments set status='rejected',rejection_reason='Dibatalkan kasir POS',updated_by=auth.uid() where id=q.adjustment_id;
  end if;
  insert into public.approval_actions(company_id,request_id,step,action,actor_user_id,comment)
    select company_id,id,1,'reject',auth.uid(),'Dibatalkan oleh pembuat melalui POS' from public.approval_requests
    where company_id=r.company_id and document_id in(q.invoice_id,q.delivery_id,q.adjustment_id) and status='pending';
  update public.approval_requests set status='rejected',completed_at=now() where company_id=r.company_id and document_id in(q.invoice_id,q.delivery_id,q.adjustment_id) and status='pending';
  update public.pos_requests set status='cancelled',updated_by=auth.uid() where id=q.id;
end;$$;

create function public.pos_create_product(p_register_id uuid,p_key uuid,p_sku text,p_name text,p_price numeric)
returns uuid language plpgsql security definer set search_path='' as $$
declare r public.pos_registers;t public.products;p public.products;
begin
  r:=public.pos_guard(p_register_id,'item.write');
  if p_key is null or length(trim(coalesce(p_sku,''))) not between 2 and 30 or p_sku!~'^[A-Z0-9_-]+$' or length(trim(coalesce(p_name,''))) not between 2 and 100
    or p_price is null or p_price<=0 or p_price>1000000000 or p_price<>trunc(p_price) then raise exception using message='SKU, nama, atau harga produk tidak valid.';end if;
  select * into p from public.products where id=p_key;
  if found then
    if p.company_id<>r.company_id or p.created_by<>auth.uid() or p.sku<>p_sku or p.name<>trim(p_name) or p.sales_price<>p_price
      or not exists(select 1 from public.pos_register_products where register_id=r.id and product_id=p.id) then raise exception using message='Referensi produk sudah digunakan.';end if;return p.id;
  end if;
  select * into t from public.products where id=r.template_product_id and company_id=r.company_id and is_active and product_type='inventory';
  if not found then raise exception using message='Konfigurasi akun produk POS tidak tersedia.';end if;
  insert into public.products(id,company_id,sku,name,product_type,base_unit_id,sales_account_id,purchase_account_id,inventory_account_id,cogs_account_id,sales_price,created_by)
  values(p_key,r.company_id,p_sku,trim(p_name),'inventory',t.base_unit_id,t.sales_account_id,t.purchase_account_id,t.inventory_account_id,t.cogs_account_id,p_price,auth.uid());
  insert into public.pos_register_products(company_id,register_id,product_id,created_by) values(r.company_id,r.id,p_key,auth.uid());return p_key;
end;$$;

revoke all on function public.pos_catalog(uuid,text),public.pos_open_session(uuid,uuid,numeric),public.pos_close_session(uuid,uuid,numeric),public.pos_submit(uuid,uuid,text,uuid,jsonb,numeric,text),public.pos_complete(uuid,uuid),public.pos_cancel(uuid,uuid),public.pos_create_product(uuid,uuid,text,text,numeric) from public,anon;
grant execute on function public.pos_catalog(uuid,text),public.pos_open_session(uuid,uuid,numeric),public.pos_close_session(uuid,uuid,numeric),public.pos_submit(uuid,uuid,text,uuid,jsonb,numeric,text),public.pos_complete(uuid,uuid),public.pos_cancel(uuid,uuid),public.pos_create_product(uuid,uuid,text,text,numeric) to authenticated;

commit;
