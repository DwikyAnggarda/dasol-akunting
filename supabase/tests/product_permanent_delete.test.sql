begin;
select plan(2);

insert into auth.users(id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values ('10000000-0000-0000-0000-000000000020','00000000-0000-0000-0000-000000000000','authenticated','authenticated','product-delete@test.invalid','',now(),'{}','{}',now(),now());
insert into public.companies(id,code,name)
values ('20000000-0000-0000-0000-000000000020','PDEL','Product Delete Test');
insert into public.roles(id,company_id,code,name)
values ('30000000-0000-0000-0000-000000000020','20000000-0000-0000-0000-000000000020','accountant','Accountant');
insert into public.company_memberships(company_id,user_id,role_id)
values ('20000000-0000-0000-0000-000000000020','10000000-0000-0000-0000-000000000020','30000000-0000-0000-0000-000000000020');
insert into public.role_permissions(company_id,role_id,permission_id)
select '20000000-0000-0000-0000-000000000020','30000000-0000-0000-0000-000000000020',id
from public.permissions where code='item.write';
insert into public.units(company_id,code,name,created_by)
values ('20000000-0000-0000-0000-000000000020','PCS','Pieces','10000000-0000-0000-0000-000000000020');
insert into public.chart_of_accounts(company_id,code,name,account_type,normal_balance,created_by)
values
('20000000-0000-0000-0000-000000000020','4000','Sales','revenue','credit','10000000-0000-0000-0000-000000000020'),
('20000000-0000-0000-0000-000000000020','6000','Purchases','expense','debit','10000000-0000-0000-0000-000000000020');
insert into public.products(company_id,sku,name,product_type,base_unit_id,sales_account_id,purchase_account_id,created_by)
select '20000000-0000-0000-0000-000000000020','UNUSED','Unused service','service',unit.id,sales.id,purchases.id,'10000000-0000-0000-0000-000000000020'
from public.units unit
join public.chart_of_accounts sales on sales.company_id=unit.company_id and sales.code='4000'
join public.chart_of_accounts purchases on purchases.company_id=unit.company_id and purchases.code='6000'
where unit.company_id='20000000-0000-0000-0000-000000000020';

set local role authenticated;
set local "request.jwt.claims" = '{"sub":"10000000-0000-0000-0000-000000000020","role":"authenticated"}';

select ok(public.delete_unused_product(
  '20000000-0000-0000-0000-000000000020',
  (select id from public.products where company_id='20000000-0000-0000-0000-000000000020' and sku='UNUSED'),
  1
), 'authorized user can permanently delete an unused product');
select is(
  (select count(*)::integer from public.products where company_id='20000000-0000-0000-0000-000000000020'),
  0,
  'product was removed from the company catalog'
);

select * from finish();
rollback;
