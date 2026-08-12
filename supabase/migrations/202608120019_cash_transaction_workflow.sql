begin;

insert into public.permissions(code,description) values
('cash.read','Read cash and bank transactions'),('cash.create','Create and edit cash transaction drafts'),
('cash.submit','Submit cash transactions'),('cash.approve','Approve cash transactions'),
('cash.post','Post cash transactions'),('cash.reverse','Reverse posted cash transactions')
on conflict(code) do update set description=excluded.description;

insert into public.role_permissions(company_id,role_id,permission_id,created_by)
select role.company_id,role.id,permission.id,role.created_by from public.roles role join public.permissions permission on
 role.code='administrator'
 or(role.code='operator' and permission.code in('cash.read','cash.create','cash.submit'))
 or(role.code='approver' and permission.code in('cash.read','cash.approve','cash.post','cash.reverse'))
 or(role.code='accountant' and permission.code in('cash.read','cash.create','cash.submit','cash.post','cash.reverse'))
 or(role.code='viewer' and permission.code='cash.read')
where permission.code like 'cash.%'
on conflict(company_id,role_id,permission_id) do nothing;

create table public.cash_transactions(
 id uuid primary key default gen_random_uuid(),company_id uuid not null references public.companies(id) on delete restrict,
 branch_id uuid not null references public.branches(id) on delete restrict,document_number text not null,transaction_date date not null,
 transaction_type text not null check(transaction_type in('cash_in','cash_out','bank_transfer')),
 bank_account_id uuid not null,destination_bank_account_id uuid,offset_account_id uuid,
 amount numeric(24,4) not null check(amount>0),reference text,description text not null check(length(trim(description))>=3),
 status text not null default 'draft' check(status in('draft','pending_approval','approved','rejected','posted','reversed')),
 journal_entry_id uuid references public.journal_entries(id) on delete restrict,reversal_journal_id uuid references public.journal_entries(id) on delete restrict,
 submitted_by uuid references auth.users(id),submitted_at timestamptz,approved_by uuid references auth.users(id),approved_at timestamptz,
 rejected_by uuid references auth.users(id),rejected_at timestamptz,rejection_reason text,posted_by uuid references auth.users(id),posted_at timestamptz,
 reversed_by uuid references auth.users(id),reversed_at timestamptz,reversal_reason text,
 created_at timestamptz not null default now(),created_by uuid not null references auth.users(id),updated_at timestamptz,updated_by uuid references auth.users(id),version integer not null default 1 check(version>0),
 unique(company_id,id),unique(company_id,document_number),
 foreign key(company_id,bank_account_id) references public.bank_accounts(company_id,id) on delete restrict,
 foreign key(company_id,destination_bank_account_id) references public.bank_accounts(company_id,id) on delete restrict,
 foreign key(company_id,offset_account_id) references public.chart_of_accounts(company_id,id) on delete restrict,
 check((transaction_type='bank_transfer' and destination_bank_account_id is not null and offset_account_id is null and destination_bank_account_id<>bank_account_id) or(transaction_type in('cash_in','cash_out') and destination_bank_account_id is null and offset_account_id is not null))
);
create index cash_transactions_company_status_date_idx on public.cash_transactions(company_id,status,transaction_date desc);
create trigger cash_transactions_updated before update on public.cash_transactions for each row execute function public.set_updated_metadata();
create trigger cash_transactions_audit after insert or update or delete on public.cash_transactions for each row execute function public.audit_row_change();
alter table public.cash_transactions enable row level security;
create policy cash_transactions_read on public.cash_transactions for select to authenticated using(public.current_user_has_permission(company_id,'cash.read'));
grant select on public.cash_transactions to authenticated;

create or replace function public.next_cash_transaction_number(p_company_id uuid,p_document_date date,p_branch_id uuid,p_type text)
returns text language plpgsql volatile security definer set search_path='' as $$
declare v_sequence public.document_sequences%rowtype;v_period text;v_value bigint;v_number text;v_width integer;v_code text:=case p_type when 'cash_in' then 'CI' when 'cash_out' then 'CO' else 'BT' end;
begin
 select * into v_sequence from public.document_sequences where company_id=p_company_id and document_type=v_code and branch_scope=coalesce(p_branch_id,'00000000-0000-0000-0000-000000000000'::uuid) for update;
 if not found then insert into public.document_sequences(company_id,branch_id,document_type,pattern,reset_frequency,created_by) values(p_company_id,p_branch_id,v_code,v_code||'-{YYYY}-{MM}-{####}','monthly',auth.uid()) returning * into v_sequence;end if;
 v_period:=to_char(p_document_date,'YYYY-MM');if v_sequence.current_period is distinct from v_period then v_value:=1;else v_value:=v_sequence.next_value;end if;
 update public.document_sequences set current_period=v_period,next_value=v_value+1 where id=v_sequence.id;
 v_number:=replace(replace(v_sequence.pattern,'{YYYY}',to_char(p_document_date,'YYYY')),'{MM}',to_char(p_document_date,'MM'));v_width:=coalesce(length((regexp_match(v_number,'\{(#+)\}'))[1]),0);
 if v_width=0 then raise exception using message='Pola nomor transaksi kas tidak valid.';end if;return regexp_replace(v_number,'\{#+\}',lpad(v_value::text,v_width,'0'));
end;$$;
revoke all on function public.next_cash_transaction_number(uuid,date,uuid,text) from public,anon,authenticated;

create or replace function public.save_cash_transaction(p_company_id uuid,p_transaction_id uuid,p_payload jsonb,p_version integer default null)
returns uuid language plpgsql volatile security definer set search_path='' as $$
declare v_id uuid;v_current public.cash_transactions%rowtype;v_branch uuid:=(p_payload->>'branch_id')::uuid;v_bank uuid:=(p_payload->>'bank_account_id')::uuid;
 v_destination uuid:=nullif(p_payload->>'destination_bank_account_id','')::uuid;v_offset uuid:=nullif(p_payload->>'offset_account_id','')::uuid;
 v_type text:=p_payload->>'transaction_type';v_date date:=(p_payload->>'transaction_date')::date;v_amount numeric:=(p_payload->>'amount')::numeric;
 v_description text:=trim(p_payload->>'description');v_reference text:=nullif(trim(p_payload->>'reference'),'');
begin
 if not public.current_user_has_permission(p_company_id,'cash.create') then raise exception using errcode='42501',message='Tidak memiliki izin membuat transaksi kas.';end if;
 if v_type not in('cash_in','cash_out','bank_transfer') or v_amount<=0 or length(v_description)<3 then raise exception using errcode='22023',message='Data transaksi kas tidak valid.';end if;
 if not exists(select 1 from public.branches where company_id=p_company_id and id=v_branch and is_active) or not exists(select 1 from public.bank_accounts where company_id=p_company_id and id=v_bank and is_active) then raise exception using message='Cabang atau akun kas/bank tidak aktif.';end if;
 if v_type='bank_transfer' then
  if v_destination is null or v_destination=v_bank or not exists(select 1 from public.bank_accounts where company_id=p_company_id and id=v_destination and is_active) then raise exception using errcode='22023',message='Tujuan transfer tidak valid.';end if;v_offset:=null;
 else
  v_destination:=null;if v_offset is null or not exists(select 1 from public.chart_of_accounts where company_id=p_company_id and id=v_offset and is_active and allow_manual_entry) then raise exception using message='Akun lawan tidak valid.';end if;
 end if;
 if p_transaction_id is null then
  insert into public.cash_transactions(company_id,branch_id,document_number,transaction_date,transaction_type,bank_account_id,destination_bank_account_id,offset_account_id,amount,reference,description,created_by)
  values(p_company_id,v_branch,'DRAFT-CASH-'||substr(gen_random_uuid()::text,1,8),v_date,v_type,v_bank,v_destination,v_offset,v_amount,v_reference,v_description,auth.uid()) returning id into v_id;
 else
  select * into v_current from public.cash_transactions where company_id=p_company_id and id=p_transaction_id for update;
  if not found or v_current.status not in('draft','rejected') then raise exception using message='Draft transaksi kas tidak ditemukan.';end if;if v_current.version<>p_version then raise exception using errcode='40001',message='Transaksi telah diubah pengguna lain.';end if;
  update public.cash_transactions set branch_id=v_branch,transaction_date=v_date,transaction_type=v_type,bank_account_id=v_bank,destination_bank_account_id=v_destination,offset_account_id=v_offset,amount=v_amount,reference=v_reference,description=v_description,status='draft',rejection_reason=null,updated_by=auth.uid() where id=p_transaction_id;v_id:=p_transaction_id;
 end if;return v_id;
end;$$;

create or replace function public.delete_cash_transaction_draft(p_company_id uuid,p_transaction_id uuid,p_version integer)
returns void language plpgsql volatile security definer set search_path='' as $$ begin
 if not public.current_user_has_permission(p_company_id,'cash.create') then raise exception using errcode='42501',message='Tidak memiliki izin menghapus draft.';end if;
 delete from public.cash_transactions where company_id=p_company_id and id=p_transaction_id and version=p_version and status in('draft','rejected');if not found then raise exception using message='Draft berubah atau tidak dapat dihapus.';end if;
end;$$;

create or replace function public.submit_cash_transaction(p_company_id uuid,p_transaction_id uuid)
returns uuid language plpgsql volatile security definer set search_path='' as $$
declare v_doc public.cash_transactions%rowtype;v_request uuid;v_number text;
begin
 if not public.current_user_has_permission(p_company_id,'cash.submit') then raise exception using errcode='42501',message='Tidak memiliki izin submit transaksi kas.';end if;
 select * into v_doc from public.cash_transactions where company_id=p_company_id and id=p_transaction_id and status in('draft','rejected') for update;if not found then raise exception using message='Draft transaksi kas tidak ditemukan.';end if;
 v_number:=case when v_doc.document_number like 'DRAFT-%' then public.next_cash_transaction_number(p_company_id,v_doc.transaction_date,v_doc.branch_id,v_doc.transaction_type) else v_doc.document_number end;
 insert into public.approval_requests(company_id,document_type,document_id,document_number,submitted_by,created_by) values(p_company_id,'cash_transaction',p_transaction_id,v_number,auth.uid(),auth.uid())
 on conflict(company_id,document_type,document_id) do update set document_number=excluded.document_number,status='pending',submitted_by=auth.uid(),submitted_at=now(),completed_at=null returning id into v_request;
 insert into public.approval_actions(company_id,request_id,step,action,actor_user_id) values(p_company_id,v_request,0,'submit',auth.uid());
 update public.cash_transactions set document_number=v_number,status='pending_approval',submitted_by=auth.uid(),submitted_at=now(),updated_by=auth.uid() where id=p_transaction_id;return v_request;
end;$$;

create or replace function public.decide_cash_transaction(p_company_id uuid,p_transaction_id uuid,p_action text,p_comment text default null)
returns void language plpgsql volatile security definer set search_path='' as $$
declare v_doc public.cash_transactions%rowtype;v_request uuid;v_allow boolean:=false;
begin
 if p_action not in('approve','reject') or not public.current_user_has_permission(p_company_id,'cash.approve') then raise exception using errcode='42501',message='Tidak memiliki izin persetujuan transaksi kas.';end if;
 select * into v_doc from public.cash_transactions where company_id=p_company_id and id=p_transaction_id and status='pending_approval' for update;if not found then raise exception using message='Transaksi menunggu persetujuan tidak ditemukan.';end if;
 select allow_self_approval into v_allow from public.company_settings where company_id=p_company_id;if not coalesce(v_allow,false) and v_doc.submitted_by=auth.uid() then raise exception using errcode='42501',message='Pembuat transaksi tidak boleh menyetujui sendiri.';end if;
 if p_action='reject' and length(trim(coalesce(p_comment,'')))<5 then raise exception using errcode='22023',message='Alasan penolakan minimal lima karakter.';end if;
 select id into v_request from public.approval_requests where company_id=p_company_id and document_type='cash_transaction' and document_id=p_transaction_id and status='pending' for update;if v_request is null then raise exception using message='Permintaan persetujuan tidak ditemukan.';end if;
 update public.approval_requests set status=case p_action when 'approve' then 'approved' else 'rejected' end,completed_at=now() where id=v_request;
 insert into public.approval_actions(company_id,request_id,step,action,actor_user_id,comment) values(p_company_id,v_request,1,p_action,auth.uid(),nullif(trim(p_comment),''));
 if p_action='approve' then update public.cash_transactions set status='approved',approved_by=auth.uid(),approved_at=now(),updated_by=auth.uid() where id=p_transaction_id;
 else update public.cash_transactions set status='rejected',rejected_by=auth.uid(),rejected_at=now(),rejection_reason=trim(p_comment),updated_by=auth.uid() where id=p_transaction_id;end if;
end;$$;

create or replace function public.post_cash_transaction(p_company_id uuid,p_transaction_id uuid,p_idempotency_key text)
returns uuid language plpgsql volatile security definer set search_path='' as $$
declare v_doc public.cash_transactions%rowtype;v_source uuid;v_destination uuid;v_journal uuid;v_debit uuid;v_credit uuid;
begin
 if not public.current_user_has_permission(p_company_id,'cash.post') then raise exception using errcode='42501',message='Tidak memiliki izin posting transaksi kas.';end if;
 select * into v_doc from public.cash_transactions where company_id=p_company_id and id=p_transaction_id for update;if not found then raise exception using message='Transaksi kas tidak ditemukan.';end if;if v_doc.status='posted' then return v_doc.journal_entry_id;end if;if v_doc.status<>'approved' then raise exception using message='Hanya transaksi approved yang dapat diposting.';end if;
 if not exists(select 1 from public.accounting_periods where company_id=p_company_id and v_doc.transaction_date between starts_on and ends_on and status='open') then raise exception using message='Periode akuntansi tidak terbuka.';end if;
 select gl_account_id into v_source from public.bank_accounts where company_id=p_company_id and id=v_doc.bank_account_id and is_active;if v_source is null then raise exception using message='Akun sumber tidak valid.';end if;
 if v_doc.transaction_type='cash_in' then v_debit:=v_source;v_credit:=v_doc.offset_account_id;
 elsif v_doc.transaction_type='cash_out' then v_debit:=v_doc.offset_account_id;v_credit:=v_source;
 else select gl_account_id into v_destination from public.bank_accounts where company_id=p_company_id and id=v_doc.destination_bank_account_id and is_active;if v_destination is null then raise exception using message='Akun tujuan tidak valid.';end if;v_debit:=v_destination;v_credit:=v_source;end if;
 insert into public.journal_entries(company_id,branch_id,journal_number,document_date,journal_date,posting_date,description,status,source_type,source_id,total_debit,total_credit,idempotency_key,posted_by,posted_at,created_by)
 values(p_company_id,v_doc.branch_id,v_doc.document_number||'/J',v_doc.transaction_date,v_doc.transaction_date,v_doc.transaction_date,v_doc.description,'draft','cash_transaction',p_transaction_id,v_doc.amount,v_doc.amount,p_idempotency_key,auth.uid(),now(),auth.uid()) returning id into v_journal;
 insert into public.journal_lines(company_id,journal_entry_id,account_id,line_number,description,debit,credit,base_debit,base_credit,branch_id,created_by) values
 (p_company_id,v_journal,v_debit,1,v_doc.description,v_doc.amount,0,v_doc.amount,0,v_doc.branch_id,auth.uid()),(p_company_id,v_journal,v_credit,2,v_doc.description,0,v_doc.amount,0,v_doc.amount,v_doc.branch_id,auth.uid());
 update public.journal_entries set status='posted' where id=v_journal;update public.cash_transactions set status='posted',journal_entry_id=v_journal,posted_by=auth.uid(),posted_at=now(),updated_by=auth.uid() where id=p_transaction_id;return v_journal;
exception when unique_violation then select id into v_journal from public.journal_entries where company_id=p_company_id and(idempotency_key=p_idempotency_key or(source_type='cash_transaction' and source_id=p_transaction_id));if v_journal is null then raise;end if;return v_journal;
end;$$;

create or replace function public.reverse_cash_transaction(p_company_id uuid,p_transaction_id uuid,p_reversal_date date,p_reason text,p_idempotency_key text)
returns uuid language plpgsql volatile security definer set search_path='' as $$
declare v_doc public.cash_transactions%rowtype;v_reversal uuid;
begin
 if not public.current_user_has_permission(p_company_id,'cash.reverse') or not public.current_user_has_permission(p_company_id,'journal.reverse') then raise exception using errcode='42501',message='Tidak memiliki izin reversal transaksi kas.';end if;
 select * into v_doc from public.cash_transactions where company_id=p_company_id and id=p_transaction_id and status='posted' for update;if not found then raise exception using message='Transaksi kas posted tidak ditemukan.';end if;
 v_reversal:=public.reverse_journal_entry_core(p_company_id,v_doc.journal_entry_id,p_reversal_date,p_reason,p_idempotency_key);
 update public.cash_transactions set status='reversed',reversal_journal_id=v_reversal,reversed_by=auth.uid(),reversed_at=now(),reversal_reason=trim(p_reason),updated_by=auth.uid() where id=p_transaction_id;return v_reversal;
end;$$;

revoke all on function public.save_cash_transaction(uuid,uuid,jsonb,integer) from public,anon;
revoke all on function public.delete_cash_transaction_draft(uuid,uuid,integer) from public,anon;
revoke all on function public.submit_cash_transaction(uuid,uuid) from public,anon;
revoke all on function public.decide_cash_transaction(uuid,uuid,text,text) from public,anon;
revoke all on function public.post_cash_transaction(uuid,uuid,text) from public,anon;
revoke all on function public.reverse_cash_transaction(uuid,uuid,date,text,text) from public,anon;
grant execute on function public.save_cash_transaction(uuid,uuid,jsonb,integer) to authenticated;
grant execute on function public.delete_cash_transaction_draft(uuid,uuid,integer) to authenticated;
grant execute on function public.submit_cash_transaction(uuid,uuid) to authenticated;
grant execute on function public.decide_cash_transaction(uuid,uuid,text,text) to authenticated;
grant execute on function public.post_cash_transaction(uuid,uuid,text) to authenticated;
grant execute on function public.reverse_cash_transaction(uuid,uuid,date,text,text) to authenticated;

commit;
