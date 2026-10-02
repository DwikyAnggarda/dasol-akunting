create or replace function public.delete_unused_product(
  p_company_id uuid,
  p_product_id uuid,
  p_version integer
)
returns boolean
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_product public.products%rowtype;
begin
  if auth.uid() is null then
    raise exception using errcode = '42501', message = 'Autentikasi diperlukan.';
  end if;
  if not public.current_user_has_permission(p_company_id, 'item.write') then
    raise exception using errcode = '42501', message = 'Tidak memiliki izin menghapus produk.';
  end if;

  select * into v_product
  from public.products
  where company_id = p_company_id and id = p_product_id
  for update;
  if not found or v_product.version <> p_version then return false; end if;

  if exists (
    select 1 from public.product_warehouses
    where company_id = p_company_id and product_id = p_product_id
      and (quantity_on_hand > 0 or quantity_reserved > 0 or inventory_value > 0)
  ) then
    raise exception using errcode = '23514', message = 'Produk masih memiliki stok. Kosongkan stok sebelum menghapus permanen.';
  end if;

  delete from public.product_warehouses
  where company_id = p_company_id and product_id = p_product_id;

  delete from public.products
  where company_id = p_company_id and id = p_product_id and version = p_version;
  return found;
exception when foreign_key_violation then
  raise exception using errcode = '23514', message = 'Produk sudah digunakan pada transaksi atau konfigurasi POS. Produk tidak dapat dihapus permanen.';
end;
$$;

revoke all on function public.delete_unused_product(uuid, uuid, integer) from public, anon;
grant execute on function public.delete_unused_product(uuid, uuid, integer) to authenticated;
