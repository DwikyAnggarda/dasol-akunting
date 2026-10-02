begin;
select plan(1);

insert into auth.users(id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values ('10000000-0000-0000-0000-000000000010','00000000-0000-0000-0000-000000000000','authenticated','authenticated','journal-numbering@test.invalid','',now(),'{}','{}',now(),now());
insert into public.companies(id,code,name) values ('20000000-0000-0000-0000-000000000010','JTEST','Journal Test');
insert into public.roles(id,company_id,code,name) values ('30000000-0000-0000-0000-000000000010','20000000-0000-0000-0000-000000000010','accountant','Accountant');
insert into public.company_memberships(company_id,user_id,role_id) values ('20000000-0000-0000-0000-000000000010','10000000-0000-0000-0000-000000000010','30000000-0000-0000-0000-000000000010');
insert into public.role_permissions(company_id,role_id,permission_id)
select '20000000-0000-0000-0000-000000000010','30000000-0000-0000-0000-000000000010',id from public.permissions where code='journal.post';
insert into public.chart_of_accounts(company_id,code,name,account_type,normal_balance,created_by)
values
('20000000-0000-0000-0000-000000000010','1000','Cash','asset','debit','10000000-0000-0000-0000-000000000010'),
('20000000-0000-0000-0000-000000000010','3000','Equity','equity','credit','10000000-0000-0000-0000-000000000010');
insert into public.fiscal_years(id,company_id,name,starts_on,ends_on,created_by)
values ('40000000-0000-0000-0000-000000000010','20000000-0000-0000-0000-000000000010','FY 2026','2026-01-01','2026-12-31','10000000-0000-0000-0000-000000000010');
insert into public.accounting_periods(company_id,fiscal_year_id,period_number,starts_on,ends_on,created_by)
values ('20000000-0000-0000-0000-000000000010','40000000-0000-0000-0000-000000000010',1,'2026-01-01','2026-01-31','10000000-0000-0000-0000-000000000010');
insert into public.document_sequences(company_id,document_type,pattern,reset_frequency,current_period,next_value,created_by)
values ('20000000-0000-0000-0000-000000000010','JV','JV-{COMPANY}-{YYYY}-{MM}-{####}','monthly','2026-10',2,'10000000-0000-0000-0000-000000000010');
insert into public.journal_entries(company_id,journal_number,document_date,journal_date,posting_date,description,status,source_type,currency_code,idempotency_key,created_by)
values ('20000000-0000-0000-0000-000000000010','JV-JTEST-2026-01-0001','2026-01-01','2026-01-01','2026-01-01','Existing number','draft','manual_journal','IDR','existing-number','10000000-0000-0000-0000-000000000010');

set local role authenticated;
set local "request.jwt.claims" = '{"sub":"10000000-0000-0000-0000-000000000010","role":"authenticated"}';

select is(
  (select journal_number from public.journal_entries where id = public.post_manual_journal(
    '20000000-0000-0000-0000-000000000010','2026-01-02','Opening balance',
    jsonb_build_array(
      jsonb_build_object('account_id',(select id from public.chart_of_accounts where company_id='20000000-0000-0000-0000-000000000010' and code='1000'),'description','Cash','debit',100,'credit',0),
      jsonb_build_object('account_id',(select id from public.chart_of_accounts where company_id='20000000-0000-0000-0000-000000000010' and code='3000'),'description','Equity','debit',0,'credit',100)
    ),
    'manual-journal-numbering-test'
  )),
  'JV-JTEST-2026-01-0002',
  'manual journal skips an existing number when posting into an earlier period'
);

select * from finish();
rollback;
