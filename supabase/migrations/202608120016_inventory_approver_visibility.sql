begin;

insert into public.role_permissions(company_id, role_id, permission_id, created_by)
select role.company_id, role.id, permission.id, role.created_by
from public.roles role
join public.permissions permission on permission.code = 'inventory.read'
where role.code = 'approver'
on conflict(company_id, role_id, permission_id) do nothing;

commit;
