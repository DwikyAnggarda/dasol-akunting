begin;

create or replace function public.save_contact(
  p_company_id uuid,
  p_contact_id uuid,
  p_version integer,
  p_contact jsonb,
  p_address jsonb
)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_contact_id uuid;
begin
  if auth.uid() is null or not public.current_user_has_permission(p_company_id, 'contact.write') then
    raise exception using errcode = '42501', message = 'Tidak memiliki izin mengelola kontak.';
  end if;

  if p_contact_id is null then
    insert into public.contacts(
      company_id, code, contact_type, display_name, legal_name, email, phone,
      tax_id, national_id, tax_branch_id, is_taxable_entrepreneur,
      payment_term_id, credit_limit, receivable_account_id, payable_account_id,
      default_tax_code_id, notes, created_by
    ) values (
      p_company_id,
      upper(trim(p_contact->>'code')),
      p_contact->>'contact_type',
      trim(p_contact->>'display_name'),
      nullif(trim(p_contact->>'legal_name'), ''),
      nullif(trim(p_contact->>'email'), ''),
      nullif(trim(p_contact->>'phone'), ''),
      nullif(trim(p_contact->>'tax_id'), ''),
      nullif(trim(p_contact->>'national_id'), ''),
      nullif(trim(p_contact->>'tax_branch_id'), ''),
      coalesce((p_contact->>'is_taxable_entrepreneur')::boolean, false),
      nullif(p_contact->>'payment_term_id', '')::uuid,
      coalesce((p_contact->>'credit_limit')::numeric, 0),
      nullif(p_contact->>'receivable_account_id', '')::uuid,
      nullif(p_contact->>'payable_account_id', '')::uuid,
      nullif(p_contact->>'default_tax_code_id', '')::uuid,
      nullif(trim(p_contact->>'notes'), ''),
      auth.uid()
    ) returning id into v_contact_id;
  else
    update public.contacts
    set code = upper(trim(p_contact->>'code')),
        contact_type = p_contact->>'contact_type',
        display_name = trim(p_contact->>'display_name'),
        legal_name = nullif(trim(p_contact->>'legal_name'), ''),
        email = nullif(trim(p_contact->>'email'), ''),
        phone = nullif(trim(p_contact->>'phone'), ''),
        tax_id = nullif(trim(p_contact->>'tax_id'), ''),
        national_id = nullif(trim(p_contact->>'national_id'), ''),
        tax_branch_id = nullif(trim(p_contact->>'tax_branch_id'), ''),
        is_taxable_entrepreneur = coalesce((p_contact->>'is_taxable_entrepreneur')::boolean, false),
        payment_term_id = nullif(p_contact->>'payment_term_id', '')::uuid,
        credit_limit = coalesce((p_contact->>'credit_limit')::numeric, 0),
        receivable_account_id = nullif(p_contact->>'receivable_account_id', '')::uuid,
        payable_account_id = nullif(p_contact->>'payable_account_id', '')::uuid,
        default_tax_code_id = nullif(p_contact->>'default_tax_code_id', '')::uuid,
        notes = nullif(trim(p_contact->>'notes'), ''),
        updated_by = auth.uid()
    where id = p_contact_id and company_id = p_company_id and version = p_version
    returning id into v_contact_id;

    if v_contact_id is null then
      raise exception using errcode = 'P0002', message = 'Kontak berubah atau tidak ditemukan.';
    end if;
  end if;

  if nullif(trim(p_address->>'address_line'), '') is not null then
    update public.contact_addresses
    set address_line = trim(p_address->>'address_line'),
        city = nullif(trim(p_address->>'city'), ''),
        province = nullif(trim(p_address->>'province'), ''),
        postal_code = nullif(trim(p_address->>'postal_code'), ''),
        is_primary = true,
        updated_by = auth.uid()
    where company_id = p_company_id and contact_id = v_contact_id
      and address_type = 'registered' and is_primary;

    if not found then
      insert into public.contact_addresses(
        company_id, contact_id, address_type, address_line, city, province,
        postal_code, is_primary, created_by
      ) values (
        p_company_id, v_contact_id, 'registered', trim(p_address->>'address_line'),
        nullif(trim(p_address->>'city'), ''), nullif(trim(p_address->>'province'), ''),
        nullif(trim(p_address->>'postal_code'), ''), true, auth.uid()
      );
    end if;
  end if;

  return v_contact_id;
end;
$$;

revoke all on function public.save_contact(uuid, uuid, integer, jsonb, jsonb) from public, anon;
grant execute on function public.save_contact(uuid, uuid, integer, jsonb, jsonb) to authenticated;

commit;
