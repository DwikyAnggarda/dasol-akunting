begin;

alter table public.roles
  add column if not exists is_active boolean not null default true;

drop trigger if exists companies_audit on public.companies;
create trigger companies_audit
after insert or update or delete on public.companies
for each row execute function public.audit_row_change();

create or replace function public.current_user_has_company_access(p_company_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.company_memberships membership
    join public.roles role
      on role.id = membership.role_id
      and role.company_id = membership.company_id
    where membership.company_id = p_company_id
      and membership.user_id = auth.uid()
      and membership.status = 'active'
      and role.is_active
  );
$$;

create or replace function public.current_user_has_permission(p_company_id uuid, p_permission_code text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.company_memberships membership
    join public.roles role
      on role.id = membership.role_id
      and role.company_id = membership.company_id
      and role.is_active
    join public.role_permissions role_permission
      on role_permission.role_id = membership.role_id
      and role_permission.company_id = membership.company_id
    join public.permissions permission on permission.id = role_permission.permission_id
    where membership.company_id = p_company_id
      and membership.user_id = auth.uid()
      and membership.status = 'active'
      and permission.code = p_permission_code
  );
$$;

create or replace function public.current_user_role(p_company_id uuid)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select role.code
  from public.company_memberships membership
  join public.roles role
    on role.id = membership.role_id
    and role.company_id = membership.company_id
  where membership.company_id = p_company_id
    and membership.user_id = auth.uid()
    and membership.status = 'active'
    and role.is_active
  limit 1;
$$;

create or replace function public.get_my_permissions(p_company_id uuid)
returns text[]
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(array_agg(permission.code order by permission.code), '{}'::text[])
  from public.company_memberships membership
  join public.roles role
    on role.id = membership.role_id
    and role.company_id = membership.company_id
    and role.is_active
  join public.role_permissions role_permission
    on role_permission.role_id = membership.role_id
    and role_permission.company_id = membership.company_id
  join public.permissions permission on permission.id = role_permission.permission_id
  where membership.company_id = p_company_id
    and membership.user_id = auth.uid()
    and membership.status = 'active';
$$;

create or replace function public.protect_membership_self_lockout()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.user_id = auth.uid()
     and (new.status <> 'active' or new.role_id <> old.role_id) then
    raise exception using errcode = '42501', message = 'Keanggotaan aktif Anda sendiri tidak dapat dinonaktifkan atau diubah rolenya.';
  end if;
  return new;
end;
$$;

drop trigger if exists memberships_self_lockout on public.company_memberships;
create trigger memberships_self_lockout
before update on public.company_memberships
for each row execute function public.protect_membership_self_lockout();

create or replace function public.save_role(
  p_company_id uuid,
  p_role_id uuid,
  p_code text,
  p_name text,
  p_permission_codes text[],
  p_version integer default null
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  role_id uuid;
  existing public.roles%rowtype;
  clean_code text := lower(trim(p_code));
  clean_name text := trim(p_name);
begin
  if not public.current_user_has_permission(p_company_id, 'role.manage') then
    raise exception using errcode = '42501', message = 'Anda tidak memiliki izin mengelola role.';
  end if;
  if clean_code !~ '^[a-z][a-z0-9_-]{1,39}$' or length(clean_name) not between 2 and 80 then
    raise exception using errcode = '22023', message = 'Kode atau nama role tidak valid.';
  end if;
  if cardinality(p_permission_codes) = 0 then
    raise exception using errcode = '22023', message = 'Role harus memiliki minimal satu permission.';
  end if;
  if exists (
    select 1 from unnest(p_permission_codes) requested(code)
    left join public.permissions permission on permission.code = requested.code
    where permission.id is null
  ) then
    raise exception using errcode = '22023', message = 'Permission role tidak valid.';
  end if;

  if p_role_id is null then
    insert into public.roles(company_id, code, name, is_system, is_active, created_by)
    values(p_company_id, clean_code, clean_name, false, true, auth.uid())
    returning id into role_id;
  else
    select * into existing
    from public.roles
    where company_id = p_company_id and id = p_role_id
    for update;
    if not found then
      raise exception using errcode = 'P0002', message = 'Role tidak ditemukan.';
    end if;
    if existing.version <> p_version then
      raise exception using errcode = '40001', message = 'Role telah diubah pengguna lain.';
    end if;
    if existing.is_system then
      raise exception using errcode = '42501', message = 'Role sistem tidak dapat diedit.';
    end if;
    if exists (
      select 1 from public.company_memberships membership
      where membership.company_id = p_company_id
        and membership.user_id = auth.uid()
        and membership.role_id = p_role_id
        and membership.status = 'active'
    ) and not ('role.manage' = any(p_permission_codes)) then
      raise exception using errcode = '42501', message = 'Permission role.manage tidak boleh dihapus dari role Anda sendiri.';
    end if;
    update public.roles
    set code = clean_code, name = clean_name, updated_by = auth.uid()
    where id = p_role_id;
    role_id := p_role_id;
    delete from public.role_permissions where company_id = p_company_id and role_id = p_role_id;
  end if;

  insert into public.role_permissions(company_id, role_id, permission_id, created_by)
  select p_company_id, role_id, permission.id, auth.uid()
  from public.permissions permission
  where permission.code = any(p_permission_codes);
  return role_id;
end;
$$;

create or replace function public.set_role_active(
  p_company_id uuid,
  p_role_id uuid,
  p_is_active boolean,
  p_version integer
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  existing public.roles%rowtype;
begin
  if not public.current_user_has_permission(p_company_id, 'role.manage') then
    raise exception using errcode = '42501', message = 'Anda tidak memiliki izin mengelola role.';
  end if;
  select * into existing from public.roles
  where company_id = p_company_id and id = p_role_id for update;
  if not found then raise exception using errcode = 'P0002', message = 'Role tidak ditemukan.'; end if;
  if existing.version <> p_version then raise exception using errcode = '40001', message = 'Role telah diubah pengguna lain.'; end if;
  if existing.is_system then raise exception using errcode = '42501', message = 'Role sistem tidak dapat dinonaktifkan.'; end if;
  if not p_is_active and exists (
    select 1 from public.company_memberships membership
    where membership.company_id = p_company_id
      and membership.role_id = p_role_id
      and membership.status = 'active'
  ) then
    raise exception using errcode = '23503', message = 'Role masih digunakan oleh anggota aktif.';
  end if;
  update public.roles set is_active = p_is_active, updated_by = auth.uid() where id = p_role_id;
  return p_role_id;
end;
$$;

create or replace function public.save_account_mappings(
  p_company_id uuid,
  p_mappings jsonb
)
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  allowed_codes constant text[] := array[
    'accounts_receivable', 'accounts_payable', 'inventory', 'cost_of_goods_sold',
    'sales_revenue', 'goods_received_not_invoiced', 'output_tax', 'input_tax',
    'withholding_tax', 'bank_fee', 'rounding', 'retained_earnings',
    'exchange_gain', 'exchange_loss'
  ];
  mapping record;
  saved integer := 0;
begin
  if not public.current_user_has_permission(p_company_id, 'settings.manage') then
    raise exception using errcode = '42501', message = 'Anda tidak memiliki izin mengelola pemetaan akun.';
  end if;
  if jsonb_typeof(p_mappings) <> 'object' then
    raise exception using errcode = '22023', message = 'Pemetaan akun tidak valid.';
  end if;
  for mapping in select key, value #>> '{}' as account_id from jsonb_each(p_mappings)
  loop
    if not (mapping.key = any(allowed_codes)) then
      raise exception using errcode = '22023', message = 'Kode pemetaan akun tidak valid.';
    end if;
    if not exists (
      select 1 from public.chart_of_accounts account
      where account.company_id = p_company_id
        and account.id = mapping.account_id::uuid
        and account.is_active
    ) then
      raise exception using errcode = '23503', message = 'Akun pemetaan tidak aktif atau tidak ditemukan.';
    end if;
    insert into public.account_mappings(company_id, mapping_code, account_id, created_by, updated_by)
    values(p_company_id, mapping.key, mapping.account_id::uuid, auth.uid(), auth.uid())
    on conflict(company_id, mapping_code) do update
    set account_id = excluded.account_id, updated_by = auth.uid();
    saved := saved + 1;
  end loop;
  return saved;
end;
$$;

revoke all on function public.save_role(uuid, uuid, text, text, text[], integer) from public, anon;
revoke all on function public.set_role_active(uuid, uuid, boolean, integer) from public, anon;
revoke all on function public.save_account_mappings(uuid, jsonb) from public, anon;
grant execute on function public.save_role(uuid, uuid, text, text, text[], integer) to authenticated;
grant execute on function public.set_role_active(uuid, uuid, boolean, integer) to authenticated;
grant execute on function public.save_account_mappings(uuid, jsonb) to authenticated;

commit;
