-- Static, non-secret reference data only. Demo users and company data are created by
-- `npm run seed:demo` so credentials are never committed to the repository.
insert into public.currencies(code, name, decimal_places)
values ('IDR', 'Rupiah Indonesia', 2)
on conflict (code) do update set name = excluded.name, decimal_places = excluded.decimal_places;
