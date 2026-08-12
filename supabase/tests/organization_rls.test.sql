begin;
select plan(8);

insert into auth.users(id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values
('10000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000000','authenticated','authenticated','a@test.invalid','',now(),'{}','{}',now(),now()),
('10000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000000','authenticated','authenticated','b@test.invalid','',now(),'{}','{}',now(),now());

insert into public.companies(id,code,name) values
('20000000-0000-0000-0000-000000000001','COMPA','Company A'),
('20000000-0000-0000-0000-000000000002','COMPB','Company B');
insert into public.roles(id,company_id,code,name) values
('30000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001','viewer','Viewer'),
('30000000-0000-0000-0000-000000000002','20000000-0000-0000-0000-000000000002','viewer','Viewer');
insert into public.company_memberships(company_id,user_id,role_id) values
('20000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000001'),
('20000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000002','30000000-0000-0000-0000-000000000002');
insert into public.branches(id,company_id,code,name) values
('40000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001','A','Branch A'),
('40000000-0000-0000-0000-000000000002','20000000-0000-0000-0000-000000000002','B','Branch B');

set local role authenticated;
set local "request.jwt.claims" = '{"sub":"10000000-0000-0000-0000-000000000001","role":"authenticated"}';

select is((select count(*)::integer from public.companies), 1, 'user A reads only its company');
select is((select count(*)::integer from public.branches), 1, 'user A reads only company A branches');
select ok(public.current_user_has_company_access('20000000-0000-0000-0000-000000000001'), 'user A has access to company A');
select isnt(public.current_user_has_company_access('20000000-0000-0000-0000-000000000002'), true, 'user A has no access to company B');
select throws_ok($$insert into public.branches(company_id,code,name) values('20000000-0000-0000-0000-000000000002','X','Cross tenant')$$, 'new row violates row-level security policy for table "branches"', 'cross-company insert blocked');
select lives_ok($$update public.branches set name='Hijacked' where id='40000000-0000-0000-0000-000000000002'$$, 'cross-company update affects no visible row');
select is((select count(*)::integer from public.audit_logs), 0, 'audit log does not leak cross-company data');
select is((select public.get_my_permissions('20000000-0000-0000-0000-000000000002')), '{}'::text[], 'RPC does not leak company B permissions');

select * from finish();
rollback;
