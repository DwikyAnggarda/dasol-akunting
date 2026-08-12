begin;

create extension if not exists pgcrypto with schema extensions;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text,
  locale text not null default 'id-ID',
  created_at timestamptz not null default now(),
  updated_at timestamptz,
  version integer not null default 1 check (version > 0)
);

create table public.companies (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[A-Z0-9][A-Z0-9_-]{1,19}$'),
  name text not null check (length(trim(name)) between 2 and 160),
  legal_name text,
  tax_id text,
  base_currency_code char(3) not null default 'IDR',
  locale text not null default 'id-ID',
  timezone text not null default 'Asia/Jakarta',
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id),
  updated_at timestamptz,
  updated_by uuid references auth.users(id),
  version integer not null default 1 check (version > 0)
);

create table public.permissions (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[a-z][a-z0-9_-]+\.[a-z][a-z0-9_.-]+$'),
  description text not null,
  created_at timestamptz not null default now()
);

create table public.roles (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete restrict,
  code text not null,
  name text not null,
  is_system boolean not null default false,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id),
  updated_at timestamptz,
  updated_by uuid references auth.users(id),
  version integer not null default 1 check (version > 0),
  unique (company_id, id),
  unique (company_id, code)
);

create table public.role_permissions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete restrict,
  role_id uuid not null,
  permission_id uuid not null references public.permissions(id) on delete restrict,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id),
  unique (company_id, role_id, permission_id),
  foreign key (company_id, role_id) references public.roles(company_id, id) on delete cascade
);

create table public.company_memberships (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete restrict,
  user_id uuid not null references auth.users(id) on delete restrict,
  role_id uuid not null,
  status text not null default 'active' check (status in ('active', 'disabled')),
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id),
  updated_at timestamptz,
  updated_by uuid references auth.users(id),
  version integer not null default 1 check (version > 0),
  unique (company_id, user_id),
  foreign key (company_id, role_id) references public.roles(company_id, id) on delete restrict
);

create table public.branches (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete restrict,
  code text not null,
  name text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id),
  updated_at timestamptz,
  updated_by uuid references auth.users(id),
  version integer not null default 1 check (version > 0),
  unique (company_id, id),
  unique (company_id, code)
);

create table public.warehouses (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete restrict,
  branch_id uuid not null,
  code text not null,
  name text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id),
  updated_at timestamptz,
  updated_by uuid references auth.users(id),
  version integer not null default 1 check (version > 0),
  unique (company_id, code),
  foreign key (company_id, branch_id) references public.branches(company_id, id) on delete restrict
);

create table public.departments (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete restrict,
  code text not null,
  name text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id),
  updated_at timestamptz,
  updated_by uuid references auth.users(id),
  version integer not null default 1 check (version > 0),
  unique (company_id, code)
);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete restrict,
  code text not null,
  name text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id),
  updated_at timestamptz,
  updated_by uuid references auth.users(id),
  version integer not null default 1 check (version > 0),
  unique (company_id, code)
);

create table public.company_settings (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null unique references public.companies(id) on delete restrict,
  fiscal_year_start_month smallint not null default 1 check (fiscal_year_start_month between 1 and 12),
  inventory_method text not null default 'moving_weighted_average' check (inventory_method = 'moving_weighted_average'),
  allow_negative_stock boolean not null default false,
  allow_self_approval boolean not null default false,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id),
  updated_at timestamptz,
  updated_by uuid references auth.users(id),
  version integer not null default 1 check (version > 0)
);

create table public.company_feature_flags (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete restrict,
  feature_code text not null,
  enabled boolean not null default false,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id),
  updated_at timestamptz,
  updated_by uuid references auth.users(id),
  version integer not null default 1 check (version > 0),
  unique (company_id, feature_code)
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete restrict,
  actor_user_id uuid references auth.users(id),
  actor_role text,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  document_number text,
  before_data jsonb,
  after_data jsonb,
  changed_fields text[] not null default '{}',
  reason text,
  correlation_id uuid,
  ip_address inet,
  user_agent text,
  created_at timestamptz not null default now()
);

create index company_memberships_user_status_idx on public.company_memberships(user_id, status, company_id);
create index roles_company_idx on public.roles(company_id);
create index role_permissions_role_idx on public.role_permissions(role_id, permission_id);
create index branches_company_idx on public.branches(company_id, is_active);
create index warehouses_company_idx on public.warehouses(company_id, is_active);
create index audit_logs_company_created_idx on public.audit_logs(company_id, created_at desc);
create index audit_logs_entity_idx on public.audit_logs(company_id, entity_type, entity_id);

create or replace function public.set_updated_metadata()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at := now();
  new.version := old.version + 1;
  if auth.uid() is not null then new.updated_by := auth.uid(); end if;
  return new;
end;
$$;

create trigger companies_updated before update on public.companies for each row execute function public.set_updated_metadata();
create trigger roles_updated before update on public.roles for each row execute function public.set_updated_metadata();
create trigger memberships_updated before update on public.company_memberships for each row execute function public.set_updated_metadata();
create trigger branches_updated before update on public.branches for each row execute function public.set_updated_metadata();
create trigger warehouses_updated before update on public.warehouses for each row execute function public.set_updated_metadata();
create trigger departments_updated before update on public.departments for each row execute function public.set_updated_metadata();
create trigger projects_updated before update on public.projects for each row execute function public.set_updated_metadata();
create trigger company_settings_updated before update on public.company_settings for each row execute function public.set_updated_metadata();
create trigger feature_flags_updated before update on public.company_feature_flags for each row execute function public.set_updated_metadata();

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (new.id, coalesce(new.email, ''), nullif(new.raw_user_meta_data ->> 'display_name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_auth_user();

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
    where membership.company_id = p_company_id
      and membership.user_id = auth.uid()
      and membership.status = 'active'
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
  join public.roles role on role.id = membership.role_id
  where membership.company_id = p_company_id
    and membership.user_id = auth.uid()
    and membership.status = 'active'
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
  join public.role_permissions role_permission
    on role_permission.role_id = membership.role_id
    and role_permission.company_id = membership.company_id
  join public.permissions permission on permission.id = role_permission.permission_id
  where membership.company_id = p_company_id
    and membership.user_id = auth.uid()
    and membership.status = 'active';
$$;

revoke all on function public.handle_new_auth_user() from public, anon, authenticated;
revoke all on function public.current_user_has_company_access(uuid) from public, anon;
revoke all on function public.current_user_has_permission(uuid, text) from public, anon;
revoke all on function public.current_user_role(uuid) from public, anon;
revoke all on function public.get_my_permissions(uuid) from public, anon;
grant execute on function public.current_user_has_company_access(uuid) to authenticated;
grant execute on function public.current_user_has_permission(uuid, text) to authenticated;
grant execute on function public.current_user_role(uuid) to authenticated;
grant execute on function public.get_my_permissions(uuid) to authenticated;

alter table public.profiles enable row level security;
alter table public.companies enable row level security;
alter table public.permissions enable row level security;
alter table public.roles enable row level security;
alter table public.role_permissions enable row level security;
alter table public.company_memberships enable row level security;
alter table public.branches enable row level security;
alter table public.warehouses enable row level security;
alter table public.departments enable row level security;
alter table public.projects enable row level security;
alter table public.company_settings enable row level security;
alter table public.company_feature_flags enable row level security;
alter table public.audit_logs enable row level security;

create policy profiles_read_self on public.profiles for select to authenticated using (id = auth.uid());
create policy profiles_update_self on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
create policy companies_read_member on public.companies for select to authenticated using (public.current_user_has_company_access(id));
create policy companies_update_admin on public.companies for update to authenticated using (public.current_user_has_permission(id, 'company.manage')) with check (public.current_user_has_permission(id, 'company.manage'));
create policy permissions_read_authenticated on public.permissions for select to authenticated using (true);
create policy roles_read_member on public.roles for select to authenticated using (public.current_user_has_company_access(company_id));
create policy roles_write_admin on public.roles for all to authenticated using (public.current_user_has_permission(company_id, 'role.manage')) with check (public.current_user_has_permission(company_id, 'role.manage'));
create policy role_permissions_read_member on public.role_permissions for select to authenticated using (public.current_user_has_company_access(company_id));
create policy role_permissions_write_admin on public.role_permissions for all to authenticated using (public.current_user_has_permission(company_id, 'role.manage')) with check (public.current_user_has_permission(company_id, 'role.manage'));
create policy memberships_read_scope on public.company_memberships for select to authenticated using (user_id = auth.uid() or public.current_user_has_permission(company_id, 'user.manage'));
create policy memberships_write_admin on public.company_memberships for all to authenticated using (public.current_user_has_permission(company_id, 'user.manage')) with check (public.current_user_has_permission(company_id, 'user.manage'));
create policy branches_read_member on public.branches for select to authenticated using (public.current_user_has_company_access(company_id));
create policy branches_write_admin on public.branches for all to authenticated using (public.current_user_has_permission(company_id, 'company.manage')) with check (public.current_user_has_permission(company_id, 'company.manage'));
create policy warehouses_read_member on public.warehouses for select to authenticated using (public.current_user_has_company_access(company_id));
create policy warehouses_write_admin on public.warehouses for all to authenticated using (public.current_user_has_permission(company_id, 'settings.manage')) with check (public.current_user_has_permission(company_id, 'settings.manage'));
create policy departments_read_member on public.departments for select to authenticated using (public.current_user_has_company_access(company_id));
create policy departments_write_admin on public.departments for all to authenticated using (public.current_user_has_permission(company_id, 'settings.manage')) with check (public.current_user_has_permission(company_id, 'settings.manage'));
create policy projects_read_member on public.projects for select to authenticated using (public.current_user_has_company_access(company_id));
create policy projects_write_admin on public.projects for all to authenticated using (public.current_user_has_permission(company_id, 'settings.manage')) with check (public.current_user_has_permission(company_id, 'settings.manage'));
create policy company_settings_read_member on public.company_settings for select to authenticated using (public.current_user_has_company_access(company_id));
create policy company_settings_write_admin on public.company_settings for all to authenticated using (public.current_user_has_permission(company_id, 'settings.manage')) with check (public.current_user_has_permission(company_id, 'settings.manage'));
create policy feature_flags_read_member on public.company_feature_flags for select to authenticated using (public.current_user_has_company_access(company_id));
create policy feature_flags_write_admin on public.company_feature_flags for all to authenticated using (public.current_user_has_permission(company_id, 'settings.manage')) with check (public.current_user_has_permission(company_id, 'settings.manage'));
create policy audit_logs_read_authorized on public.audit_logs for select to authenticated using (public.current_user_has_permission(company_id, 'audit.read'));

insert into public.permissions (code, description) values
  ('approval.read', 'View approval queue and history'),
  ('audit.read', 'Read append-only audit events'),
  ('company.manage', 'Manage company and branches'),
  ('contact.read', 'Read contacts'),
  ('contact.write', 'Create and update contacts'),
  ('coa.read', 'Read chart of accounts'),
  ('coa.write', 'Manage chart of accounts'),
  ('inventory.read', 'Read inventory balances and movements'),
  ('inventory.write', 'Create inventory documents'),
  ('item.read', 'Read products and units'),
  ('item.write', 'Manage products and units'),
  ('journal.approve', 'Approve manual journals'),
  ('journal.create', 'Create manual journals'),
  ('journal.post', 'Post approved journals'),
  ('journal.read', 'Read journals and ledger'),
  ('journal.reverse', 'Reverse posted journals'),
  ('journal.submit', 'Submit manual journals'),
  ('period.close', 'Close accounting periods'),
  ('period.reopen', 'Reopen accounting periods'),
  ('purchase.approve', 'Approve purchase documents'),
  ('purchase.create', 'Create purchase documents'),
  ('purchase.post', 'Post approved purchase documents'),
  ('purchase.read', 'Read purchase documents'),
  ('purchase.submit', 'Submit purchase documents'),
  ('purchase.update', 'Update purchase drafts'),
  ('report.export', 'Export reports'),
  ('report.financial.read', 'Read financial reports'),
  ('report.tax.read', 'Read tax reports'),
  ('role.manage', 'Manage roles and permissions'),
  ('sales.approve', 'Approve sales documents'),
  ('sales.create', 'Create sales documents'),
  ('sales.post', 'Post approved sales documents'),
  ('sales.read', 'Read sales documents'),
  ('sales.submit', 'Submit sales documents'),
  ('sales.update', 'Update sales drafts'),
  ('settings.manage', 'Manage company accounting settings'),
  ('user.manage', 'Manage company memberships');

grant select, update on public.profiles to authenticated;
grant select, update on public.companies to authenticated;
grant select on public.permissions to authenticated;
grant select, insert, update, delete on public.roles, public.role_permissions, public.company_memberships to authenticated;
grant select, insert, update, delete on public.branches, public.warehouses, public.departments, public.projects to authenticated;
grant select, insert, update, delete on public.company_settings, public.company_feature_flags to authenticated;
grant select on public.audit_logs to authenticated;

commit;
