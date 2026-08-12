begin;

-- Approvers need the linked GL account to review stock-count journal impact.
insert into public.role_permissions(company_id,role_id,permission_id,created_by)
select role.company_id,role.id,permission.id,role.created_by from public.roles role join public.permissions permission on permission.code='coa.read'
where role.code='approver' on conflict(company_id,role_id,permission_id) do nothing;

create table public.notifications(
 id uuid primary key default gen_random_uuid(),company_id uuid not null references public.companies(id) on delete cascade,
 recipient_user_id uuid not null references auth.users(id) on delete cascade,notification_type text not null,
 title text not null,message text not null,entity_type text,entity_id uuid,read_at timestamptz,created_at timestamptz not null default now(),
 check(length(trim(title))>0),check(length(trim(message))>0)
);
create index notifications_recipient_idx on public.notifications(recipient_user_id,company_id,read_at,created_at desc);
alter table public.notifications enable row level security;
create policy notifications_read_own on public.notifications for select to authenticated using(recipient_user_id=auth.uid() and public.current_user_has_company_access(company_id));
create policy notifications_update_own on public.notifications for update to authenticated using(recipient_user_id=auth.uid() and public.current_user_has_company_access(company_id)) with check(recipient_user_id=auth.uid() and public.current_user_has_company_access(company_id));
grant select,update on public.notifications to authenticated;

create or replace function public.notify_permission_users(p_company_id uuid,p_permission text,p_exclude_user uuid,p_type text,p_title text,p_message text,p_entity_type text,p_entity_id uuid)
returns void language sql volatile security definer set search_path='' as $$
 insert into public.notifications(company_id,recipient_user_id,notification_type,title,message,entity_type,entity_id)
 select p_company_id,membership.user_id,p_type,p_title,p_message,p_entity_type,p_entity_id
 from public.company_memberships membership join public.roles role on role.id=membership.role_id
 where membership.company_id=p_company_id and membership.status='active' and role.is_active
 and(p_exclude_user is null or membership.user_id<>p_exclude_user)
 and exists(select 1 from public.role_permissions rp join public.permissions permission on permission.id=rp.permission_id where rp.role_id=membership.role_id and permission.code=p_permission);
$$;
revoke all on function public.notify_permission_users(uuid,text,uuid,text,text,text,text,uuid) from public,anon,authenticated;

create or replace function public.notify_approval_event() returns trigger language plpgsql security definer set search_path='' as $$
declare v_permission text;v_title text;
begin
 if new.status='pending' and(tg_op='INSERT' or old.status is distinct from new.status) then
  v_permission:=case when new.document_type like 'sales_%' then 'sales.approve' when new.document_type like 'purchase_%' or new.document_type='goods_receipt' then 'purchase.approve' when new.document_type in('inventory_adjustment','inventory_transfer','stock_count') then 'inventory.approve' when new.document_type='cash_transaction' then 'cash.approve' end;
  if v_permission is not null then perform public.notify_permission_users(new.company_id,v_permission,new.submitted_by,'approval_requested','Persetujuan diperlukan',new.document_number||' menunggu persetujuan.',new.document_type,new.document_id);end if;
 elsif tg_op='UPDATE' and new.status in('approved','rejected') and old.status is distinct from new.status then
  v_title:=case new.status when 'approved' then 'Dokumen disetujui' else 'Dokumen ditolak' end;
  insert into public.notifications(company_id,recipient_user_id,notification_type,title,message,entity_type,entity_id) values(new.company_id,new.submitted_by,new.status,v_title,new.document_number||case new.status when 'approved' then ' telah disetujui.' else ' telah ditolak.' end,new.document_type,new.document_id);
 end if;return new;
end;$$;
create trigger approval_request_notification after insert or update of status on public.approval_requests for each row execute function public.notify_approval_event();

create or replace function public.notify_document_status() returns trigger language plpgsql security definer set search_path='' as $$
declare v_status text:=to_jsonb(new)->>'status';v_old_status text:=to_jsonb(old)->>'status';v_creator uuid:=(to_jsonb(new)->>'created_by')::uuid;v_number text:=coalesce(to_jsonb(new)->>'document_number','Dokumen');v_type text:=tg_table_name;v_title text;
begin if v_status is not distinct from v_old_status or v_status not in('posted','paid','partially_paid','reversed') or v_creator is null then return new;end if;v_title:=case v_status when 'posted' then 'Dokumen diposting' when 'paid' then 'Pembayaran lunas' when 'partially_paid' then 'Pembayaran sebagian' else 'Dokumen direversal' end;insert into public.notifications(company_id,recipient_user_id,notification_type,title,message,entity_type,entity_id) values((to_jsonb(new)->>'company_id')::uuid,v_creator,v_status,v_title,v_number||' berubah ke status '||v_status||'.',v_type,(to_jsonb(new)->>'id')::uuid);return new;end;$$;

create trigger sales_invoice_status_notification after update of status on public.sales_invoices for each row execute function public.notify_document_status();
create trigger purchase_invoice_status_notification after update of status on public.purchase_invoices for each row execute function public.notify_document_status();
create trigger customer_receipt_status_notification after update of status on public.customer_receipts for each row execute function public.notify_document_status();
create trigger supplier_payment_status_notification after update of status on public.supplier_payments for each row execute function public.notify_document_status();
create trigger inventory_adjustment_status_notification after update of status on public.inventory_adjustments for each row execute function public.notify_document_status();
create trigger inventory_operation_status_notification after update of status on public.inventory_operations for each row execute function public.notify_document_status();
create trigger cash_transaction_status_notification after update of status on public.cash_transactions for each row execute function public.notify_document_status();
create trigger operational_document_status_notification after update of status on public.operational_documents for each row execute function public.notify_document_status();

create or replace function public.notify_low_stock() returns trigger language plpgsql security definer set search_path='' as $$
declare v_product public.products%rowtype;v_warehouse text;
begin select * into v_product from public.products where id=new.product_id and company_id=new.company_id;if v_product.minimum_stock<=0 or new.quantity_on_hand>v_product.minimum_stock or(tg_op='UPDATE' and old.quantity_on_hand=new.quantity_on_hand) then return new;end if;select name into v_warehouse from public.warehouses where id=new.warehouse_id;perform public.notify_permission_users(new.company_id,'inventory.read',null,'low_stock','Stok minimum','Stok '||v_product.sku||' — '||v_product.name||' di '||coalesce(v_warehouse,'gudang')||' tersisa '||new.quantity_on_hand||'.','product',new.product_id);return new;end;$$;
create trigger product_warehouse_low_stock after insert or update of quantity_on_hand on public.product_warehouses for each row execute function public.notify_low_stock();

commit;
