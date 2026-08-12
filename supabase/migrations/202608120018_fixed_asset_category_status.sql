begin;

alter table public.fixed_asset_categories
add column if not exists is_active boolean not null default true;

create or replace function public.protect_fixed_asset_category_deactivation()
returns trigger language plpgsql set search_path='' as $$ begin
 if old.is_active and not new.is_active and exists(
  select 1 from public.fixed_assets asset where asset.company_id=old.company_id and asset.category_id=old.id and asset.status<>'disposed'
 ) then raise exception using errcode='23503',message='Kategori masih digunakan aset yang belum disposed.';end if;
 return new;
end;$$;
create trigger fixed_asset_category_deactivation before update of is_active on public.fixed_asset_categories
for each row execute function public.protect_fixed_asset_category_deactivation();

commit;
