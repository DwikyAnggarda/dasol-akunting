begin;

create or replace function public.bootstrap_demo_company(p_users jsonb)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_company uuid;
  v_admin uuid := (p_users->>'administrator')::uuid;
  v_accountant uuid := (p_users->>'accountant')::uuid;
  v_operator uuid := (p_users->>'operator')::uuid;
  v_approver uuid := (p_users->>'approver')::uuid;
  v_viewer uuid := (p_users->>'viewer')::uuid;
  v_admin_role uuid;v_accountant_role uuid;v_operator_role uuid;v_approver_role uuid;v_viewer_role uuid;
  v_branch uuid;v_branch_two uuid;v_warehouse uuid;
  v_unit uuid;v_customer uuid;v_supplier uuid;v_service uuid;
  v_ar uuid;v_ap uuid;v_bank_gl uuid;v_sales uuid;v_expense uuid;v_tax_out uuid;v_tax_in uuid;v_equity uuid;
  v_tax_code uuid;v_tax_version uuid;v_bank uuid;v_fiscal_year uuid;
  v_opening_journal uuid;v_sales_invoice uuid;v_purchase_invoice uuid;v_journal uuid;v_ar_row uuid;v_ap_row uuid;v_receipt uuid;v_payment uuid;
  v_year integer := extract(year from current_date)::integer;
  v_date date := current_date;
  v_number text;
begin
  if auth.role() <> 'service_role' then raise exception using message='Demo bootstrap hanya tersedia untuk operasi server terkontrol.';end if;
  if v_admin is null or v_accountant is null or v_operator is null or v_approver is null or v_viewer is null then raise exception using message='Semua user demo wajib tersedia.';end if;

  insert into public.companies(code,name,legal_name,base_currency_code,locale,timezone,status,created_by)
  values('DASOLDEMO','PT Dasol Demo Indonesia','PT Dasol Demo Indonesia','IDR','id-ID','Asia/Jakarta','active',v_admin)
  on conflict(code) do update set name=excluded.name,legal_name=excluded.legal_name,status='active'
  returning id into v_company;
  insert into public.company_settings(company_id,fiscal_year_start_month,inventory_method,allow_negative_stock,allow_self_approval,created_by)
  values(v_company,1,'moving_weighted_average',false,false,v_admin) on conflict(company_id) do update set allow_negative_stock=false,allow_self_approval=false;

  insert into public.roles(company_id,code,name,is_system,created_by) values
  (v_company,'administrator','Administrator',true,v_admin),(v_company,'accountant','Akuntan',true,v_admin),(v_company,'operator','Operator Penjualan / Pembelian',true,v_admin),(v_company,'approver','Approver / Validator',true,v_admin),(v_company,'viewer','Viewer / Auditor',true,v_admin)
  on conflict(company_id,code) do update set name=excluded.name,is_system=true;
  select id into v_admin_role from public.roles where company_id=v_company and code='administrator';
  select id into v_accountant_role from public.roles where company_id=v_company and code='accountant';
  select id into v_operator_role from public.roles where company_id=v_company and code='operator';
  select id into v_approver_role from public.roles where company_id=v_company and code='approver';
  select id into v_viewer_role from public.roles where company_id=v_company and code='viewer';
  delete from public.role_permissions where company_id=v_company;
  insert into public.role_permissions(company_id,role_id,permission_id,created_by) select v_company,v_admin_role,id,v_admin from public.permissions;
  insert into public.role_permissions(company_id,role_id,permission_id,created_by) select v_company,v_accountant_role,id,v_admin from public.permissions where code in('approval.read','audit.read','coa.read','coa.write','contact.read','inventory.read','item.read','journal.approve','journal.create','journal.post','journal.read','journal.reverse','journal.submit','period.close','report.export','report.financial.read','report.tax.read','settings.manage');
  insert into public.role_permissions(company_id,role_id,permission_id,created_by) select v_company,v_operator_role,id,v_admin from public.permissions where code in('contact.read','contact.write','inventory.read','item.read','item.write','purchase.create','purchase.read','purchase.submit','purchase.update','sales.create','sales.read','sales.submit','sales.update');
  insert into public.role_permissions(company_id,role_id,permission_id,created_by) select v_company,v_approver_role,id,v_admin from public.permissions where code in('approval.read','journal.read','purchase.approve','purchase.post','purchase.read','sales.approve','sales.post','sales.read');
  insert into public.role_permissions(company_id,role_id,permission_id,created_by) select v_company,v_viewer_role,id,v_admin from public.permissions where code in('approval.read','audit.read','coa.read','contact.read','inventory.read','item.read','journal.read','purchase.read','report.financial.read','report.tax.read','sales.read');
  insert into public.company_memberships(company_id,user_id,role_id,status,created_by) values
  (v_company,v_admin,v_admin_role,'active',v_admin),(v_company,v_accountant,v_accountant_role,'active',v_admin),(v_company,v_operator,v_operator_role,'active',v_admin),(v_company,v_approver,v_approver_role,'active',v_admin),(v_company,v_viewer,v_viewer_role,'active',v_admin)
  on conflict(company_id,user_id) do update set role_id=excluded.role_id,status='active';

  insert into public.branches(company_id,code,name,created_by) values(v_company,'JKT','Kantor Pusat Jakarta',v_admin),(v_company,'SBY','Cabang Surabaya',v_admin) on conflict(company_id,code) do update set name=excluded.name,is_active=true;
  select id into v_branch from public.branches where company_id=v_company and code='JKT';select id into v_branch_two from public.branches where company_id=v_company and code='SBY';
  insert into public.warehouses(company_id,branch_id,code,name,created_by) values(v_company,v_branch,'WH-JKT','Gudang Jakarta',v_admin),(v_company,v_branch_two,'WH-SBY','Gudang Surabaya',v_admin) on conflict(company_id,code) do update set name=excluded.name,is_active=true;
  select id into v_warehouse from public.warehouses where company_id=v_company and code='WH-JKT';

  insert into public.fiscal_years(company_id,name,starts_on,ends_on,created_by) values(v_company,'Tahun Buku '||v_year,make_date(v_year,1,1),make_date(v_year,12,31),v_admin) on conflict(company_id,starts_on,ends_on) do update set status='open' returning id into v_fiscal_year;
  insert into public.accounting_periods(company_id,fiscal_year_id,period_number,starts_on,ends_on,created_by)
  select v_company,v_fiscal_year,month_no,make_date(v_year,month_no,1),(make_date(v_year,month_no,1)+interval '1 month-1 day')::date,v_admin from generate_series(1,12) month_no
  on conflict(company_id,fiscal_year_id,period_number) do nothing;

  insert into public.chart_of_accounts(company_id,code,name,account_type,normal_balance,is_control_account,allow_manual_entry,cash_flow_category,created_by) values
  (v_company,'1100','Kas','asset','debit',false,true,'operating',v_admin),(v_company,'1110','Bank','asset','debit',false,true,'operating',v_admin),(v_company,'1200','Piutang Usaha','asset','debit',true,false,null,v_admin),(v_company,'1300','Persediaan','asset','debit',true,false,null,v_admin),(v_company,'1400','Pajak Masukan','asset','debit',true,false,null,v_admin),(v_company,'1500','Beban Dibayar di Muka','asset','debit',false,true,null,v_admin),(v_company,'1600','Aset Tetap','asset','debit',true,false,'investing',v_admin),(v_company,'1610','Akumulasi Penyusutan','asset','credit',true,false,null,v_admin),
  (v_company,'2100','Utang Usaha','liability','credit',true,false,null,v_admin),(v_company,'2110','GRNI','liability','credit',true,false,null,v_admin),(v_company,'2200','Pajak Keluaran','liability','credit',true,false,null,v_admin),(v_company,'2210','Utang Pajak Potong','liability','credit',true,false,null,v_admin),(v_company,'2300','Beban Akrual','liability','credit',false,true,null,v_admin),
  (v_company,'3100','Modal','equity','credit',false,true,'financing',v_admin),(v_company,'3200','Saldo Laba','equity','credit',false,true,null,v_admin),
  (v_company,'4100','Penjualan Produk','revenue','credit',false,true,null,v_admin),(v_company,'4200','Pendapatan Jasa','revenue','credit',false,true,null,v_admin),(v_company,'4900','Retur dan Potongan Penjualan','revenue','debit',false,true,null,v_admin),(v_company,'5100','Harga Pokok Penjualan','cost_of_goods_sold','debit',false,true,null,v_admin),
  (v_company,'6100','Beban Gaji','expense','debit',false,true,null,v_admin),(v_company,'6200','Beban Sewa','expense','debit',false,true,null,v_admin),(v_company,'6300','Beban Utilitas','expense','debit',false,true,null,v_admin),(v_company,'6400','Beban Penyusutan','expense','debit',false,true,null,v_admin),(v_company,'6500','Beban Administrasi','expense','debit',false,true,null,v_admin),(v_company,'6600','Beban Bank','expense','debit',false,true,null,v_admin),
  (v_company,'7100','Pendapatan Lain','other_income','credit',false,true,null,v_admin),(v_company,'8100','Beban Lain','other_expense','debit',false,true,null,v_admin),(v_company,'8200','Selisih Kurs','other_expense','debit',false,true,null,v_admin),(v_company,'8300','Selisih Pembulatan','other_expense','debit',false,true,null,v_admin),(v_company,'8400','Purchase Price Variance','other_expense','debit',false,true,null,v_admin)
  on conflict(company_id,code) do update set name=excluded.name,account_type=excluded.account_type,normal_balance=excluded.normal_balance,is_control_account=excluded.is_control_account,allow_manual_entry=excluded.allow_manual_entry;
  select id into v_ar from public.chart_of_accounts where company_id=v_company and code='1200';select id into v_ap from public.chart_of_accounts where company_id=v_company and code='2100';select id into v_bank_gl from public.chart_of_accounts where company_id=v_company and code='1110';select id into v_sales from public.chart_of_accounts where company_id=v_company and code='4200';select id into v_expense from public.chart_of_accounts where company_id=v_company and code='6500';select id into v_tax_out from public.chart_of_accounts where company_id=v_company and code='2200';select id into v_tax_in from public.chart_of_accounts where company_id=v_company and code='1400';select id into v_equity from public.chart_of_accounts where company_id=v_company and code='3100';
  insert into public.account_mappings(company_id,mapping_code,account_id,created_by) values(v_company,'accounts_receivable',v_ar,v_admin),(v_company,'accounts_payable',v_ap,v_admin),(v_company,'bank',v_bank_gl,v_admin),(v_company,'cash',(select id from public.chart_of_accounts where company_id=v_company and code='1100'),v_admin),(v_company,'output_tax',v_tax_out,v_admin),(v_company,'input_tax',v_tax_in,v_admin) on conflict(company_id,mapping_code) do update set account_id=excluded.account_id;
  insert into public.document_sequences(company_id,branch_id,document_type,pattern,reset_frequency,created_by) select v_company,v_branch,t,case when t in('SI','PI') then t||'-{YYYY}-{MM}-{####}' else t||'-{YYYY}-{MM}-{####}' end,'monthly',v_admin from unnest(array['JV','RV','SJV','PJV','SI','PI','CR','SP']) t on conflict(company_id,document_type,branch_scope) do nothing;

  insert into public.payment_terms(company_id,code,name,due_days,created_by) values(v_company,'NET30','30 Hari',30,v_admin) on conflict(company_id,code) do update set due_days=30;
  insert into public.contacts(company_id,code,contact_type,display_name,legal_name,email,payment_term_id,receivable_account_id,created_by) values(v_company,'CUST-001','customer','PT Pelanggan Nusantara','PT Pelanggan Nusantara','finance@pelanggan.invalid',(select id from public.payment_terms where company_id=v_company and code='NET30'),v_ar,v_admin) on conflict(company_id,code) do update set display_name=excluded.display_name returning id into v_customer;
  insert into public.contacts(company_id,code,contact_type,display_name,legal_name,email,payment_term_id,payable_account_id,created_by) values(v_company,'SUP-001','supplier','PT Pemasok Sejahtera','PT Pemasok Sejahtera','finance@pemasok.invalid',(select id from public.payment_terms where company_id=v_company and code='NET30'),v_ap,v_admin) on conflict(company_id,code) do update set display_name=excluded.display_name returning id into v_supplier;
  insert into public.units(company_id,code,name,decimal_places,created_by) values(v_company,'PCS','Pieces',0,v_admin),(v_company,'JASA','Jasa',2,v_admin) on conflict(company_id,code) do update set name=excluded.name;select id into v_unit from public.units where company_id=v_company and code='JASA';
  insert into public.tax_codes(company_id,code,name,category,input_account_id,output_account_id,created_by) values(v_company,'PPN-CONTOH','PPN Contoh (konfigurasi demo)','vat_output',v_tax_in,v_tax_out,v_admin) on conflict(company_id,code) do update set name=excluded.name returning id into v_tax_code;
  insert into public.tax_rate_versions(company_id,tax_code_id,rate,effective_from,price_includes_tax,rounding_method,source_reference,notes,created_by) values(v_company,v_tax_code,11,make_date(v_year,1,1),false,'half_up','DEMO-CONFIG','Contoh konfigurasi, bukan klaim tarif resmi.',v_admin) on conflict do nothing;
  select id into v_tax_version from public.tax_rate_versions where company_id=v_company and tax_code_id=v_tax_code and effective_from<=v_date and(effective_to is null or effective_to>=v_date) order by effective_from desc limit 1;
  insert into public.products(company_id,sku,name,product_type,base_unit_id,sales_account_id,purchase_account_id,default_sales_tax_code_id,default_purchase_tax_code_id,created_by) values(v_company,'SRV-ACC','Jasa Implementasi Akuntansi','service',v_unit,v_sales,v_expense,v_tax_code,v_tax_code,v_admin) on conflict(company_id,sku) do update set name=excluded.name returning id into v_service;
  insert into public.bank_accounts(company_id,code,name,bank_name,masked_account_number,gl_account_id,created_by) values(v_company,'BANK-IDR','Rekening Operasional','Bank Demo','****0001',v_bank_gl,v_admin) on conflict(company_id,code) do update set name=excluded.name returning id into v_bank;

  perform set_config('request.jwt.claims',jsonb_build_object('sub',v_admin::text,'role','authenticated')::text,true);
  if not exists(select 1 from public.journal_entries where company_id=v_company and idempotency_key='demo-opening-v1') then
    v_opening_journal:=public.post_manual_journal(v_company,make_date(v_year,1,1),'Saldo awal demo',jsonb_build_array(jsonb_build_object('account_id',v_bank_gl,'description','Saldo awal bank','debit',100000000,'credit',0),jsonb_build_object('account_id',v_equity,'description','Modal awal','debit',0,'credit',100000000)),'demo-opening-v1',v_branch);
  end if;

  if not exists(select 1 from public.sales_invoices where company_id=v_company and document_number='SI-DEMO-001') then
    insert into public.sales_invoices(company_id,branch_id,document_number,document_date,posting_date,due_date,customer_id,status,created_by,approved_by,approved_at) values(v_company,v_branch,'SI-DEMO-001',v_date,v_date,v_date+30,v_customer,'approved',v_admin,v_approver,now()) returning id into v_sales_invoice;
    insert into public.sales_invoice_lines(company_id,invoice_id,line_number,product_id,description,quantity,unit_price,tax_rate_version_id,revenue_account_id,created_by) values(v_company,v_sales_invoice,1,v_service,'Jasa implementasi',1,10000000,v_tax_version,v_sales,v_admin);
    v_journal:=public.post_sales_invoice(v_company,v_sales_invoice,'demo-sales-invoice-v1');
  else select id into v_sales_invoice from public.sales_invoices where company_id=v_company and document_number='SI-DEMO-001';end if;
  select id into v_ar_row from public.accounts_receivable where sales_invoice_id=v_sales_invoice;
  if v_ar_row is not null and exists(select 1 from public.accounts_receivable where id=v_ar_row and outstanding_amount>0) and not exists(select 1 from public.customer_receipts where company_id=v_company and notes='Demo receipt') then
    insert into public.customer_receipts(company_id,branch_id,document_number,receipt_date,customer_id,bank_account_id,amount,notes,created_by) select v_company,v_branch,'DRAFT-DEMO-CR',v_date,v_customer,v_bank,outstanding_amount,'Demo receipt',v_admin from public.accounts_receivable where id=v_ar_row returning id into v_receipt;
    insert into public.customer_receipt_allocations(company_id,receipt_id,receivable_id,allocated_amount,created_by) select v_company,v_receipt,v_ar_row,outstanding_amount,v_admin from public.accounts_receivable where id=v_ar_row;
    v_journal:=public.post_customer_receipt(v_company,v_receipt,'demo-receipt-v1');
  end if;

  if not exists(select 1 from public.purchase_invoices where company_id=v_company and document_number='PI-DEMO-001') then
    insert into public.purchase_invoices(company_id,branch_id,document_number,supplier_reference,document_date,posting_date,due_date,supplier_id,status,created_by,approved_by,approved_at) values(v_company,v_branch,'PI-DEMO-001','SUP-INV-001',v_date,v_date,v_date+30,v_supplier,'approved',v_admin,v_approver,now()) returning id into v_purchase_invoice;
    insert into public.purchase_invoice_lines(company_id,invoice_id,line_number,product_id,description,quantity,unit_cost,tax_rate_version_id,expense_account_id,created_by) values(v_company,v_purchase_invoice,1,v_service,'Jasa administrasi',1,2000000,v_tax_version,v_expense,v_admin);
    v_journal:=public.post_purchase_invoice(v_company,v_purchase_invoice,'demo-purchase-invoice-v1');
  else select id into v_purchase_invoice from public.purchase_invoices where company_id=v_company and document_number='PI-DEMO-001';end if;
  select id into v_ap_row from public.accounts_payable where purchase_invoice_id=v_purchase_invoice;
  if v_ap_row is not null and exists(select 1 from public.accounts_payable where id=v_ap_row and outstanding_amount>0) and not exists(select 1 from public.supplier_payments where company_id=v_company and notes='Demo payment') then
    insert into public.supplier_payments(company_id,branch_id,document_number,payment_date,supplier_id,bank_account_id,amount,notes,created_by) select v_company,v_branch,'DRAFT-DEMO-SP',v_date,v_supplier,v_bank,outstanding_amount,'Demo payment',v_admin from public.accounts_payable where id=v_ap_row returning id into v_payment;
    insert into public.supplier_payment_allocations(company_id,payment_id,payable_id,allocated_amount,created_by) select v_company,v_payment,v_ap_row,outstanding_amount,v_admin from public.accounts_payable where id=v_ap_row;
    v_journal:=public.post_supplier_payment(v_company,v_payment,'demo-payment-v1');
  end if;

  insert into public.tax_export_profiles(company_id,code,name,adapter_code,adapter_version,status,effective_from,source_reference,configuration,created_by) values(v_company,'GENERIC-DEMO','Generic Demo Export','generic_csv','1.0.0','demo',make_date(v_year,1,1),'Internal demo profile',jsonb_build_object('disclaimer','DEMO / NOT FOR OFFICIAL SUBMISSION'),v_admin) on conflict(company_id,code,adapter_version) do nothing;
  return v_company;
end;
$$;

revoke all on function public.bootstrap_demo_company(jsonb) from public,anon,authenticated;
grant execute on function public.bootstrap_demo_company(jsonb) to service_role;

commit;
