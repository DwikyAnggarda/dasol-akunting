begin;

alter table public.contact_credits
  add column applied_amount numeric(24,4) not null default 0
  check (applied_amount >= 0 and applied_amount <= original_amount);

-- Backfill credits created before applied/available portions were recorded.
do $$
declare
  v_row record;
  v_source uuid;
  v_remaining numeric(24,4) := 0;
  v_applied numeric(24,4);
begin
  for v_row in
    select
      credit.id,
      credit.original_amount,
      document.return_type,
      document.source_invoice_id,
      document.posted_at,
      case document.return_type
        when 'sales_return' then sales.total
        else purchase.total
      end as invoice_total,
      case document.return_type
        when 'sales_return' then coalesce((
          select sum(allocation.allocated_amount)
          from public.customer_receipt_allocations allocation
          join public.customer_receipts receipt on receipt.id = allocation.receipt_id
          where receipt.status = 'posted'
            and allocation.receivable_id = receivable.id
        ), 0)
        else coalesce((
          select sum(allocation.allocated_amount)
          from public.supplier_payment_allocations allocation
          join public.supplier_payments payment on payment.id = allocation.payment_id
          where payment.status = 'posted'
            and allocation.payable_id = payable.id
        ), 0)
      end as settled_amount
    from public.contact_credits credit
    join public.return_documents document on document.id = credit.return_id
    left join public.sales_invoices sales
      on document.return_type = 'sales_return' and sales.id = document.source_invoice_id
    left join public.accounts_receivable receivable on receivable.sales_invoice_id = sales.id
    left join public.purchase_invoices purchase
      on document.return_type = 'purchase_return' and purchase.id = document.source_invoice_id
    left join public.accounts_payable payable on payable.purchase_invoice_id = purchase.id
    order by document.source_invoice_id, document.posted_at, credit.created_at, credit.id
  loop
    if v_source is distinct from v_row.source_invoice_id then
      v_source := v_row.source_invoice_id;
      v_remaining := greatest(0, v_row.invoice_total - v_row.settled_amount);
    end if;
    v_applied := least(v_row.original_amount, v_remaining);
    update public.contact_credits
    set applied_amount = v_applied,
        available_amount = original_amount - v_applied,
        status = case when original_amount - v_applied = 0 then 'applied' else 'open' end
    where id = v_row.id;
    v_remaining := greatest(0, v_remaining - v_applied);
  end loop;
end;
$$;

alter table public.contact_credits
  add constraint contact_credits_allocation_check
  check (available_amount + applied_amount <= original_amount);

create or replace function public.set_return_credit_allocation()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_document public.return_documents%rowtype;
  v_invoice_total numeric(24,4);
  v_settled numeric(24,4);
  v_prior_applied numeric(24,4);
  v_outstanding_before numeric(24,4);
begin
  select * into v_document
  from public.return_documents
  where id = new.return_id and company_id = new.company_id;

  if not found then
    raise exception using message = 'Dokumen retur untuk kredit tidak ditemukan.';
  end if;

  if v_document.return_type = 'sales_return' then
    select invoice.total,
           coalesce(sum(allocation.allocated_amount) filter (where receipt.status = 'posted'), 0)
    into v_invoice_total, v_settled
    from public.sales_invoices invoice
    left join public.accounts_receivable receivable on receivable.sales_invoice_id = invoice.id
    left join public.customer_receipt_allocations allocation on allocation.receivable_id = receivable.id
    left join public.customer_receipts receipt on receipt.id = allocation.receipt_id
    where invoice.id = v_document.source_invoice_id
    group by invoice.total;
  else
    select invoice.total,
           coalesce(sum(allocation.allocated_amount) filter (where payment.status = 'posted'), 0)
    into v_invoice_total, v_settled
    from public.purchase_invoices invoice
    left join public.accounts_payable payable on payable.purchase_invoice_id = invoice.id
    left join public.supplier_payment_allocations allocation on allocation.payable_id = payable.id
    left join public.supplier_payments payment on payment.id = allocation.payment_id
    where invoice.id = v_document.source_invoice_id
    group by invoice.total;
  end if;

  select coalesce(sum(credit.applied_amount), 0)
  into v_prior_applied
  from public.contact_credits credit
  join public.return_documents document on document.id = credit.return_id
  where document.source_invoice_id = v_document.source_invoice_id
    and credit.status <> 'reversed';

  v_outstanding_before := greatest(0, v_invoice_total - v_settled - v_prior_applied);
  new.applied_amount := least(new.original_amount, v_outstanding_before);
  new.available_amount := new.original_amount - new.applied_amount;
  new.status := case when new.available_amount = 0 then 'applied' else 'open' end;
  return new;
end;
$$;

create trigger contact_credits_allocate
before insert on public.contact_credits
for each row execute function public.set_return_credit_allocation();

create or replace function public.reverse_return_document(
  p_company_id uuid,
  p_return_id uuid,
  p_date date,
  p_reason text,
  p_idempotency_key text
) returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_doc public.return_documents%rowtype;
  v_credit public.contact_credits%rowtype;
  v_move public.inventory_movements%rowtype;
  v_balance public.product_warehouses%rowtype;
  v_reversal uuid;
  v_new_qty numeric;
  v_new_value numeric;
  v_new_avg numeric;
begin
  select * into v_doc
  from public.return_documents
  where company_id = p_company_id and id = p_return_id and status = 'posted'
  for update;
  if not found or length(trim(p_reason)) < 5 then
    raise exception using message = 'Retur posted atau alasan tidak valid.';
  end if;
  if not public.current_user_has_permission(
    p_company_id,
    case v_doc.return_type when 'sales_return' then 'sales.post' else 'purchase.post' end
  ) or not public.current_user_has_permission(p_company_id, 'journal.reverse') then
    raise exception using errcode = '42501', message = 'Tidak memiliki izin reversal retur.';
  end if;

  select * into v_credit
  from public.contact_credits
  where company_id = p_company_id and return_id = p_return_id
  for update;
  if not found or v_credit.status = 'reversed'
     or v_credit.available_amount + v_credit.applied_amount <> v_credit.original_amount then
    raise exception using message = 'Kredit retur tidak konsisten atau sudah digunakan.';
  end if;

  for v_move in
    select * from public.inventory_movements
    where company_id = p_company_id
      and source_type = v_doc.return_type
      and source_id = p_return_id
    order by created_at desc
  loop
    if exists(
      select 1 from public.inventory_movements later
      where later.company_id = p_company_id
        and later.product_id = v_move.product_id
        and later.warehouse_id = v_move.warehouse_id
        and later.created_at > v_move.created_at
    ) then
      raise exception using message = 'Reversal diblokir karena ada movement berikutnya.';
    end if;
    select * into v_balance
    from public.product_warehouses
    where company_id = p_company_id
      and product_id = v_move.product_id
      and warehouse_id = v_move.warehouse_id
    for update;
    v_new_qty := v_balance.quantity_on_hand - v_move.quantity;
    if v_new_qty < 0 then
      raise exception using message = 'Reversal membuat stok negatif.';
    end if;
    v_new_value := case
      when v_move.quantity > 0 then greatest(0, v_balance.inventory_value - v_move.total_cost)
      else v_balance.inventory_value + v_move.total_cost
    end;
    v_new_avg := case when v_new_qty = 0 then 0 else round(v_new_value / v_new_qty, 6) end;
    update public.product_warehouses
    set quantity_on_hand = v_new_qty,
        inventory_value = v_new_value,
        average_cost = v_new_avg,
        last_movement_date = p_date,
        updated_by = auth.uid()
    where id = v_balance.id;
    insert into public.inventory_movements(
      company_id, product_id, warehouse_id, movement_date, movement_type,
      quantity, unit_cost, total_cost, running_quantity, running_average_cost,
      source_type, source_id, source_line_id, created_by
    ) values (
      p_company_id, v_move.product_id, v_move.warehouse_id, p_date,
      case when v_move.quantity > 0 then 'return_out' else 'return_in' end,
      -v_move.quantity, v_move.unit_cost, v_move.total_cost, v_new_qty, v_new_avg,
      v_doc.return_type || '_reversal', p_return_id, v_move.source_line_id, auth.uid()
    );
  end loop;

  v_reversal := public.reverse_journal_entry_core(
    p_company_id, v_doc.journal_entry_id, p_date, p_reason, p_idempotency_key
  );

  if v_doc.return_type = 'sales_return' then
    update public.accounts_receivable
    set outstanding_amount = least(original_amount, outstanding_amount + v_credit.applied_amount),
        status = case
          when least(original_amount, outstanding_amount + v_credit.applied_amount) = 0 then 'paid'
          when least(original_amount, outstanding_amount + v_credit.applied_amount) >= original_amount then 'open'
          else 'partially_paid'
        end,
        updated_by = auth.uid()
    where company_id = p_company_id and sales_invoice_id = v_doc.source_invoice_id;
    update public.sales_invoices invoice
    set outstanding_balance = receivable.outstanding_amount,
        status = case
          when receivable.outstanding_amount = 0 then 'paid'
          when receivable.outstanding_amount >= invoice.total then 'posted'
          else 'partially_paid'
        end,
        updated_by = auth.uid()
    from public.accounts_receivable receivable
    where invoice.id = v_doc.source_invoice_id
      and receivable.sales_invoice_id = invoice.id;
  else
    update public.accounts_payable
    set outstanding_amount = least(original_amount, outstanding_amount + v_credit.applied_amount),
        status = case
          when least(original_amount, outstanding_amount + v_credit.applied_amount) = 0 then 'paid'
          when least(original_amount, outstanding_amount + v_credit.applied_amount) >= original_amount then 'open'
          else 'partially_paid'
        end,
        updated_by = auth.uid()
    where company_id = p_company_id and purchase_invoice_id = v_doc.source_invoice_id;
    update public.purchase_invoices invoice
    set outstanding_balance = payable.outstanding_amount,
        status = case
          when payable.outstanding_amount = 0 then 'paid'
          when payable.outstanding_amount >= invoice.total then 'posted'
          else 'partially_paid'
        end,
        updated_by = auth.uid()
    from public.accounts_payable payable
    where invoice.id = v_doc.source_invoice_id
      and payable.purchase_invoice_id = invoice.id;
  end if;

  update public.contact_credits
  set status = 'reversed', available_amount = 0, applied_amount = 0
  where id = v_credit.id;
  update public.return_documents
  set status = 'reversed', reversal_journal_id = v_reversal,
      reversed_by = auth.uid(), reversed_at = now(), reversal_reason = trim(p_reason),
      updated_by = auth.uid()
  where id = p_return_id;
  return v_reversal;
end;
$$;

revoke all on function public.reverse_return_document(uuid, uuid, date, text, text)
  from public, anon;
grant execute on function public.reverse_return_document(uuid, uuid, date, text, text)
  to authenticated;

commit;
