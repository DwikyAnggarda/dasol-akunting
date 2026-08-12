begin;

alter table public.contacts
  add column if not exists default_tax_code_id uuid,
  add column if not exists notes text,
  add constraint contacts_default_tax_code_fk
    foreign key (company_id, default_tax_code_id)
    references public.tax_codes(company_id, id) on delete restrict;

alter table public.products
  add column if not exists sales_price numeric(24,4) not null default 0 check (sales_price >= 0),
  add column if not exists purchase_price numeric(24,4) not null default 0 check (purchase_price >= 0);

alter table public.warehouses
  add column if not exists address_line text,
  add column if not exists city text,
  add column if not exists province text,
  add column if not exists postal_code text;

alter table public.bank_accounts
  add column if not exists account_type text not null default 'bank'
    check (account_type in ('bank', 'cash'));

create or replace function public.audit_row_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  old_data jsonb := case when tg_op = 'INSERT' then null else to_jsonb(old) end;
  new_data jsonb := case when tg_op = 'DELETE' then null else to_jsonb(new) end;
  company uuid := coalesce((new_data->>'company_id')::uuid, (old_data->>'company_id')::uuid);
  entity uuid := coalesce((new_data->>'id')::uuid, (old_data->>'id')::uuid);
  changed text[] := '{}';
begin
  if auth.uid() is null then
    return coalesce(new, old);
  end if;

  if tg_op = 'UPDATE' then
    select coalesce(array_agg(key order by key), '{}')
    into changed
    from jsonb_object_keys(old_data || new_data) key
    where old_data->key is distinct from new_data->key;
  end if;

  insert into public.audit_logs(
    company_id, actor_user_id, actor_role, action, entity_type, entity_id,
    document_number, before_data, after_data, changed_fields
  )
  values(
    company,
    auth.uid(),
    public.current_user_role(company),
    lower(tg_op),
    tg_table_name,
    entity,
    coalesce(new_data->>'document_number', old_data->>'document_number', new_data->>'code', old_data->>'code'),
    old_data,
    new_data,
    changed
  );

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

create or replace function public.enforce_account_integrity()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.parent_id = new.id then
    raise exception using errcode = '23514', message = 'Akun tidak dapat menjadi induk dirinya sendiri.';
  end if;

  if new.parent_id is not null and exists (
    with recursive descendants as (
      select id, parent_id from public.chart_of_accounts where id = new.parent_id and company_id = new.company_id
      union all
      select account.id, account.parent_id
      from public.chart_of_accounts account
      join descendants on account.id = descendants.parent_id
      where account.company_id = new.company_id
    )
    select 1 from descendants where id = new.id
  ) then
    raise exception using errcode = '23514', message = 'Hierarki akun membentuk siklus.';
  end if;

  if tg_op = 'UPDATE' and new.account_type <> old.account_type and exists (
    select 1 from public.journal_lines where account_id = old.id limit 1
  ) then
    raise exception using errcode = '23514', message = 'Tipe akun yang sudah digunakan pada jurnal tidak dapat diubah.';
  end if;

  return new;
end;
$$;

create or replace function public.enforce_product_type_integrity()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' and new.product_type <> old.product_type and exists (
    select 1 from public.inventory_movements where product_id = old.id limit 1
  ) then
    raise exception using errcode = '23514', message = 'Tipe produk yang sudah memiliki pergerakan stok tidak dapat diubah.';
  end if;
  return new;
end;
$$;

create or replace function public.protect_used_tax_rate()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if exists (
    select 1 from public.sales_invoice_lines where tax_rate_version_id = old.id
    union all
    select 1 from public.purchase_invoice_lines where tax_rate_version_id = old.id
    union all
    select 1 from public.document_line_taxes where tax_rate_version_id = old.id
    limit 1
  ) then
    raise exception using errcode = '23514', message = 'Versi tarif yang sudah digunakan tidak dapat diubah atau dihapus.';
  end if;
  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

create trigger accounts_integrity
before insert or update on public.chart_of_accounts
for each row execute function public.enforce_account_integrity();

create trigger products_type_integrity
before update on public.products
for each row execute function public.enforce_product_type_integrity();

create trigger tax_rates_used_immutable
before update or delete on public.tax_rate_versions
for each row execute function public.protect_used_tax_rate();

do $audit$
declare
  table_name text;
begin
  foreach table_name in array array[
    'chart_of_accounts', 'contacts', 'contact_addresses', 'products', 'warehouses',
    'tax_codes', 'tax_rate_versions', 'bank_accounts', 'account_mappings',
    'company_settings', 'roles', 'role_permissions', 'company_memberships'
  ] loop
    execute format(
      'create trigger %I after insert or update or delete on public.%I for each row execute function public.audit_row_change()',
      table_name || '_audit',
      table_name
    );
  end loop;
end;
$audit$;

-- Master data uses archive/deactivation. Remove broad delete-capable policies
-- and replace them with explicit create/update permissions.
drop policy if exists accounts_write on public.chart_of_accounts;
create policy accounts_insert on public.chart_of_accounts for insert to authenticated
with check (created_by = auth.uid() and public.current_user_has_permission(company_id, 'coa.write'));
create policy accounts_update on public.chart_of_accounts for update to authenticated
using (public.current_user_has_permission(company_id, 'coa.write'))
with check (public.current_user_has_permission(company_id, 'coa.write'));

drop policy if exists contacts_write on public.contacts;
create policy contacts_insert on public.contacts for insert to authenticated
with check (created_by = auth.uid() and public.current_user_has_permission(company_id, 'contact.write'));
create policy contacts_update on public.contacts for update to authenticated
using (public.current_user_has_permission(company_id, 'contact.write'))
with check (public.current_user_has_permission(company_id, 'contact.write'));

drop policy if exists products_write on public.products;
create policy products_insert on public.products for insert to authenticated
with check (created_by = auth.uid() and public.current_user_has_permission(company_id, 'item.write'));
create policy products_update on public.products for update to authenticated
using (public.current_user_has_permission(company_id, 'item.write'))
with check (public.current_user_has_permission(company_id, 'item.write'));

drop policy if exists warehouses_write_admin on public.warehouses;
create policy warehouses_insert on public.warehouses for insert to authenticated
with check (created_by = auth.uid() and public.current_user_has_permission(company_id, 'settings.manage'));
create policy warehouses_update on public.warehouses for update to authenticated
using (public.current_user_has_permission(company_id, 'settings.manage'))
with check (public.current_user_has_permission(company_id, 'settings.manage'));

drop policy if exists tax_codes_write on public.tax_codes;
create policy tax_codes_insert on public.tax_codes for insert to authenticated
with check (created_by = auth.uid() and public.current_user_has_permission(company_id, 'settings.manage'));
create policy tax_codes_update on public.tax_codes for update to authenticated
using (public.current_user_has_permission(company_id, 'settings.manage'))
with check (public.current_user_has_permission(company_id, 'settings.manage'));

drop policy if exists tax_versions_write on public.tax_rate_versions;
create policy tax_versions_insert on public.tax_rate_versions for insert to authenticated
with check (created_by = auth.uid() and public.current_user_has_permission(company_id, 'settings.manage'));
create policy tax_versions_update on public.tax_rate_versions for update to authenticated
using (public.current_user_has_permission(company_id, 'settings.manage'))
with check (public.current_user_has_permission(company_id, 'settings.manage'));

drop policy if exists bank_accounts_write on public.bank_accounts;
create policy bank_accounts_insert on public.bank_accounts for insert to authenticated
with check (created_by = auth.uid() and public.current_user_has_permission(company_id, 'settings.manage'));
create policy bank_accounts_update on public.bank_accounts for update to authenticated
using (public.current_user_has_permission(company_id, 'settings.manage'))
with check (public.current_user_has_permission(company_id, 'settings.manage'));

commit;
