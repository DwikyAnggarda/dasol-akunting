begin;

create extension if not exists btree_gist with schema extensions;

-- PostgreSQL requires the referenced column set to be a candidate key. The
-- warehouse primary key makes `id` globally unique, while this additional key
-- also lets tenant-safe foreign keys enforce `(company_id, warehouse_id)`.
alter table public.warehouses
  add constraint warehouses_company_id_id_key unique (company_id, id);

create table public.payment_terms (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete restrict,
  code text not null,
  name text not null,
  due_days integer not null default 0 check (due_days between 0 and 3650),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id),
  updated_at timestamptz,
  updated_by uuid references auth.users(id),
  version integer not null default 1 check (version > 0),
  unique (company_id, id),
  unique (company_id, code)
);

create table public.contacts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete restrict,
  code text not null,
  contact_type text not null check (contact_type in ('customer', 'supplier', 'both')),
  display_name text not null,
  legal_name text,
  email text,
  phone text,
  tax_id text,
  national_id text,
  tax_branch_id text,
  is_taxable_entrepreneur boolean not null default false,
  payment_term_id uuid,
  credit_limit numeric(24,4) not null default 0 check (credit_limit >= 0),
  receivable_account_id uuid,
  payable_account_id uuid,
  is_active boolean not null default true,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id),
  updated_at timestamptz,
  updated_by uuid references auth.users(id),
  version integer not null default 1 check (version > 0),
  unique (company_id, id),
  unique (company_id, code),
  foreign key (company_id, payment_term_id) references public.payment_terms(company_id, id) on delete restrict,
  foreign key (company_id, receivable_account_id) references public.chart_of_accounts(company_id, id) on delete restrict,
  foreign key (company_id, payable_account_id) references public.chart_of_accounts(company_id, id) on delete restrict
);

create table public.contact_addresses (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete restrict,
  contact_id uuid not null,
  address_type text not null check (address_type in ('billing', 'shipping', 'registered', 'other')),
  address_line text not null,
  city text,
  province text,
  postal_code text,
  country_code char(2) not null default 'ID',
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id),
  updated_at timestamptz,
  updated_by uuid references auth.users(id),
  version integer not null default 1 check (version > 0),
  foreign key (company_id, contact_id) references public.contacts(company_id, id) on delete cascade
);

create table public.units (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete restrict,
  code text not null,
  name text not null,
  decimal_places smallint not null default 2 check (decimal_places between 0 and 6),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id),
  updated_at timestamptz,
  updated_by uuid references auth.users(id),
  version integer not null default 1 check (version > 0),
  unique (company_id, id),
  unique (company_id, code)
);

create table public.tax_codes (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete restrict,
  code text not null,
  name text not null,
  category text not null check (category in ('vat_input', 'vat_output', 'withholding_receivable', 'withholding_payable', 'final_withholding', 'non_taxable', 'exempt', 'other')),
  input_account_id uuid,
  output_account_id uuid,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id),
  updated_at timestamptz,
  updated_by uuid references auth.users(id),
  version integer not null default 1 check (version > 0),
  unique (company_id, id),
  unique (company_id, code),
  foreign key (company_id, input_account_id) references public.chart_of_accounts(company_id, id) on delete restrict,
  foreign key (company_id, output_account_id) references public.chart_of_accounts(company_id, id) on delete restrict
);

create table public.tax_rate_versions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete restrict,
  tax_code_id uuid not null,
  rate numeric(12,6) not null check (rate >= 0 and rate <= 100),
  effective_from date not null,
  effective_to date,
  calculation_basis text not null default 'transaction_value',
  price_includes_tax boolean not null default false,
  rounding_method text not null default 'half_up' check (rounding_method in ('half_up', 'up', 'down')),
  rounding_scale smallint not null default 2 check (rounding_scale between 0 and 6),
  status text not null default 'active' check (status in ('active', 'inactive')),
  source_reference text,
  notes text,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id),
  updated_at timestamptz,
  updated_by uuid references auth.users(id),
  version integer not null default 1 check (version > 0),
  check (effective_to is null or effective_to >= effective_from),
  unique (company_id, id),
  foreign key (company_id, tax_code_id) references public.tax_codes(company_id, id) on delete restrict,
  exclude using gist (
    company_id with =,
    tax_code_id with =,
    daterange(effective_from, coalesce(effective_to, 'infinity'::date), '[]') with &&
  ) where (status = 'active')
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete restrict,
  sku text not null,
  barcode text,
  name text not null,
  product_type text not null check (product_type in ('inventory', 'non_inventory', 'service')),
  base_unit_id uuid not null,
  sales_account_id uuid not null,
  purchase_account_id uuid not null,
  inventory_account_id uuid,
  cogs_account_id uuid,
  default_sales_tax_code_id uuid,
  default_purchase_tax_code_id uuid,
  minimum_stock numeric(24,6) not null default 0 check (minimum_stock >= 0),
  is_active boolean not null default true,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id),
  updated_at timestamptz,
  updated_by uuid references auth.users(id),
  version integer not null default 1 check (version > 0),
  unique (company_id, id),
  unique (company_id, sku),
  foreign key (company_id, base_unit_id) references public.units(company_id, id) on delete restrict,
  foreign key (company_id, sales_account_id) references public.chart_of_accounts(company_id, id) on delete restrict,
  foreign key (company_id, purchase_account_id) references public.chart_of_accounts(company_id, id) on delete restrict,
  foreign key (company_id, inventory_account_id) references public.chart_of_accounts(company_id, id) on delete restrict,
  foreign key (company_id, cogs_account_id) references public.chart_of_accounts(company_id, id) on delete restrict,
  foreign key (company_id, default_sales_tax_code_id) references public.tax_codes(company_id, id) on delete restrict,
  foreign key (company_id, default_purchase_tax_code_id) references public.tax_codes(company_id, id) on delete restrict,
  check (product_type <> 'inventory' or (inventory_account_id is not null and cogs_account_id is not null))
);

create table public.product_warehouses (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete restrict,
  product_id uuid not null,
  warehouse_id uuid not null,
  quantity_on_hand numeric(24,6) not null default 0 check (quantity_on_hand >= 0),
  quantity_reserved numeric(24,6) not null default 0 check (quantity_reserved >= 0 and quantity_reserved <= quantity_on_hand),
  average_cost numeric(24,6) not null default 0 check (average_cost >= 0),
  inventory_value numeric(24,4) not null default 0 check (inventory_value >= 0),
  last_movement_date date,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id),
  updated_at timestamptz,
  updated_by uuid references auth.users(id),
  version integer not null default 1 check (version > 0),
  unique (company_id, product_id, warehouse_id),
  foreign key (company_id, product_id) references public.products(company_id, id) on delete restrict,
  foreign key (company_id, warehouse_id) references public.warehouses(company_id, id) on delete restrict
);

create table public.inventory_movements (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete restrict,
  product_id uuid not null,
  warehouse_id uuid not null,
  movement_date date not null,
  movement_type text not null check (movement_type in ('opening', 'receipt', 'issue', 'transfer_in', 'transfer_out', 'adjustment_in', 'adjustment_out', 'return_in', 'return_out')),
  quantity numeric(24,6) not null check (quantity <> 0),
  unit_cost numeric(24,6) not null check (unit_cost >= 0),
  total_cost numeric(24,4) not null check (total_cost >= 0),
  running_quantity numeric(24,6) not null,
  running_average_cost numeric(24,6) not null check (running_average_cost >= 0),
  source_type text not null,
  source_id uuid not null,
  source_line_id uuid not null,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id),
  unique (company_id, source_type, source_line_id),
  foreign key (company_id, product_id) references public.products(company_id, id) on delete restrict,
  foreign key (company_id, warehouse_id) references public.warehouses(company_id, id) on delete restrict
);

create table public.sales_invoices (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete restrict,
  branch_id uuid not null references public.branches(id) on delete restrict,
  document_number text not null,
  document_date date not null,
  posting_date date not null,
  due_date date not null,
  customer_id uuid not null,
  currency_code char(3) not null default 'IDR' references public.currencies(code),
  exchange_rate numeric(24,10) not null default 1 check (exchange_rate > 0),
  status text not null default 'draft' check (status in ('draft', 'submitted', 'pending_approval', 'approved', 'rejected', 'posted', 'partially_paid', 'paid', 'reversed', 'voided')),
  subtotal numeric(24,4) not null default 0 check (subtotal >= 0),
  tax_total numeric(24,4) not null default 0 check (tax_total >= 0),
  total numeric(24,4) not null default 0 check (total >= 0),
  outstanding_balance numeric(24,4) not null default 0 check (outstanding_balance >= 0),
  notes text,
  submitted_by uuid references auth.users(id), submitted_at timestamptz,
  approved_by uuid references auth.users(id), approved_at timestamptz,
  posted_by uuid references auth.users(id), posted_at timestamptz,
  created_at timestamptz not null default now(),
  created_by uuid not null references auth.users(id),
  updated_at timestamptz,
  updated_by uuid references auth.users(id),
  version integer not null default 1 check (version > 0),
  unique (company_id, id),
  unique (company_id, document_number),
  foreign key (company_id, customer_id) references public.contacts(company_id, id) on delete restrict,
  check (due_date >= document_date)
);

create table public.sales_invoice_lines (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete restrict,
  invoice_id uuid not null,
  line_number integer not null check (line_number > 0),
  product_id uuid not null,
  warehouse_id uuid,
  description text not null,
  quantity numeric(24,6) not null check (quantity > 0),
  unit_price numeric(24,6) not null check (unit_price >= 0),
  discount_amount numeric(24,4) not null default 0 check (discount_amount >= 0),
  tax_rate_version_id uuid,
  revenue_account_id uuid not null,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id),
  updated_at timestamptz,
  updated_by uuid references auth.users(id),
  version integer not null default 1 check (version > 0),
  unique (invoice_id, line_number),
  foreign key (company_id, invoice_id) references public.sales_invoices(company_id, id) on delete cascade,
  foreign key (company_id, product_id) references public.products(company_id, id) on delete restrict,
  foreign key (company_id, warehouse_id) references public.warehouses(company_id, id) on delete restrict,
  foreign key (company_id, tax_rate_version_id) references public.tax_rate_versions(company_id, id) on delete restrict,
  foreign key (company_id, revenue_account_id) references public.chart_of_accounts(company_id, id) on delete restrict,
  check (discount_amount <= quantity * unit_price)
);

create table public.document_line_taxes (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete restrict,
  document_type text not null,
  document_id uuid not null,
  document_line_id uuid not null,
  tax_code_id uuid not null,
  tax_rate_version_id uuid not null,
  tax_base numeric(24,4) not null check (tax_base >= 0),
  rate numeric(12,6) not null check (rate >= 0),
  tax_amount numeric(24,4) not null check (tax_amount >= 0),
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id),
  unique (company_id, document_type, document_line_id, tax_code_id),
  foreign key (company_id, tax_code_id) references public.tax_codes(company_id, id) on delete restrict,
  foreign key (company_id, tax_rate_version_id) references public.tax_rate_versions(company_id, id) on delete restrict
);

create table public.accounts_receivable (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete restrict,
  customer_id uuid not null,
  sales_invoice_id uuid not null,
  document_number text not null,
  document_date date not null,
  due_date date not null,
  original_amount numeric(24,4) not null check (original_amount > 0),
  outstanding_amount numeric(24,4) not null check (outstanding_amount >= 0),
  status text not null default 'open' check (status in ('open', 'partially_paid', 'paid', 'reversed')),
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id),
  updated_at timestamptz,
  updated_by uuid references auth.users(id),
  version integer not null default 1 check (version > 0),
  unique (company_id, sales_invoice_id),
  foreign key (company_id, customer_id) references public.contacts(company_id, id) on delete restrict,
  foreign key (company_id, sales_invoice_id) references public.sales_invoices(company_id, id) on delete restrict
);

create table public.purchase_invoices (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete restrict,
  branch_id uuid not null references public.branches(id) on delete restrict,
  document_number text not null,
  supplier_reference text,
  document_date date not null,
  posting_date date not null,
  due_date date not null,
  supplier_id uuid not null,
  status text not null default 'draft' check (status in ('draft', 'submitted', 'pending_approval', 'approved', 'rejected', 'posted', 'partially_paid', 'paid', 'reversed', 'voided')),
  subtotal numeric(24,4) not null default 0 check (subtotal >= 0),
  tax_total numeric(24,4) not null default 0 check (tax_total >= 0),
  total numeric(24,4) not null default 0 check (total >= 0),
  outstanding_balance numeric(24,4) not null default 0 check (outstanding_balance >= 0),
  submitted_by uuid references auth.users(id), submitted_at timestamptz,
  approved_by uuid references auth.users(id), approved_at timestamptz,
  posted_by uuid references auth.users(id), posted_at timestamptz,
  created_at timestamptz not null default now(),
  created_by uuid not null references auth.users(id),
  updated_at timestamptz,
  updated_by uuid references auth.users(id),
  version integer not null default 1 check (version > 0),
  unique (company_id, id),
  unique (company_id, document_number),
  foreign key (company_id, supplier_id) references public.contacts(company_id, id) on delete restrict
);

create table public.purchase_invoice_lines (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete restrict,
  invoice_id uuid not null,
  line_number integer not null check (line_number > 0),
  product_id uuid not null,
  warehouse_id uuid,
  description text not null,
  quantity numeric(24,6) not null check (quantity > 0),
  unit_cost numeric(24,6) not null check (unit_cost >= 0),
  discount_amount numeric(24,4) not null default 0 check (discount_amount >= 0),
  tax_rate_version_id uuid,
  expense_account_id uuid not null,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id),
  updated_at timestamptz,
  updated_by uuid references auth.users(id),
  version integer not null default 1 check (version > 0),
  unique (invoice_id, line_number),
  foreign key (company_id, invoice_id) references public.purchase_invoices(company_id, id) on delete cascade,
  foreign key (company_id, product_id) references public.products(company_id, id) on delete restrict,
  foreign key (company_id, warehouse_id) references public.warehouses(company_id, id) on delete restrict,
  foreign key (company_id, tax_rate_version_id) references public.tax_rate_versions(company_id, id) on delete restrict,
  foreign key (company_id, expense_account_id) references public.chart_of_accounts(company_id, id) on delete restrict,
  check (discount_amount <= quantity * unit_cost)
);

create table public.accounts_payable (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete restrict,
  supplier_id uuid not null,
  purchase_invoice_id uuid not null,
  document_number text not null,
  document_date date not null,
  due_date date not null,
  original_amount numeric(24,4) not null check (original_amount > 0),
  outstanding_amount numeric(24,4) not null check (outstanding_amount >= 0),
  status text not null default 'open' check (status in ('open', 'partially_paid', 'paid', 'reversed')),
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id),
  updated_at timestamptz,
  updated_by uuid references auth.users(id),
  version integer not null default 1 check (version > 0),
  unique (company_id, purchase_invoice_id),
  foreign key (company_id, supplier_id) references public.contacts(company_id, id) on delete restrict,
  foreign key (company_id, purchase_invoice_id) references public.purchase_invoices(company_id, id) on delete restrict
);

create table public.approval_workflows (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete restrict,
  document_type text not null,
  name text not null,
  is_active boolean not null default true,
  allow_self_approval boolean not null default false,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id),
  updated_at timestamptz,
  updated_by uuid references auth.users(id),
  version integer not null default 1 check (version > 0),
  unique (company_id, id),
  unique (company_id, document_type, name)
);

create table public.approval_workflow_steps (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete restrict,
  workflow_id uuid not null,
  step_order smallint not null check (step_order > 0),
  required_permission text not null,
  minimum_amount numeric(24,4),
  maximum_amount numeric(24,4),
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id),
  unique (workflow_id, step_order),
  foreign key (company_id, workflow_id) references public.approval_workflows(company_id, id) on delete cascade,
  check (minimum_amount is null or maximum_amount is null or minimum_amount <= maximum_amount)
);

create table public.approval_requests (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete restrict,
  document_type text not null,
  document_id uuid not null,
  document_number text not null,
  workflow_id uuid,
  current_step smallint not null default 1,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'cancelled')),
  submitted_by uuid not null references auth.users(id),
  submitted_at timestamptz not null default now(),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id),
  unique (company_id, document_type, document_id),
  foreign key (company_id, workflow_id) references public.approval_workflows(company_id, id) on delete restrict
);

create table public.approval_actions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete restrict,
  request_id uuid not null references public.approval_requests(id) on delete restrict,
  step smallint not null,
  action text not null check (action in ('submit', 'approve', 'reject', 'request_revision')),
  actor_user_id uuid not null references auth.users(id),
  comment text,
  created_at timestamptz not null default now()
);

create table public.attachments (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete restrict,
  entity_type text not null,
  entity_id uuid not null,
  storage_path text not null,
  original_filename text not null,
  mime_type text not null,
  size_bytes bigint not null check (size_bytes > 0 and size_bytes <= 10485760),
  created_at timestamptz not null default now(),
  created_by uuid not null references auth.users(id),
  unique (company_id, storage_path)
);

create index contacts_company_type_idx on public.contacts(company_id, contact_type, is_active);
create index products_company_type_idx on public.products(company_id, product_type, is_active);
create index inventory_movements_card_idx on public.inventory_movements(company_id, product_id, warehouse_id, movement_date, created_at);
create index sales_invoices_company_status_date_idx on public.sales_invoices(company_id, status, document_date desc);
create index purchase_invoices_company_status_date_idx on public.purchase_invoices(company_id, status, document_date desc);
create index ar_aging_idx on public.accounts_receivable(company_id, status, due_date) where outstanding_amount > 0;
create index ap_aging_idx on public.accounts_payable(company_id, status, due_date) where outstanding_amount > 0;
create index approvals_queue_idx on public.approval_requests(company_id, status, submitted_at) where status = 'pending';

create trigger payment_terms_updated before update on public.payment_terms for each row execute function public.set_updated_metadata();
create trigger contacts_updated before update on public.contacts for each row execute function public.set_updated_metadata();
create trigger addresses_updated before update on public.contact_addresses for each row execute function public.set_updated_metadata();
create trigger units_updated before update on public.units for each row execute function public.set_updated_metadata();
create trigger tax_codes_updated before update on public.tax_codes for each row execute function public.set_updated_metadata();
create trigger tax_versions_updated before update on public.tax_rate_versions for each row execute function public.set_updated_metadata();
create trigger products_updated before update on public.products for each row execute function public.set_updated_metadata();
create trigger product_warehouses_updated before update on public.product_warehouses for each row execute function public.set_updated_metadata();
create trigger sales_invoices_updated before update on public.sales_invoices for each row execute function public.set_updated_metadata();
create trigger sales_invoice_lines_updated before update on public.sales_invoice_lines for each row execute function public.set_updated_metadata();
create trigger ar_updated before update on public.accounts_receivable for each row execute function public.set_updated_metadata();
create trigger purchase_invoices_updated before update on public.purchase_invoices for each row execute function public.set_updated_metadata();
create trigger purchase_invoice_lines_updated before update on public.purchase_invoice_lines for each row execute function public.set_updated_metadata();
create trigger ap_updated before update on public.accounts_payable for each row execute function public.set_updated_metadata();
create trigger approval_workflows_updated before update on public.approval_workflows for each row execute function public.set_updated_metadata();

create or replace function public.prevent_append_only_mutation()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin raise exception using message = 'Catatan posted bersifat append-only.'; end;
$$;
create trigger inventory_movements_append_only before update or delete on public.inventory_movements for each row execute function public.prevent_append_only_mutation();
create trigger document_taxes_append_only before update or delete on public.document_line_taxes for each row execute function public.prevent_append_only_mutation();
create trigger approval_actions_append_only before update or delete on public.approval_actions for each row execute function public.prevent_append_only_mutation();
create trigger audit_logs_append_only before update or delete on public.audit_logs for each row execute function public.prevent_append_only_mutation();

do $$
declare table_name text;
begin
  foreach table_name in array array[
    'payment_terms','contacts','contact_addresses','units','tax_codes','tax_rate_versions','products',
    'product_warehouses','inventory_movements','sales_invoices','sales_invoice_lines','document_line_taxes',
    'accounts_receivable','purchase_invoices','purchase_invoice_lines','accounts_payable','approval_workflows',
    'approval_workflow_steps','approval_requests','approval_actions','attachments'
  ] loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('create policy %I on public.%I for select to authenticated using (public.current_user_has_company_access(company_id))', table_name || '_read', table_name);
  end loop;
end $$;

create policy payment_terms_write on public.payment_terms for all to authenticated using (public.current_user_has_permission(company_id, 'settings.manage')) with check (public.current_user_has_permission(company_id, 'settings.manage'));
create policy contacts_write on public.contacts for all to authenticated using (public.current_user_has_permission(company_id, 'contact.write')) with check (public.current_user_has_permission(company_id, 'contact.write'));
create policy addresses_write on public.contact_addresses for all to authenticated using (public.current_user_has_permission(company_id, 'contact.write')) with check (public.current_user_has_permission(company_id, 'contact.write'));
create policy units_write on public.units for all to authenticated using (public.current_user_has_permission(company_id, 'item.write')) with check (public.current_user_has_permission(company_id, 'item.write'));
create policy tax_codes_write on public.tax_codes for all to authenticated using (public.current_user_has_permission(company_id, 'settings.manage')) with check (public.current_user_has_permission(company_id, 'settings.manage'));
create policy tax_versions_write on public.tax_rate_versions for all to authenticated using (public.current_user_has_permission(company_id, 'settings.manage')) with check (public.current_user_has_permission(company_id, 'settings.manage'));
create policy products_write on public.products for all to authenticated using (public.current_user_has_permission(company_id, 'item.write')) with check (public.current_user_has_permission(company_id, 'item.write'));
create policy product_warehouses_write on public.product_warehouses for all to authenticated using (public.current_user_has_permission(company_id, 'inventory.write')) with check (public.current_user_has_permission(company_id, 'inventory.write'));
create policy sales_invoice_insert on public.sales_invoices for insert to authenticated with check (created_by = auth.uid() and status = 'draft' and public.current_user_has_permission(company_id, 'sales.create'));
create policy sales_invoice_update on public.sales_invoices for update to authenticated using (status in ('draft','rejected') and public.current_user_has_permission(company_id, 'sales.update')) with check (status in ('draft','rejected') and public.current_user_has_permission(company_id, 'sales.update'));
create policy sales_lines_write on public.sales_invoice_lines for all to authenticated using (public.current_user_has_permission(company_id, 'sales.update') and exists (select 1 from public.sales_invoices invoice where invoice.id = sales_invoice_lines.invoice_id and invoice.status in ('draft','rejected'))) with check (public.current_user_has_permission(company_id, 'sales.update') and exists (select 1 from public.sales_invoices invoice where invoice.id = sales_invoice_lines.invoice_id and invoice.status in ('draft','rejected')));
create policy purchase_invoice_insert on public.purchase_invoices for insert to authenticated with check (created_by = auth.uid() and status = 'draft' and public.current_user_has_permission(company_id, 'purchase.create'));
create policy purchase_invoice_update on public.purchase_invoices for update to authenticated using (status in ('draft','rejected') and public.current_user_has_permission(company_id, 'purchase.update')) with check (status in ('draft','rejected') and public.current_user_has_permission(company_id, 'purchase.update'));
create policy purchase_lines_write on public.purchase_invoice_lines for all to authenticated using (public.current_user_has_permission(company_id, 'purchase.update') and exists (select 1 from public.purchase_invoices invoice where invoice.id = purchase_invoice_lines.invoice_id and invoice.status in ('draft','rejected'))) with check (public.current_user_has_permission(company_id, 'purchase.update') and exists (select 1 from public.purchase_invoices invoice where invoice.id = purchase_invoice_lines.invoice_id and invoice.status in ('draft','rejected')));
create policy approvals_workflow_write on public.approval_workflows for all to authenticated using (public.current_user_has_permission(company_id, 'settings.manage')) with check (public.current_user_has_permission(company_id, 'settings.manage'));
create policy approvals_steps_write on public.approval_workflow_steps for all to authenticated using (public.current_user_has_permission(company_id, 'settings.manage')) with check (public.current_user_has_permission(company_id, 'settings.manage'));
create policy attachments_insert on public.attachments for insert to authenticated with check (created_by = auth.uid() and public.current_user_has_company_access(company_id));

grant select, insert, update, delete on public.payment_terms, public.contacts, public.contact_addresses, public.units, public.tax_codes, public.tax_rate_versions, public.products, public.product_warehouses to authenticated;
grant select on public.inventory_movements, public.document_line_taxes, public.accounts_receivable, public.accounts_payable, public.approval_requests, public.approval_actions to authenticated;
grant select, insert, update, delete on public.sales_invoices, public.sales_invoice_lines, public.purchase_invoices, public.purchase_invoice_lines to authenticated;
grant select, insert, update, delete on public.approval_workflows, public.approval_workflow_steps to authenticated;
grant select, insert on public.attachments to authenticated;

commit;
