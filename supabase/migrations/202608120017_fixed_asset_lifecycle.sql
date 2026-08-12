begin;

insert into public.permissions(code,description) values
('fixed_asset.read','Read fixed assets and depreciation schedules'),
('fixed_asset.write','Create and edit fixed asset drafts'),
('fixed_asset.post','Activate assets and post depreciation'),
('fixed_asset.dispose','Dispose or write off fixed assets')
on conflict(code) do update set description=excluded.description;

insert into public.role_permissions(company_id,role_id,permission_id,created_by)
select role.company_id,role.id,permission.id,role.created_by
from public.roles role join public.permissions permission on
 role.code='administrator'
 or(role.code='accountant' and permission.code in('fixed_asset.read','fixed_asset.write','fixed_asset.post','fixed_asset.dispose'))
 or(role.code='viewer' and permission.code='fixed_asset.read')
where permission.code like 'fixed_asset.%'
on conflict(company_id,role_id,permission_id) do nothing;

alter table public.fixed_assets
 add column if not exists activated_at timestamptz,
 add column if not exists activated_by uuid references auth.users(id),
 add column if not exists disposed_at timestamptz,
 add column if not exists disposed_by uuid references auth.users(id),
 add column if not exists disposal_date date,
 add column if not exists disposal_proceeds numeric(24,4),
 add column if not exists disposal_reason text,
 add column if not exists disposal_journal_id uuid references public.journal_entries(id) on delete restrict;

create table public.fixed_asset_depreciation_entries(
 id uuid primary key default gen_random_uuid(),
 company_id uuid not null references public.companies(id) on delete restrict,
 asset_id uuid not null,
 period_date date not null,
 amount numeric(24,4) not null check(amount>0),
 status text not null default 'scheduled' check(status in('scheduled','posted')),
 journal_entry_id uuid references public.journal_entries(id) on delete restrict,
 posted_at timestamptz,posted_by uuid references auth.users(id),
 created_at timestamptz not null default now(),created_by uuid references auth.users(id),
 unique(company_id,asset_id,period_date),
 foreign key(company_id,asset_id) references public.fixed_assets(company_id,id) on delete restrict
);
create index fixed_asset_depreciation_due_idx on public.fixed_asset_depreciation_entries(company_id,status,period_date);

drop trigger if exists fixed_asset_categories_audit on public.fixed_asset_categories;
create trigger fixed_asset_categories_audit after insert or update or delete on public.fixed_asset_categories for each row execute function public.audit_row_change();
drop trigger if exists fixed_assets_audit on public.fixed_assets;
create trigger fixed_assets_audit after insert or update or delete on public.fixed_assets for each row execute function public.audit_row_change();

alter table public.fixed_asset_depreciation_entries enable row level security;
drop policy if exists fixed_assets_read on public.fixed_assets;
drop policy if exists fixed_asset_categories_read on public.fixed_asset_categories;
create policy fixed_assets_read on public.fixed_assets for select to authenticated using(public.current_user_has_permission(company_id,'fixed_asset.read'));
create policy fixed_asset_categories_read on public.fixed_asset_categories for select to authenticated using(public.current_user_has_permission(company_id,'fixed_asset.read') or public.current_user_has_permission(company_id,'fixed_asset.write'));
create policy fixed_asset_depreciation_read on public.fixed_asset_depreciation_entries for select to authenticated using(public.current_user_has_permission(company_id,'fixed_asset.read'));
drop policy if exists fixed_categories_write on public.fixed_asset_categories;
create policy fixed_categories_write on public.fixed_asset_categories for all to authenticated using(public.current_user_has_permission(company_id,'fixed_asset.write')) with check(public.current_user_has_permission(company_id,'fixed_asset.write'));
drop policy if exists fixed_assets_write on public.fixed_assets;
grant select on public.fixed_asset_depreciation_entries to authenticated;

create or replace function public.save_fixed_asset(p_company_id uuid,p_asset_id uuid,p_asset jsonb,p_version integer default null)
returns uuid language plpgsql volatile security definer set search_path='' as $$
declare v_id uuid;v_current public.fixed_assets%rowtype;v_category public.fixed_asset_categories%rowtype;
 v_code text:=upper(trim(p_asset->>'asset_code'));v_name text:=trim(p_asset->>'name');v_category_id uuid:=(p_asset->>'category_id')::uuid;
 v_acquisition date:=(p_asset->>'acquisition_date')::date;v_service date:=(p_asset->>'in_service_date')::date;
 v_cost numeric:=(p_asset->>'acquisition_cost')::numeric;v_residual numeric:=coalesce((p_asset->>'residual_value')::numeric,0);v_life integer:=(p_asset->>'useful_life_months')::integer;
begin
 if not public.current_user_has_permission(p_company_id,'fixed_asset.write') then raise exception using errcode='42501',message='Tidak memiliki izin mengelola aset tetap.';end if;
 select * into v_category from public.fixed_asset_categories where company_id=p_company_id and id=v_category_id;
 if not found then raise exception using errcode='23503',message='Kategori aset tidak ditemukan.';end if;
 if length(v_code)<2 or length(v_name)<2 or v_cost<=0 or v_residual<0 or v_residual>=v_cost or v_life<=0 or v_service<v_acquisition then raise exception using errcode='22023',message='Data aset tetap tidak valid.';end if;
 if p_asset_id is null then
  insert into public.fixed_assets(company_id,category_id,asset_code,name,acquisition_date,in_service_date,acquisition_cost,residual_value,useful_life_months,status,created_by)
  values(p_company_id,v_category_id,v_code,v_name,v_acquisition,v_service,v_cost,v_residual,v_life,'draft',auth.uid()) returning id into v_id;
 else
  select * into v_current from public.fixed_assets where company_id=p_company_id and id=p_asset_id for update;
  if not found or v_current.status<>'draft' then raise exception using message='Draft aset tidak ditemukan.';end if;
  if v_current.version<>p_version then raise exception using errcode='40001',message='Aset telah diubah pengguna lain.';end if;
  update public.fixed_assets set category_id=v_category_id,asset_code=v_code,name=v_name,acquisition_date=v_acquisition,in_service_date=v_service,acquisition_cost=v_cost,residual_value=v_residual,useful_life_months=v_life,updated_by=auth.uid() where id=p_asset_id;
  v_id:=p_asset_id;
 end if;return v_id;
end;$$;

create or replace function public.delete_fixed_asset_draft(p_company_id uuid,p_asset_id uuid,p_version integer)
returns void language plpgsql volatile security definer set search_path='' as $$ begin
 if not public.current_user_has_permission(p_company_id,'fixed_asset.write') then raise exception using errcode='42501',message='Tidak memiliki izin menghapus draft aset.';end if;
 delete from public.fixed_assets where company_id=p_company_id and id=p_asset_id and version=p_version and status='draft';
 if not found then raise exception using message='Draft aset berubah atau tidak dapat dihapus.';end if;
end;$$;

create or replace function public.activate_fixed_asset(p_company_id uuid,p_asset_id uuid)
returns integer language plpgsql volatile security definer set search_path='' as $$
declare v_asset public.fixed_assets%rowtype;v_monthly numeric(24,4);v_remaining numeric(24,4);v_amount numeric(24,4);v_period date;v_count integer:=0;
begin
 if not public.current_user_has_permission(p_company_id,'fixed_asset.post') then raise exception using errcode='42501',message='Tidak memiliki izin mengaktifkan aset.';end if;
 select * into v_asset from public.fixed_assets where company_id=p_company_id and id=p_asset_id and status='draft' for update;
 if not found then raise exception using message='Draft aset tidak ditemukan.';end if;
 v_remaining:=v_asset.acquisition_cost-v_asset.residual_value;v_monthly:=round(v_remaining/v_asset.useful_life_months,4);
 for index in 1..v_asset.useful_life_months loop
  v_period:=(date_trunc('month',v_asset.in_service_date)+(index||' months')::interval-interval '1 day')::date;
  v_amount:=case when index=v_asset.useful_life_months then v_remaining else least(v_monthly,v_remaining) end;
  insert into public.fixed_asset_depreciation_entries(company_id,asset_id,period_date,amount,created_by) values(p_company_id,p_asset_id,v_period,v_amount,auth.uid());
  v_remaining:=v_remaining-v_amount;v_count:=v_count+1;
 end loop;
 update public.fixed_assets set status='active',activated_at=now(),activated_by=auth.uid(),updated_by=auth.uid() where id=p_asset_id;
 return v_count;
end;$$;

create or replace function public.post_fixed_asset_depreciation(p_company_id uuid,p_asset_id uuid,p_through_date date)
returns integer language plpgsql volatile security definer set search_path='' as $$
declare v_asset public.fixed_assets%rowtype;v_category public.fixed_asset_categories%rowtype;v_entry public.fixed_asset_depreciation_entries%rowtype;v_journal uuid;v_count integer:=0;
begin
 if not public.current_user_has_permission(p_company_id,'fixed_asset.post') or not public.current_user_has_permission(p_company_id,'journal.post') then raise exception using errcode='42501',message='Tidak memiliki izin posting penyusutan.';end if;
 select * into v_asset from public.fixed_assets where company_id=p_company_id and id=p_asset_id and status='active' for update;
 if not found then raise exception using message='Aset aktif tidak ditemukan.';end if;
 select * into v_category from public.fixed_asset_categories where company_id=p_company_id and id=v_asset.category_id;
 for v_entry in select * from public.fixed_asset_depreciation_entries where company_id=p_company_id and asset_id=p_asset_id and status='scheduled' and period_date<=p_through_date order by period_date for update
 loop
  if not exists(select 1 from public.accounting_periods where company_id=p_company_id and v_entry.period_date between starts_on and ends_on and status='open') then raise exception using message='Periode penyusutan '||v_entry.period_date||' tidak terbuka.';end if;
  insert into public.journal_entries(company_id,journal_number,document_date,journal_date,posting_date,description,status,source_type,source_id,total_debit,total_credit,idempotency_key,posted_by,posted_at,created_by)
  values(p_company_id,'DEP-'||v_asset.asset_code||'-'||to_char(v_entry.period_date,'YYYYMM'),v_entry.period_date,v_entry.period_date,v_entry.period_date,'Penyusutan '||v_asset.asset_code||' - '||v_asset.name,'draft','fixed_asset_depreciation',v_entry.id,v_entry.amount,v_entry.amount,'fixed-asset-depreciation:'||v_entry.id,auth.uid(),now(),auth.uid()) returning id into v_journal;
  insert into public.journal_lines(company_id,journal_entry_id,account_id,line_number,description,debit,credit,base_debit,base_credit,created_by) values
  (p_company_id,v_journal,v_category.depreciation_expense_account_id,1,'Beban penyusutan '||v_asset.asset_code,v_entry.amount,0,v_entry.amount,0,auth.uid()),
  (p_company_id,v_journal,v_category.accumulated_depreciation_account_id,2,'Akumulasi penyusutan '||v_asset.asset_code,0,v_entry.amount,0,v_entry.amount,auth.uid());
  update public.journal_entries set status='posted' where id=v_journal;
  update public.fixed_asset_depreciation_entries set status='posted',journal_entry_id=v_journal,posted_at=now(),posted_by=auth.uid() where id=v_entry.id;
  v_count:=v_count+1;
 end loop;
 update public.fixed_assets asset set accumulated_depreciation=coalesce((select sum(amount) from public.fixed_asset_depreciation_entries where asset_id=p_asset_id and status='posted'),0),updated_by=auth.uid() where asset.id=p_asset_id;
 return v_count;
end;$$;

create or replace function public.dispose_fixed_asset(p_company_id uuid,p_asset_id uuid,p_disposal_date date,p_proceeds numeric,p_proceeds_account_id uuid,p_gain_loss_account_id uuid,p_reason text,p_idempotency_key text)
returns uuid language plpgsql volatile security definer set search_path='' as $$
declare v_asset public.fixed_assets%rowtype;v_category public.fixed_asset_categories%rowtype;v_journal uuid;v_book numeric(24,4);v_difference numeric(24,4);v_line integer:=1;
begin
 if not public.current_user_has_permission(p_company_id,'fixed_asset.dispose') or not public.current_user_has_permission(p_company_id,'journal.post') then raise exception using errcode='42501',message='Tidak memiliki izin disposal aset.';end if;
 if p_proceeds<0 or length(trim(p_reason))<5 then raise exception using errcode='22023',message='Nilai atau alasan disposal tidak valid.';end if;
 select * into v_asset from public.fixed_assets where company_id=p_company_id and id=p_asset_id and status='active' for update;
 if not found then raise exception using message='Aset aktif tidak ditemukan.';end if;
 if p_disposal_date<v_asset.in_service_date or not exists(select 1 from public.accounting_periods where company_id=p_company_id and p_disposal_date between starts_on and ends_on and status='open') then raise exception using message='Tanggal atau periode disposal tidak valid.';end if;
 if not exists(select 1 from public.chart_of_accounts where company_id=p_company_id and id=p_gain_loss_account_id and is_active) or(p_proceeds>0 and not exists(select 1 from public.chart_of_accounts where company_id=p_company_id and id=p_proceeds_account_id and is_active)) then raise exception using message='Akun disposal tidak valid.';end if;
 if exists(select 1 from public.fixed_asset_depreciation_entries where asset_id=p_asset_id and status='scheduled' and period_date<=p_disposal_date) then raise exception using message='Posting seluruh penyusutan jatuh tempo sebelum disposal.';end if;
 select * into v_category from public.fixed_asset_categories where company_id=p_company_id and id=v_asset.category_id;
 v_book:=v_asset.acquisition_cost-v_asset.accumulated_depreciation;v_difference:=v_book-p_proceeds;
 insert into public.journal_entries(company_id,journal_number,document_date,journal_date,posting_date,description,status,source_type,source_id,total_debit,total_credit,idempotency_key,posted_by,posted_at,created_by)
 values(p_company_id,'DSP-'||v_asset.asset_code||'-'||to_char(p_disposal_date,'YYYYMMDD'),p_disposal_date,p_disposal_date,p_disposal_date,'Disposal '||v_asset.asset_code||': '||trim(p_reason),'draft','fixed_asset_disposal',p_asset_id,v_asset.acquisition_cost+greatest(-v_difference,0),v_asset.acquisition_cost+greatest(-v_difference,0),p_idempotency_key,auth.uid(),now(),auth.uid()) returning id into v_journal;
 if v_asset.accumulated_depreciation>0 then insert into public.journal_lines(company_id,journal_entry_id,account_id,line_number,description,debit,credit,base_debit,base_credit,created_by) values(p_company_id,v_journal,v_category.accumulated_depreciation_account_id,v_line,'Hapus akumulasi penyusutan',v_asset.accumulated_depreciation,0,v_asset.accumulated_depreciation,0,auth.uid());v_line:=v_line+1;end if;
 if p_proceeds>0 then insert into public.journal_lines(company_id,journal_entry_id,account_id,line_number,description,debit,credit,base_debit,base_credit,created_by) values(p_company_id,v_journal,p_proceeds_account_id,v_line,'Hasil disposal',p_proceeds,0,p_proceeds,0,auth.uid());v_line:=v_line+1;end if;
 if v_difference>0 then insert into public.journal_lines(company_id,journal_entry_id,account_id,line_number,description,debit,credit,base_debit,base_credit,created_by) values(p_company_id,v_journal,p_gain_loss_account_id,v_line,'Rugi disposal',v_difference,0,v_difference,0,auth.uid());v_line:=v_line+1;
 elsif v_difference<0 then insert into public.journal_lines(company_id,journal_entry_id,account_id,line_number,description,debit,credit,base_debit,base_credit,created_by) values(p_company_id,v_journal,p_gain_loss_account_id,v_line,'Laba disposal',0,-v_difference,0,-v_difference,auth.uid());v_line:=v_line+1;end if;
 insert into public.journal_lines(company_id,journal_entry_id,account_id,line_number,description,debit,credit,base_debit,base_credit,created_by) values(p_company_id,v_journal,v_category.asset_account_id,v_line,'Hapus aset '||v_asset.asset_code,0,v_asset.acquisition_cost,0,v_asset.acquisition_cost,auth.uid());
 update public.journal_entries set status='posted' where id=v_journal;
 update public.fixed_assets set status='disposed',disposal_date=p_disposal_date,disposal_proceeds=p_proceeds,disposal_reason=trim(p_reason),disposal_journal_id=v_journal,disposed_at=now(),disposed_by=auth.uid(),updated_by=auth.uid() where id=p_asset_id;
 delete from public.fixed_asset_depreciation_entries where asset_id=p_asset_id and status='scheduled';
 return v_journal;
exception when unique_violation then select id into v_journal from public.journal_entries where company_id=p_company_id and idempotency_key=p_idempotency_key;if v_journal is null then raise;end if;return v_journal;
end;$$;

revoke all on function public.save_fixed_asset(uuid,uuid,jsonb,integer) from public,anon;
revoke all on function public.delete_fixed_asset_draft(uuid,uuid,integer) from public,anon;
revoke all on function public.activate_fixed_asset(uuid,uuid) from public,anon;
revoke all on function public.post_fixed_asset_depreciation(uuid,uuid,date) from public,anon;
revoke all on function public.dispose_fixed_asset(uuid,uuid,date,numeric,uuid,uuid,text,text) from public,anon;
grant execute on function public.save_fixed_asset(uuid,uuid,jsonb,integer) to authenticated;
grant execute on function public.delete_fixed_asset_draft(uuid,uuid,integer) to authenticated;
grant execute on function public.activate_fixed_asset(uuid,uuid) to authenticated;
grant execute on function public.post_fixed_asset_depreciation(uuid,uuid,date) to authenticated;
grant execute on function public.dispose_fixed_asset(uuid,uuid,date,numeric,uuid,uuid,text,text) to authenticated;

commit;
