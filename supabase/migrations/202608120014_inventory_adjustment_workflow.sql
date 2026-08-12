begin;

insert into public.permissions(code, description) values
  ('inventory.submit', 'Submit inventory documents'),
  ('inventory.approve', 'Approve inventory documents'),
  ('inventory.post', 'Post inventory documents'),
  ('inventory.reverse', 'Reverse posted inventory documents')
on conflict(code) do update set description = excluded.description;

insert into public.role_permissions(company_id, role_id, permission_id, created_by)
select role.company_id, role.id, permission.id, role.created_by
from public.roles role
join public.permissions permission on
  role.code = 'administrator'
  or (role.code = 'operator' and permission.code in ('inventory.write', 'inventory.submit'))
  or (role.code = 'approver' and permission.code in ('inventory.approve', 'inventory.post', 'inventory.reverse', 'journal.reverse'))
  or (role.code = 'accountant' and permission.code in ('inventory.post', 'inventory.reverse'))
where permission.code in ('inventory.write', 'inventory.submit', 'inventory.approve', 'inventory.post', 'inventory.reverse', 'journal.reverse')
on conflict(company_id, role_id, permission_id) do nothing;

create table public.inventory_adjustments (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete restrict,
  branch_id uuid not null references public.branches(id) on delete restrict,
  warehouse_id uuid not null,
  offset_account_id uuid not null,
  document_number text not null,
  adjustment_date date not null,
  adjustment_type text not null check(adjustment_type in ('increase', 'decrease')),
  reason text not null check(length(trim(reason)) >= 5),
  status text not null default 'draft' check(status in ('draft', 'pending_approval', 'approved', 'rejected', 'posted', 'reversed')),
  total_cost numeric(24,4) not null default 0 check(total_cost >= 0),
  journal_entry_id uuid references public.journal_entries(id) on delete restrict,
  reversal_journal_id uuid references public.journal_entries(id) on delete restrict,
  submitted_by uuid references auth.users(id), submitted_at timestamptz,
  approved_by uuid references auth.users(id), approved_at timestamptz,
  rejected_by uuid references auth.users(id), rejected_at timestamptz, rejection_reason text,
  posted_by uuid references auth.users(id), posted_at timestamptz,
  reversed_by uuid references auth.users(id), reversed_at timestamptz, reversal_reason text,
  created_at timestamptz not null default now(), created_by uuid not null references auth.users(id),
  updated_at timestamptz, updated_by uuid references auth.users(id),
  version integer not null default 1 check(version > 0),
  unique(company_id, id), unique(company_id, document_number),
  foreign key(company_id, warehouse_id) references public.warehouses(company_id, id) on delete restrict,
  foreign key(company_id, offset_account_id) references public.chart_of_accounts(company_id, id) on delete restrict
);

create table public.inventory_adjustment_lines (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete restrict,
  adjustment_id uuid not null,
  line_number integer not null check(line_number > 0),
  product_id uuid not null,
  quantity numeric(24,6) not null check(quantity > 0),
  unit_cost numeric(24,6) not null default 0 check(unit_cost >= 0),
  total_cost numeric(24,4) not null default 0 check(total_cost >= 0),
  created_at timestamptz not null default now(), created_by uuid references auth.users(id),
  unique(adjustment_id, line_number), unique(adjustment_id, product_id),
  foreign key(company_id, adjustment_id) references public.inventory_adjustments(company_id, id) on delete cascade,
  foreign key(company_id, product_id) references public.products(company_id, id) on delete restrict
);

create index inventory_adjustments_company_status_date_idx
on public.inventory_adjustments(company_id, status, adjustment_date desc);

create trigger inventory_adjustments_updated before update on public.inventory_adjustments
for each row execute function public.set_updated_metadata();
create trigger inventory_adjustments_audit after insert or update or delete on public.inventory_adjustments
for each row execute function public.audit_row_change();

alter table public.inventory_adjustments enable row level security;
alter table public.inventory_adjustment_lines enable row level security;
create policy inventory_adjustments_read on public.inventory_adjustments for select to authenticated
using(public.current_user_has_permission(company_id, 'inventory.read'));
create policy inventory_adjustment_lines_read on public.inventory_adjustment_lines for select to authenticated
using(public.current_user_has_permission(company_id, 'inventory.read'));
grant select on public.inventory_adjustments, public.inventory_adjustment_lines to authenticated;

create or replace function public.next_inventory_adjustment_number(
  p_company_id uuid, p_document_date date, p_branch_id uuid
)
returns text language plpgsql volatile security definer set search_path = '' as $$
declare v_sequence public.document_sequences%rowtype;v_period text;v_value bigint;v_number text;v_width integer;
begin
  select * into v_sequence from public.document_sequences
  where company_id=p_company_id and document_type='IA'
    and branch_scope=coalesce(p_branch_id,'00000000-0000-0000-0000-000000000000'::uuid) for update;
  if not found then
    insert into public.document_sequences(company_id,branch_id,document_type,pattern,reset_frequency,created_by)
    values(p_company_id,p_branch_id,'IA','IA-{YYYY}-{MM}-{####}','monthly',auth.uid())
    returning * into v_sequence;
  end if;
  v_period:=to_char(p_document_date,'YYYY-MM');
  if v_sequence.current_period is distinct from v_period then v_value:=1;else v_value:=v_sequence.next_value;end if;
  update public.document_sequences set current_period=v_period,next_value=v_value+1 where id=v_sequence.id;
  v_number:=replace(replace(v_sequence.pattern,'{YYYY}',to_char(p_document_date,'YYYY')),'{MM}',to_char(p_document_date,'MM'));
  v_width:=coalesce(length((regexp_match(v_number,'\{(#+)\}'))[1]),0);
  if v_width=0 then raise exception using message='Pola nomor adjustment tidak valid.';end if;
  return regexp_replace(v_number,'\{#+\}',lpad(v_value::text,v_width,'0'));
end;$$;
revoke all on function public.next_inventory_adjustment_number(uuid,date,uuid) from public,anon,authenticated;

create or replace function public.save_inventory_adjustment(
  p_company_id uuid, p_adjustment_id uuid, p_header jsonb, p_lines jsonb, p_version integer default null
)
returns uuid language plpgsql volatile security definer set search_path = '' as $$
declare v_id uuid;v_existing public.inventory_adjustments%rowtype;v_line record;v_count integer:=0;
  v_branch uuid:=(p_header->>'branch_id')::uuid;v_warehouse uuid:=(p_header->>'warehouse_id')::uuid;
  v_offset uuid:=(p_header->>'offset_account_id')::uuid;v_date date:=(p_header->>'adjustment_date')::date;
  v_type text:=p_header->>'adjustment_type';v_reason text:=trim(p_header->>'reason');
begin
  if auth.uid() is null or not public.current_user_has_permission(p_company_id,'inventory.write') then raise exception using errcode='42501',message='Tidak memiliki izin membuat adjustment.';end if;
  if v_type not in('increase','decrease') or length(v_reason)<5 then raise exception using errcode='22023',message='Jenis atau alasan adjustment tidak valid.';end if;
  if not exists(select 1 from public.warehouses where company_id=p_company_id and id=v_warehouse and branch_id=v_branch and is_active) then raise exception using errcode='23503',message='Gudang aktif pada cabang tersebut tidak ditemukan.';end if;
  if not exists(select 1 from public.chart_of_accounts where company_id=p_company_id and id=v_offset and is_active and allow_manual_entry) then raise exception using errcode='23503',message='Akun lawan aktif yang menerima jurnal manual tidak ditemukan.';end if;
  if jsonb_typeof(p_lines)<>'array' or jsonb_array_length(p_lines)=0 or jsonb_array_length(p_lines)>200 then raise exception using errcode='22023',message='Adjustment wajib memiliki 1 sampai 200 baris.';end if;
  if p_adjustment_id is null then
    insert into public.inventory_adjustments(company_id,branch_id,warehouse_id,offset_account_id,document_number,adjustment_date,adjustment_type,reason,created_by)
    values(p_company_id,v_branch,v_warehouse,v_offset,'DRAFT-IA-'||substr(gen_random_uuid()::text,1,8),v_date,v_type,v_reason,auth.uid()) returning id into v_id;
  else
    select * into v_existing from public.inventory_adjustments where company_id=p_company_id and id=p_adjustment_id for update;
    if not found or v_existing.status not in('draft','rejected') then raise exception using message='Draft adjustment tidak ditemukan.';end if;
    if v_existing.version<>p_version then raise exception using errcode='40001',message='Adjustment telah diubah pengguna lain.';end if;
    update public.inventory_adjustments set branch_id=v_branch,warehouse_id=v_warehouse,offset_account_id=v_offset,adjustment_date=v_date,adjustment_type=v_type,reason=v_reason,status='draft',rejection_reason=null,updated_by=auth.uid() where id=p_adjustment_id;
    delete from public.inventory_adjustment_lines where adjustment_id=p_adjustment_id;
    v_id:=p_adjustment_id;
  end if;
  for v_line in select * from jsonb_to_recordset(p_lines) as x(product_id uuid,quantity numeric,unit_cost numeric)
  loop
    v_count:=v_count+1;
    if v_line.quantity<=0 or (v_type='increase' and coalesce(v_line.unit_cost,0)<=0) then raise exception using errcode='22023',message='Kuantitas dan biaya unit baris tidak valid.';end if;
    if not exists(select 1 from public.products where company_id=p_company_id and id=v_line.product_id and product_type='inventory' and is_active) then raise exception using errcode='23503',message='Produk persediaan aktif tidak ditemukan.';end if;
    insert into public.inventory_adjustment_lines(company_id,adjustment_id,line_number,product_id,quantity,unit_cost,created_by)
    values(p_company_id,v_id,v_count,v_line.product_id,v_line.quantity,coalesce(v_line.unit_cost,0),auth.uid());
  end loop;
  return v_id;
end;$$;

create or replace function public.delete_inventory_adjustment(p_company_id uuid,p_adjustment_id uuid,p_version integer)
returns void language plpgsql volatile security definer set search_path='' as $$ begin
  if not public.current_user_has_permission(p_company_id,'inventory.write') then raise exception using errcode='42501',message='Tidak memiliki izin menghapus draft.';end if;
  delete from public.inventory_adjustments where company_id=p_company_id and id=p_adjustment_id and version=p_version and status in('draft','rejected');
  if not found then raise exception using message='Draft berubah atau tidak dapat dihapus.';end if;
end;$$;

create or replace function public.submit_inventory_adjustment(p_company_id uuid,p_adjustment_id uuid)
returns uuid language plpgsql volatile security definer set search_path='' as $$
declare v_doc public.inventory_adjustments%rowtype;v_request uuid;v_number text;
begin
  if not public.current_user_has_permission(p_company_id,'inventory.submit') then raise exception using errcode='42501',message='Tidak memiliki izin submit adjustment.';end if;
  select * into v_doc from public.inventory_adjustments where company_id=p_company_id and id=p_adjustment_id and status in('draft','rejected') for update;
  if not found or not exists(select 1 from public.inventory_adjustment_lines where adjustment_id=p_adjustment_id) then raise exception using message='Draft adjustment tidak valid.';end if;
  v_number:=case when v_doc.document_number like 'DRAFT-%' then public.next_inventory_adjustment_number(p_company_id,v_doc.adjustment_date,v_doc.branch_id) else v_doc.document_number end;
  insert into public.approval_requests(company_id,document_type,document_id,document_number,submitted_by,created_by)
  values(p_company_id,'inventory_adjustment',p_adjustment_id,v_number,auth.uid(),auth.uid())
  on conflict(company_id,document_type,document_id) do update set document_number=excluded.document_number,status='pending',submitted_by=auth.uid(),submitted_at=now(),completed_at=null
  returning id into v_request;
  insert into public.approval_actions(company_id,request_id,step,action,actor_user_id) values(p_company_id,v_request,0,'submit',auth.uid());
  update public.inventory_adjustments set document_number=v_number,status='pending_approval',submitted_by=auth.uid(),submitted_at=now(),updated_by=auth.uid() where id=p_adjustment_id;
  return v_request;
end;$$;

create or replace function public.decide_inventory_adjustment(p_company_id uuid,p_adjustment_id uuid,p_action text,p_comment text default null)
returns void language plpgsql volatile security definer set search_path='' as $$
declare v_doc public.inventory_adjustments%rowtype;v_request uuid;v_allow_self boolean:=false;
begin
  if p_action not in('approve','reject') or not public.current_user_has_permission(p_company_id,'inventory.approve') then raise exception using errcode='42501',message='Tidak memiliki izin persetujuan adjustment.';end if;
  select * into v_doc from public.inventory_adjustments where company_id=p_company_id and id=p_adjustment_id and status='pending_approval' for update;
  if not found then raise exception using message='Adjustment menunggu persetujuan tidak ditemukan.';end if;
  select allow_self_approval into v_allow_self from public.company_settings where company_id=p_company_id;
  if not coalesce(v_allow_self,false) and v_doc.submitted_by=auth.uid() then raise exception using errcode='42501',message='Pembuat adjustment tidak boleh menyetujui sendiri.';end if;
  if p_action='reject' and length(trim(coalesce(p_comment,'')))<5 then raise exception using errcode='22023',message='Alasan penolakan minimal lima karakter.';end if;
  select id into v_request from public.approval_requests where company_id=p_company_id and document_type='inventory_adjustment' and document_id=p_adjustment_id and status='pending' for update;
  if v_request is null then raise exception using message='Permintaan persetujuan tidak ditemukan.';end if;
  update public.approval_requests set status=case p_action when 'approve' then 'approved' else 'rejected' end,completed_at=now() where id=v_request;
  insert into public.approval_actions(company_id,request_id,step,action,actor_user_id,comment) values(p_company_id,v_request,1,p_action,auth.uid(),nullif(trim(p_comment),''));
  if p_action='approve' then update public.inventory_adjustments set status='approved',approved_by=auth.uid(),approved_at=now(),updated_by=auth.uid() where id=p_adjustment_id;
  else update public.inventory_adjustments set status='rejected',rejected_by=auth.uid(),rejected_at=now(),rejection_reason=trim(p_comment),updated_by=auth.uid() where id=p_adjustment_id;end if;
end;$$;

create or replace function public.post_inventory_adjustment(p_company_id uuid,p_adjustment_id uuid,p_idempotency_key text)
returns uuid language plpgsql volatile security definer set search_path='' as $$
declare v_doc public.inventory_adjustments%rowtype;v_line record;v_balance public.product_warehouses%rowtype;v_journal uuid;v_total numeric(24,4):=0;v_cost numeric(24,4);v_new_qty numeric(24,6);v_new_value numeric(24,4);v_new_avg numeric(24,6);v_no integer:=0;
begin
  if not public.current_user_has_permission(p_company_id,'inventory.post') then raise exception using errcode='42501',message='Tidak memiliki izin posting adjustment.';end if;
  select * into v_doc from public.inventory_adjustments where company_id=p_company_id and id=p_adjustment_id for update;
  if not found then raise exception using message='Adjustment tidak ditemukan.';end if;
  if v_doc.status='posted' then return v_doc.journal_entry_id;end if;
  if v_doc.status<>'approved' then raise exception using message='Hanya adjustment approved yang dapat diposting.';end if;
  if not exists(select 1 from public.accounting_periods where company_id=p_company_id and v_doc.adjustment_date between starts_on and ends_on and status='open') then raise exception using message='Periode akuntansi tidak terbuka.';end if;
  insert into public.journal_entries(company_id,branch_id,journal_number,document_date,journal_date,posting_date,description,status,source_type,source_id,total_debit,total_credit,idempotency_key,posted_by,posted_at,created_by)
  values(p_company_id,v_doc.branch_id,v_doc.document_number||'/J',v_doc.adjustment_date,v_doc.adjustment_date,v_doc.adjustment_date,'Adjustment stok '||v_doc.document_number,'draft','inventory_adjustment',p_adjustment_id,0,0,p_idempotency_key,auth.uid(),now(),auth.uid()) returning id into v_journal;
  for v_line in select line.*,product.inventory_account_id,product.name from public.inventory_adjustment_lines line join public.products product on product.id=line.product_id where line.adjustment_id=p_adjustment_id order by line.line_number
  loop
    insert into public.product_warehouses(company_id,product_id,warehouse_id,created_by) values(p_company_id,v_line.product_id,v_doc.warehouse_id,auth.uid()) on conflict(company_id,product_id,warehouse_id) do nothing;
    select * into v_balance from public.product_warehouses where company_id=p_company_id and product_id=v_line.product_id and warehouse_id=v_doc.warehouse_id for update;
    if v_doc.adjustment_type='increase' then
      v_cost:=round(v_line.quantity*v_line.unit_cost,4);v_new_qty:=v_balance.quantity_on_hand+v_line.quantity;v_new_value:=v_balance.inventory_value+v_cost;v_new_avg:=case when v_new_qty=0 then 0 else round(v_new_value/v_new_qty,6) end;
    else
      if v_line.quantity>v_balance.quantity_on_hand then raise exception using message='Stok produk '||v_line.name||' tidak mencukupi.';end if;
      v_cost:=round(v_line.quantity*v_balance.average_cost,4);v_new_qty:=v_balance.quantity_on_hand-v_line.quantity;v_new_value:=greatest(0,v_balance.inventory_value-v_cost);v_new_avg:=case when v_new_qty=0 then 0 else round(v_new_value/v_new_qty,6) end;
    end if;
    update public.inventory_adjustment_lines set unit_cost=case when v_doc.adjustment_type='decrease' then v_balance.average_cost else unit_cost end,total_cost=v_cost where id=v_line.id;
    update public.product_warehouses set quantity_on_hand=v_new_qty,average_cost=v_new_avg,inventory_value=v_new_value,last_movement_date=v_doc.adjustment_date,updated_by=auth.uid() where id=v_balance.id;
    insert into public.inventory_movements(company_id,product_id,warehouse_id,movement_date,movement_type,quantity,unit_cost,total_cost,running_quantity,running_average_cost,source_type,source_id,source_line_id,created_by)
    values(p_company_id,v_line.product_id,v_doc.warehouse_id,v_doc.adjustment_date,case v_doc.adjustment_type when 'increase' then 'adjustment_in' else 'adjustment_out' end,case v_doc.adjustment_type when 'increase' then v_line.quantity else -v_line.quantity end,case when v_doc.adjustment_type='increase' then v_line.unit_cost else v_balance.average_cost end,v_cost,v_new_qty,v_new_avg,'inventory_adjustment',p_adjustment_id,v_line.id,auth.uid());
    v_no:=v_no+1;
    insert into public.journal_lines(company_id,journal_entry_id,account_id,line_number,description,debit,credit,base_debit,base_credit,branch_id,created_by)
    values(p_company_id,v_journal,v_line.inventory_account_id,v_no,'Persediaan: '||v_line.name,case when v_doc.adjustment_type='increase' then v_cost else 0 end,case when v_doc.adjustment_type='decrease' then v_cost else 0 end,case when v_doc.adjustment_type='increase' then v_cost else 0 end,case when v_doc.adjustment_type='decrease' then v_cost else 0 end,v_doc.branch_id,auth.uid());
    v_no:=v_no+1;
    insert into public.journal_lines(company_id,journal_entry_id,account_id,line_number,description,debit,credit,base_debit,base_credit,branch_id,created_by)
    values(p_company_id,v_journal,v_doc.offset_account_id,v_no,'Lawan adjustment: '||v_line.name,case when v_doc.adjustment_type='decrease' then v_cost else 0 end,case when v_doc.adjustment_type='increase' then v_cost else 0 end,case when v_doc.adjustment_type='decrease' then v_cost else 0 end,case when v_doc.adjustment_type='increase' then v_cost else 0 end,v_doc.branch_id,auth.uid());
    v_total:=v_total+v_cost;
  end loop;
  if v_total<=0 then raise exception using message='Nilai adjustment harus lebih besar dari nol.';end if;
  update public.journal_entries set total_debit=v_total,total_credit=v_total,status='posted' where id=v_journal;
  update public.inventory_adjustments set status='posted',total_cost=v_total,journal_entry_id=v_journal,posted_by=auth.uid(),posted_at=now(),updated_by=auth.uid() where id=p_adjustment_id;
  return v_journal;
exception when unique_violation then
  select id into v_journal from public.journal_entries where company_id=p_company_id and (idempotency_key=p_idempotency_key or(source_type='inventory_adjustment' and source_id=p_adjustment_id));
  if v_journal is null then raise;end if;return v_journal;
end;$$;

create or replace function public.reverse_inventory_adjustment(p_company_id uuid,p_adjustment_id uuid,p_reversal_date date,p_reason text,p_idempotency_key text)
returns uuid language plpgsql volatile security definer set search_path='' as $$
declare v_doc public.inventory_adjustments%rowtype;v_movement record;v_balance public.product_warehouses%rowtype;v_reversal uuid;v_new_qty numeric(24,6);v_new_value numeric(24,4);v_new_avg numeric(24,6);
begin
  if not public.current_user_has_permission(p_company_id,'inventory.reverse') or not public.current_user_has_permission(p_company_id,'journal.reverse') then raise exception using errcode='42501',message='Tidak memiliki izin reversal adjustment.';end if;
  if length(trim(p_reason))<5 then raise exception using errcode='22023',message='Alasan reversal minimal lima karakter.';end if;
  select * into v_doc from public.inventory_adjustments where company_id=p_company_id and id=p_adjustment_id for update;
  if not found or v_doc.status<>'posted' then raise exception using message='Adjustment posted tidak ditemukan.';end if;
  for v_movement in select * from public.inventory_movements where company_id=p_company_id and source_type='inventory_adjustment' and source_id=p_adjustment_id order by created_at desc
  loop
    if exists(select 1 from public.inventory_movements later where later.company_id=p_company_id and later.product_id=v_movement.product_id and later.warehouse_id=v_movement.warehouse_id and later.created_at>v_movement.created_at) then raise exception using message='Adjustment tidak dapat direversal karena terdapat pergerakan stok sesudahnya.';end if;
    select * into v_balance from public.product_warehouses where company_id=p_company_id and product_id=v_movement.product_id and warehouse_id=v_movement.warehouse_id for update;
    v_new_qty:=v_balance.quantity_on_hand-v_movement.quantity;
    v_new_value:=case when v_movement.quantity>0 then greatest(0,v_balance.inventory_value-v_movement.total_cost) else v_balance.inventory_value+v_movement.total_cost end;
    if v_new_qty<0 then raise exception using message='Reversal akan membuat stok negatif.';end if;
    v_new_avg:=case when v_new_qty=0 then 0 else round(v_new_value/v_new_qty,6) end;
    update public.product_warehouses set quantity_on_hand=v_new_qty,inventory_value=v_new_value,average_cost=v_new_avg,last_movement_date=p_reversal_date,updated_by=auth.uid() where id=v_balance.id;
    insert into public.inventory_movements(company_id,product_id,warehouse_id,movement_date,movement_type,quantity,unit_cost,total_cost,running_quantity,running_average_cost,source_type,source_id,source_line_id,created_by)
    values(p_company_id,v_movement.product_id,v_movement.warehouse_id,p_reversal_date,case when v_movement.quantity>0 then 'adjustment_out' else 'adjustment_in' end,-v_movement.quantity,v_movement.unit_cost,v_movement.total_cost,v_new_qty,v_new_avg,'inventory_adjustment_reversal',p_adjustment_id,v_movement.source_line_id,auth.uid());
  end loop;
  v_reversal:=public.reverse_journal_entry_core(p_company_id,v_doc.journal_entry_id,p_reversal_date,p_reason,p_idempotency_key);
  update public.inventory_adjustments set status='reversed',reversal_journal_id=v_reversal,reversed_by=auth.uid(),reversed_at=now(),reversal_reason=trim(p_reason),updated_by=auth.uid() where id=p_adjustment_id;
  insert into public.audit_logs(company_id,actor_user_id,action,entity_type,entity_id,document_number,reason,after_data) values(p_company_id,auth.uid(),'reverse','inventory_adjustment',p_adjustment_id,v_doc.document_number,trim(p_reason),jsonb_build_object('reversal_journal_id',v_reversal));
  return v_reversal;
end;$$;

revoke all on function public.save_inventory_adjustment(uuid,uuid,jsonb,jsonb,integer) from public,anon;
revoke all on function public.delete_inventory_adjustment(uuid,uuid,integer) from public,anon;
revoke all on function public.submit_inventory_adjustment(uuid,uuid) from public,anon;
revoke all on function public.decide_inventory_adjustment(uuid,uuid,text,text) from public,anon;
revoke all on function public.post_inventory_adjustment(uuid,uuid,text) from public,anon;
revoke all on function public.reverse_inventory_adjustment(uuid,uuid,date,text,text) from public,anon;
grant execute on function public.save_inventory_adjustment(uuid,uuid,jsonb,jsonb,integer) to authenticated;
grant execute on function public.delete_inventory_adjustment(uuid,uuid,integer) to authenticated;
grant execute on function public.submit_inventory_adjustment(uuid,uuid) to authenticated;
grant execute on function public.decide_inventory_adjustment(uuid,uuid,text,text) to authenticated;
grant execute on function public.post_inventory_adjustment(uuid,uuid,text) to authenticated;
grant execute on function public.reverse_inventory_adjustment(uuid,uuid,date,text,text) to authenticated;

commit;
