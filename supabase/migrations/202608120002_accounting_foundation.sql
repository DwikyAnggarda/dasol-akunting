begin;

create table public.currencies (
  code char(3) primary key,
  name text not null,
  decimal_places smallint not null default 2 check (decimal_places between 0 and 6),
  is_active boolean not null default true
);

create table public.exchange_rates (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete restrict,
  currency_code char(3) not null references public.currencies(code) on delete restrict,
  rate_date date not null,
  rate numeric(24,10) not null check (rate > 0),
  source_reference text,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id),
  updated_at timestamptz,
  updated_by uuid references auth.users(id),
  version integer not null default 1 check (version > 0),
  unique (company_id, currency_code, rate_date)
);

create table public.fiscal_years (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete restrict,
  name text not null,
  starts_on date not null,
  ends_on date not null,
  status text not null default 'open' check (status in ('open', 'closed')),
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id),
  updated_at timestamptz,
  updated_by uuid references auth.users(id),
  version integer not null default 1 check (version > 0),
  check (starts_on <= ends_on),
  unique (company_id, starts_on, ends_on)
);

create table public.accounting_periods (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete restrict,
  fiscal_year_id uuid not null references public.fiscal_years(id) on delete restrict,
  period_number smallint not null check (period_number between 1 and 13),
  starts_on date not null,
  ends_on date not null,
  status text not null default 'open' check (status in ('open', 'locked')),
  closed_at timestamptz,
  closed_by uuid references auth.users(id),
  reopened_at timestamptz,
  reopened_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id),
  updated_at timestamptz,
  updated_by uuid references auth.users(id),
  version integer not null default 1 check (version > 0),
  check (starts_on <= ends_on),
  unique (company_id, starts_on, ends_on),
  unique (company_id, fiscal_year_id, period_number)
);

create table public.chart_of_accounts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete restrict,
  code text not null,
  name text not null,
  account_type text not null check (account_type in ('asset', 'liability', 'equity', 'revenue', 'cost_of_goods_sold', 'expense', 'other_income', 'other_expense')),
  normal_balance text not null check (normal_balance in ('debit', 'credit')),
  parent_id uuid,
  is_control_account boolean not null default false,
  allow_manual_entry boolean not null default true,
  cash_flow_category text check (cash_flow_category in ('operating', 'investing', 'financing') or cash_flow_category is null),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id),
  updated_at timestamptz,
  updated_by uuid references auth.users(id),
  version integer not null default 1 check (version > 0),
  unique (company_id, id),
  unique (company_id, code),
  foreign key (company_id, parent_id) references public.chart_of_accounts(company_id, id) on delete restrict
);

create table public.account_mappings (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete restrict,
  mapping_code text not null,
  account_id uuid not null,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id),
  updated_at timestamptz,
  updated_by uuid references auth.users(id),
  version integer not null default 1 check (version > 0),
  unique (company_id, mapping_code),
  foreign key (company_id, account_id) references public.chart_of_accounts(company_id, id) on delete restrict
);

create table public.document_sequences (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete restrict,
  branch_id uuid references public.branches(id) on delete restrict,
  branch_scope uuid generated always as (coalesce(branch_id, '00000000-0000-0000-0000-000000000000'::uuid)) stored,
  document_type text not null,
  pattern text not null,
  reset_frequency text not null default 'monthly' check (reset_frequency in ('never', 'yearly', 'monthly')),
  current_period text,
  next_value bigint not null default 1 check (next_value > 0),
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id),
  updated_at timestamptz,
  updated_by uuid references auth.users(id),
  version integer not null default 1 check (version > 0),
  unique (company_id, document_type, branch_scope)
);

create table public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete restrict,
  branch_id uuid references public.branches(id) on delete restrict,
  journal_number text not null,
  document_date date not null,
  journal_date date not null,
  posting_date date not null,
  description text not null,
  status text not null default 'draft' check (status in ('draft', 'submitted', 'pending_approval', 'approved', 'posted', 'reversed')),
  source_type text not null,
  source_id uuid,
  currency_code char(3) not null default 'IDR' references public.currencies(code),
  exchange_rate numeric(24,10) not null default 1 check (exchange_rate > 0),
  total_debit numeric(24,4) not null default 0 check (total_debit >= 0),
  total_credit numeric(24,4) not null default 0 check (total_credit >= 0),
  idempotency_key text not null,
  submitted_by uuid references auth.users(id),
  submitted_at timestamptz,
  approved_by uuid references auth.users(id),
  approved_at timestamptz,
  posted_by uuid references auth.users(id),
  posted_at timestamptz,
  reversal_of_id uuid references public.journal_entries(id) on delete restrict,
  reversed_by_id uuid references auth.users(id),
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id),
  updated_at timestamptz,
  updated_by uuid references auth.users(id),
  version integer not null default 1 check (version > 0),
  unique (company_id, id),
  unique (company_id, journal_number),
  unique (company_id, idempotency_key),
  check (status <> 'posted' or (total_debit > 0 and total_debit = total_credit))
);

create unique index journal_posted_source_uidx
on public.journal_entries(company_id, source_type, source_id)
where status = 'posted' and source_id is not null;

create table public.journal_lines (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete restrict,
  journal_entry_id uuid not null,
  account_id uuid not null,
  line_number integer not null check (line_number > 0),
  description text not null,
  debit numeric(24,4) not null default 0 check (debit >= 0),
  credit numeric(24,4) not null default 0 check (credit >= 0),
  base_debit numeric(24,4) not null default 0 check (base_debit >= 0),
  base_credit numeric(24,4) not null default 0 check (base_credit >= 0),
  contact_id uuid,
  branch_id uuid references public.branches(id) on delete restrict,
  department_id uuid references public.departments(id) on delete restrict,
  project_id uuid references public.projects(id) on delete restrict,
  tax_code_id uuid,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id),
  check ((debit > 0 and credit = 0) or (credit > 0 and debit = 0)),
  check ((base_debit > 0 and base_credit = 0) or (base_credit > 0 and base_debit = 0)),
  unique (journal_entry_id, line_number),
  foreign key (company_id, journal_entry_id) references public.journal_entries(company_id, id) on delete restrict,
  foreign key (company_id, account_id) references public.chart_of_accounts(company_id, id) on delete restrict
);

create table public.journal_reversals (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete restrict,
  original_journal_id uuid not null references public.journal_entries(id) on delete restrict,
  reversal_journal_id uuid not null references public.journal_entries(id) on delete restrict,
  reason text not null check (length(trim(reason)) >= 5),
  created_at timestamptz not null default now(),
  created_by uuid not null references auth.users(id),
  unique (company_id, original_journal_id),
  unique (company_id, reversal_journal_id)
);

create index periods_company_date_idx on public.accounting_periods(company_id, starts_on, ends_on, status);
create index accounts_company_active_idx on public.chart_of_accounts(company_id, is_active, code);
create index journal_entries_company_posting_idx on public.journal_entries(company_id, posting_date, status);
create index journal_entries_source_idx on public.journal_entries(company_id, source_type, source_id);
create index journal_lines_account_idx on public.journal_lines(company_id, account_id, journal_entry_id);

insert into public.currencies(code, name, decimal_places) values ('IDR', 'Rupiah Indonesia', 2);

create trigger exchange_rates_updated before update on public.exchange_rates for each row execute function public.set_updated_metadata();
create trigger fiscal_years_updated before update on public.fiscal_years for each row execute function public.set_updated_metadata();
create trigger periods_updated before update on public.accounting_periods for each row execute function public.set_updated_metadata();
create trigger accounts_updated before update on public.chart_of_accounts for each row execute function public.set_updated_metadata();
create trigger mappings_updated before update on public.account_mappings for each row execute function public.set_updated_metadata();
create trigger sequences_updated before update on public.document_sequences for each row execute function public.set_updated_metadata();

create or replace function public.prevent_posted_journal_mutation()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if old.status = 'posted' then
    raise exception using message = 'Jurnal posted bersifat immutable.';
  end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

create trigger journal_entries_immutable
before update or delete on public.journal_entries
for each row execute function public.prevent_posted_journal_mutation();

create or replace function public.prevent_posted_journal_line_mutation()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_journal_id uuid := coalesce(old.journal_entry_id, new.journal_entry_id);
begin
  if exists (select 1 from public.journal_entries where id = v_journal_id and status = 'posted') then
    raise exception using message = 'Baris jurnal posted bersifat immutable.';
  end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

create trigger journal_lines_immutable
before insert or update or delete on public.journal_lines
for each row execute function public.prevent_posted_journal_line_mutation();

create or replace function public.next_document_number(
  p_company_id uuid,
  p_document_type text,
  p_document_date date,
  p_branch_id uuid default null
)
returns text
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_sequence public.document_sequences%rowtype;
  v_period text;
  v_value bigint;
  v_width integer;
  v_number text;
  v_permission text;
  v_company_code text;
  v_branch_code text := '';
begin
  if auth.uid() is null then raise exception using message = 'Autentikasi diperlukan.'; end if;
  v_permission := case
    when p_document_type in ('SI', 'SO', 'SD') then 'sales.create'
    when p_document_type = 'SJV' then 'sales.post'
    when p_document_type in ('PI', 'PO', 'GR') then 'purchase.create'
    when p_document_type = 'PJV' then 'purchase.post'
    when p_document_type = 'CR' then 'sales.post'
    when p_document_type = 'SP' then 'purchase.post'
    when p_document_type = 'RV' then 'journal.reverse'
    when p_document_type = 'JV' then 'journal.post'
    else 'settings.manage'
  end;
  if not public.current_user_has_permission(p_company_id, v_permission) then
    raise exception using message = 'Tidak memiliki izin membuat nomor dokumen.';
  end if;

  select * into v_sequence
  from public.document_sequences
  where company_id = p_company_id
    and document_type = p_document_type
    and branch_scope = coalesce(p_branch_id, '00000000-0000-0000-0000-000000000000'::uuid)
  for update;
  if not found then raise exception using message = 'Urutan nomor dokumen belum dikonfigurasi.'; end if;

  v_period := case v_sequence.reset_frequency
    when 'monthly' then to_char(p_document_date, 'YYYY-MM')
    when 'yearly' then to_char(p_document_date, 'YYYY')
    else 'never'
  end;
  if v_sequence.current_period is distinct from v_period then v_value := 1; else v_value := v_sequence.next_value; end if;

  update public.document_sequences
  set current_period = v_period, next_value = v_value + 1
  where id = v_sequence.id;

  select code into v_company_code from public.companies where id = p_company_id;
  if p_branch_id is not null then select code into v_branch_code from public.branches where id = p_branch_id and company_id = p_company_id; end if;
  v_number := replace(replace(replace(replace(replace(v_sequence.pattern,
    '{TYPE}', p_document_type), '{COMPANY}', v_company_code), '{BRANCH}', coalesce(v_branch_code, '')),
    '{YYYY}', to_char(p_document_date, 'YYYY')), '{MM}', to_char(p_document_date, 'MM'));
  v_width := coalesce(length((regexp_match(v_number, '\{(#+)\}'))[1]), 0);
  if v_width = 0 then raise exception using message = 'Pola nomor dokumen tidak memiliki token urutan.'; end if;
  return regexp_replace(v_number, '\{#+\}', lpad(v_value::text, v_width, '0'));
end;
$$;

create or replace function public.post_manual_journal(
  p_company_id uuid,
  p_posting_date date,
  p_description text,
  p_lines jsonb,
  p_idempotency_key text,
  p_branch_id uuid default null
)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_entry_id uuid;
  v_number text;
  v_count integer;
  v_valid_accounts integer;
  v_debit numeric(24,4);
  v_credit numeric(24,4);
begin
  if auth.uid() is null then raise exception using message = 'Autentikasi diperlukan.'; end if;
  if not public.current_user_has_permission(p_company_id, 'journal.post') then raise exception using message = 'Tidak memiliki izin posting jurnal.'; end if;
  if length(trim(p_description)) < 3 then raise exception using message = 'Keterangan jurnal wajib diisi.'; end if;
  if length(trim(p_idempotency_key)) < 8 then raise exception using message = 'Idempotency key tidak valid.'; end if;

  select id into v_entry_id from public.journal_entries where company_id = p_company_id and idempotency_key = p_idempotency_key;
  if found then return v_entry_id; end if;
  if not exists (select 1 from public.accounting_periods where company_id = p_company_id and p_posting_date between starts_on and ends_on and status = 'open') then
    raise exception using message = 'Periode akuntansi tidak terbuka.';
  end if;

  select count(*), coalesce(sum(line.debit), 0), coalesce(sum(line.credit), 0)
  into v_count, v_debit, v_credit
  from jsonb_to_recordset(p_lines) as line(account_id uuid, description text, debit numeric, credit numeric)
  where line.debit >= 0 and line.credit >= 0
    and ((line.debit > 0 and line.credit = 0) or (line.credit > 0 and line.debit = 0));
  if v_count < 2 or v_debit <= 0 or v_debit <> v_credit then raise exception using message = 'Jurnal harus memiliki minimal dua baris dan seimbang.'; end if;

  select count(*) into v_valid_accounts
  from jsonb_to_recordset(p_lines) as line(account_id uuid, description text, debit numeric, credit numeric)
  join public.chart_of_accounts account on account.id = line.account_id and account.company_id = p_company_id
  where account.is_active and account.allow_manual_entry and not account.is_control_account;
  if v_valid_accounts <> v_count then raise exception using message = 'Akun jurnal tidak valid atau merupakan control account.'; end if;

  v_number := public.next_document_number(p_company_id, 'JV', p_posting_date, p_branch_id);
  insert into public.journal_entries (
    company_id, branch_id, journal_number, document_date, journal_date, posting_date,
    description, status, source_type, currency_code, total_debit, total_credit,
    idempotency_key, posted_by, posted_at, created_by
  ) values (
    p_company_id, p_branch_id, v_number, p_posting_date, p_posting_date, p_posting_date,
    trim(p_description), 'draft', 'manual_journal', 'IDR', v_debit, v_credit,
    p_idempotency_key, auth.uid(), now(), auth.uid()
  ) returning id into v_entry_id;

  insert into public.journal_lines (
    company_id, journal_entry_id, account_id, line_number, description,
    debit, credit, base_debit, base_credit, branch_id, created_by
  )
  select p_company_id, v_entry_id, line.account_id, row_number() over (),
    coalesce(nullif(trim(line.description), ''), trim(p_description)),
    line.debit, line.credit, line.debit, line.credit, p_branch_id, auth.uid()
  from jsonb_to_recordset(p_lines) as line(account_id uuid, description text, debit numeric, credit numeric);

  update public.journal_entries set status = 'posted' where id = v_entry_id;
  insert into public.audit_logs(company_id, actor_user_id, action, entity_type, entity_id, document_number, after_data)
  values (p_company_id, auth.uid(), 'post', 'journal_entry', v_entry_id, v_number, jsonb_build_object('total_debit', v_debit::text, 'total_credit', v_credit::text));
  return v_entry_id;
exception when unique_violation then
  select id into v_entry_id from public.journal_entries where company_id = p_company_id and idempotency_key = p_idempotency_key;
  if v_entry_id is null then raise; end if;
  return v_entry_id;
end;
$$;

create or replace function public.reverse_journal_entry(
  p_company_id uuid,
  p_journal_id uuid,
  p_reversal_date date,
  p_reason text,
  p_idempotency_key text
)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_original public.journal_entries%rowtype;
  v_reversal_id uuid;
  v_number text;
begin
  if auth.uid() is null then raise exception using message = 'Autentikasi diperlukan.'; end if;
  if not public.current_user_has_permission(p_company_id, 'journal.reverse') then raise exception using message = 'Tidak memiliki izin reversal.'; end if;
  if length(trim(p_reason)) < 5 then raise exception using message = 'Alasan reversal minimal lima karakter.'; end if;
  select * into v_original from public.journal_entries where id = p_journal_id and company_id = p_company_id for update;
  if not found or v_original.status <> 'posted' then raise exception using message = 'Jurnal posted tidak ditemukan.'; end if;
  if exists (select 1 from public.journal_reversals where company_id = p_company_id and original_journal_id = p_journal_id) then raise exception using message = 'Jurnal sudah pernah direversal.'; end if;
  if not exists (select 1 from public.accounting_periods where company_id = p_company_id and p_reversal_date between starts_on and ends_on and status = 'open') then raise exception using message = 'Periode reversal tidak terbuka.'; end if;

  select id into v_reversal_id from public.journal_entries where company_id = p_company_id and idempotency_key = p_idempotency_key;
  if found then return v_reversal_id; end if;
  v_number := public.next_document_number(p_company_id, 'RV', p_reversal_date, v_original.branch_id);
  insert into public.journal_entries (
    company_id, branch_id, journal_number, document_date, journal_date, posting_date,
    description, status, source_type, source_id, currency_code, exchange_rate,
    total_debit, total_credit, idempotency_key, posted_by, posted_at,
    reversal_of_id, reversed_by_id, created_by
  ) values (
    p_company_id, v_original.branch_id, v_number, p_reversal_date, p_reversal_date, p_reversal_date,
    'Reversal ' || v_original.journal_number || ': ' || trim(p_reason), 'draft', 'journal_reversal', p_journal_id,
    v_original.currency_code, v_original.exchange_rate, v_original.total_credit, v_original.total_debit,
    p_idempotency_key, auth.uid(), now(), p_journal_id, auth.uid(), auth.uid()
  ) returning id into v_reversal_id;

  insert into public.journal_lines (
    company_id, journal_entry_id, account_id, line_number, description,
    debit, credit, base_debit, base_credit, contact_id, branch_id, department_id, project_id, tax_code_id, created_by
  )
  select company_id, v_reversal_id, account_id, line_number, 'Reversal: ' || description,
    credit, debit, base_credit, base_debit, contact_id, branch_id, department_id, project_id, tax_code_id, auth.uid()
  from public.journal_lines where journal_entry_id = p_journal_id order by line_number;
  update public.journal_entries set status = 'posted' where id = v_reversal_id;
  insert into public.journal_reversals(company_id, original_journal_id, reversal_journal_id, reason, created_by)
  values (p_company_id, p_journal_id, v_reversal_id, trim(p_reason), auth.uid());
  insert into public.audit_logs(company_id, actor_user_id, action, entity_type, entity_id, document_number, reason)
  values (p_company_id, auth.uid(), 'reverse', 'journal_entry', p_journal_id, v_original.journal_number, trim(p_reason));
  return v_reversal_id;
end;
$$;

create or replace function public.close_accounting_period(p_company_id uuid, p_period_id uuid)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
begin
  if not public.current_user_has_permission(p_company_id, 'period.close') then raise exception using message = 'Tidak memiliki izin menutup periode.'; end if;
  update public.accounting_periods set status = 'locked', closed_at = now(), closed_by = auth.uid()
  where id = p_period_id and company_id = p_company_id and status = 'open';
  if not found then raise exception using message = 'Periode terbuka tidak ditemukan.'; end if;
  insert into public.audit_logs(company_id, actor_user_id, action, entity_type, entity_id) values (p_company_id, auth.uid(), 'close_period', 'accounting_period', p_period_id);
end;
$$;

create or replace function public.reopen_accounting_period(p_company_id uuid, p_period_id uuid, p_reason text)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
begin
  if not public.current_user_has_permission(p_company_id, 'period.reopen') then raise exception using message = 'Tidak memiliki izin membuka periode.'; end if;
  if length(trim(p_reason)) < 5 then raise exception using message = 'Alasan pembukaan periode wajib diisi.'; end if;
  update public.accounting_periods set status = 'open', reopened_at = now(), reopened_by = auth.uid()
  where id = p_period_id and company_id = p_company_id and status = 'locked';
  if not found then raise exception using message = 'Periode terkunci tidak ditemukan.'; end if;
  insert into public.audit_logs(company_id, actor_user_id, action, entity_type, entity_id, reason) values (p_company_id, auth.uid(), 'reopen_period', 'accounting_period', p_period_id, trim(p_reason));
end;
$$;

create or replace function public.verify_general_ledger_balance(p_company_id uuid, p_from date, p_to date)
returns table(total_debit numeric, total_credit numeric, balanced boolean)
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(sum(entry.total_debit), 0), coalesce(sum(entry.total_credit), 0),
    coalesce(sum(entry.total_debit), 0) = coalesce(sum(entry.total_credit), 0)
  from public.journal_entries entry
  where entry.company_id = p_company_id and entry.status = 'posted' and entry.posting_date between p_from and p_to
    and public.current_user_has_permission(p_company_id, 'report.financial.read');
$$;

alter table public.currencies enable row level security;
alter table public.exchange_rates enable row level security;
alter table public.fiscal_years enable row level security;
alter table public.accounting_periods enable row level security;
alter table public.chart_of_accounts enable row level security;
alter table public.account_mappings enable row level security;
alter table public.document_sequences enable row level security;
alter table public.journal_entries enable row level security;
alter table public.journal_lines enable row level security;
alter table public.journal_reversals enable row level security;

create policy currencies_read on public.currencies for select to authenticated using (true);
create policy exchange_rates_read on public.exchange_rates for select to authenticated using (public.current_user_has_company_access(company_id));
create policy exchange_rates_write on public.exchange_rates for all to authenticated using (public.current_user_has_permission(company_id, 'settings.manage')) with check (public.current_user_has_permission(company_id, 'settings.manage'));
create policy fiscal_years_read on public.fiscal_years for select to authenticated using (public.current_user_has_company_access(company_id));
create policy fiscal_years_write on public.fiscal_years for all to authenticated using (public.current_user_has_permission(company_id, 'settings.manage')) with check (public.current_user_has_permission(company_id, 'settings.manage'));
create policy periods_read on public.accounting_periods for select to authenticated using (public.current_user_has_company_access(company_id));
create policy accounts_read on public.chart_of_accounts for select to authenticated using (public.current_user_has_permission(company_id, 'coa.read'));
create policy accounts_write on public.chart_of_accounts for all to authenticated using (public.current_user_has_permission(company_id, 'coa.write')) with check (public.current_user_has_permission(company_id, 'coa.write'));
create policy mappings_read on public.account_mappings for select to authenticated using (public.current_user_has_company_access(company_id));
create policy mappings_write on public.account_mappings for all to authenticated using (public.current_user_has_permission(company_id, 'settings.manage')) with check (public.current_user_has_permission(company_id, 'settings.manage'));
create policy sequences_read on public.document_sequences for select to authenticated using (public.current_user_has_company_access(company_id));
create policy journals_read on public.journal_entries for select to authenticated using (public.current_user_has_permission(company_id, 'journal.read'));
create policy journal_lines_read on public.journal_lines for select to authenticated using (public.current_user_has_permission(company_id, 'journal.read'));
create policy reversals_read on public.journal_reversals for select to authenticated using (public.current_user_has_permission(company_id, 'journal.read'));

revoke all on function public.next_document_number(uuid, text, date, uuid) from public, anon;
revoke all on function public.post_manual_journal(uuid, date, text, jsonb, text, uuid) from public, anon;
revoke all on function public.reverse_journal_entry(uuid, uuid, date, text, text) from public, anon;
revoke all on function public.close_accounting_period(uuid, uuid) from public, anon;
revoke all on function public.reopen_accounting_period(uuid, uuid, text) from public, anon;
revoke all on function public.verify_general_ledger_balance(uuid, date, date) from public, anon;
grant execute on function public.next_document_number(uuid, text, date, uuid) to authenticated;
grant execute on function public.post_manual_journal(uuid, date, text, jsonb, text, uuid) to authenticated;
grant execute on function public.reverse_journal_entry(uuid, uuid, date, text, text) to authenticated;
grant execute on function public.close_accounting_period(uuid, uuid) to authenticated;
grant execute on function public.reopen_accounting_period(uuid, uuid, text) to authenticated;
grant execute on function public.verify_general_ledger_balance(uuid, date, date) to authenticated;

grant select on public.currencies to authenticated;
grant select, insert, update, delete on public.exchange_rates, public.fiscal_years, public.chart_of_accounts, public.account_mappings to authenticated;
grant select on public.accounting_periods, public.document_sequences, public.journal_entries, public.journal_lines, public.journal_reversals to authenticated;

commit;
