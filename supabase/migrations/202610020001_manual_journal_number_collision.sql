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
  while exists (
    select 1 from public.journal_entries
    where company_id = p_company_id and journal_number = v_number
  ) loop
    v_number := public.next_document_number(p_company_id, 'JV', p_posting_date, p_branch_id);
  end loop;

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
