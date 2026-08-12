import { notFound } from "next/navigation";

import { requireUser } from "@/server/auth/require-user";

export const MASTER_PAGE_SIZE = 50;

type QueryFilters = {
  active?: string;
  page?: number;
  q?: string;
  type?: string;
};

function pageRange(page = 1) {
  const safePage = Number.isInteger(page) && page > 0 ? page : 1;
  const from = (safePage - 1) * MASTER_PAGE_SIZE;
  return { from, to: from + MASTER_PAGE_SIZE };
}

function reportQueryError(scope: string, error: unknown): never {
  console.error(`${scope} query failed`, error);
  throw new Error(`${scope} tidak dapat dimuat.`);
}

export async function getMasterOptions(companyId: string) {
  const { supabase } = await requireUser();
  const [accounts, branches, paymentTerms, taxes, units] = await Promise.all([
    supabase
      .from("chart_of_accounts")
      .select("id,code,name,account_type")
      .eq("company_id", companyId)
      .eq("is_active", true)
      .order("code"),
    supabase
      .from("branches")
      .select("id,code,name")
      .eq("company_id", companyId)
      .eq("is_active", true)
      .order("code"),
    supabase
      .from("payment_terms")
      .select("id,code,name")
      .eq("company_id", companyId)
      .eq("is_active", true)
      .order("code"),
    supabase
      .from("tax_codes")
      .select("id,code,name")
      .eq("company_id", companyId)
      .eq("is_active", true)
      .order("code"),
    supabase
      .from("units")
      .select("id,code,name")
      .eq("company_id", companyId)
      .eq("is_active", true)
      .order("code"),
  ]);
  const failed = [accounts, branches, paymentTerms, taxes, units].find(
    (result) => result.error,
  );
  if (failed?.error) reportQueryError("Pilihan master", failed.error);
  const label = (row: { code: string; name: string }) =>
    `${row.code} — ${row.name}`;
  return {
    accounts: (accounts.data ?? []).map((row) => ({
      label: label(row),
      type: row.account_type,
      value: row.id,
    })),
    branches: (branches.data ?? []).map((row) => ({
      label: label(row),
      value: row.id,
    })),
    paymentTerms: (paymentTerms.data ?? []).map((row) => ({
      label: label(row),
      value: row.id,
    })),
    taxes: (taxes.data ?? []).map((row) => ({
      label: label(row),
      value: row.id,
    })),
    units: (units.data ?? []).map((row) => ({
      label: label(row),
      value: row.id,
    })),
  };
}

export async function getAccountRecords(
  companyId: string,
  filters: QueryFilters = {},
) {
  const { supabase } = await requireUser();
  const { from, to } = pageRange(filters.page);
  let query = supabase
    .from("chart_of_accounts")
    .select(
      "id,code,name,account_type,normal_balance,parent_id,is_control_account,allow_manual_entry,cash_flow_category,is_active,created_at,updated_at,version",
    )
    .eq("company_id", companyId)
    .order("code");
  if (filters.q)
    query = query.or(`code.ilike.%${filters.q}%,name.ilike.%${filters.q}%`);
  if (filters.type) query = query.eq("account_type", filters.type);
  if (filters.active === "active") query = query.eq("is_active", true);
  if (filters.active === "inactive") query = query.eq("is_active", false);
  const { data, error } = await query.range(from, to);
  if (error) reportQueryError("Daftar akun", error);
  return data ?? [];
}

export async function getAccountRecord(companyId: string, id: string) {
  const { supabase } = await requireUser();
  const { data, error } = await supabase
    .from("chart_of_accounts")
    .select("*")
    .eq("company_id", companyId)
    .eq("id", id)
    .maybeSingle();
  if (error) reportQueryError("Detail akun", error);
  if (!data) notFound();
  return data;
}

export async function getContactRecords(
  companyId: string,
  filters: QueryFilters = {},
) {
  const { supabase } = await requireUser();
  const { from, to } = pageRange(filters.page);
  let query = supabase
    .from("contacts")
    .select(
      "id,code,contact_type,display_name,email,phone,is_taxable_entrepreneur,credit_limit,is_active,version",
    )
    .eq("company_id", companyId)
    .order("code");
  if (filters.q)
    query = query.or(
      `code.ilike.%${filters.q}%,display_name.ilike.%${filters.q}%,email.ilike.%${filters.q}%`,
    );
  if (filters.type) query = query.eq("contact_type", filters.type);
  if (filters.active === "active") query = query.eq("is_active", true);
  if (filters.active === "inactive") query = query.eq("is_active", false);
  const { data, error } = await query.range(from, to);
  if (error) reportQueryError("Daftar kontak", error);
  return data ?? [];
}

export async function getContactRecord(companyId: string, id: string) {
  const { supabase } = await requireUser();
  const { data, error } = await supabase
    .from("contacts")
    .select("*, contact_addresses(*)")
    .eq("company_id", companyId)
    .eq("id", id)
    .maybeSingle();
  if (error) reportQueryError("Detail kontak", error);
  if (!data) notFound();
  return data;
}

export async function getProductRecords(
  companyId: string,
  filters: QueryFilters = {},
) {
  const { supabase } = await requireUser();
  const { from, to } = pageRange(filters.page);
  let query = supabase
    .from("products")
    .select(
      "id,sku,barcode,name,product_type,sales_price,purchase_price,minimum_stock,is_active,version,units(code)",
    )
    .eq("company_id", companyId)
    .order("sku");
  if (filters.q)
    query = query.or(`sku.ilike.%${filters.q}%,name.ilike.%${filters.q}%`);
  if (filters.type) query = query.eq("product_type", filters.type);
  if (filters.active === "active") query = query.eq("is_active", true);
  if (filters.active === "inactive") query = query.eq("is_active", false);
  const { data, error } = await query.range(from, to);
  if (error) reportQueryError("Daftar produk", error);
  return data ?? [];
}

export async function getProductRecord(companyId: string, id: string) {
  const { supabase } = await requireUser();
  const { data, error } = await supabase
    .from("products")
    .select("*, units(code,name), product_warehouses(*, warehouses(name))")
    .eq("company_id", companyId)
    .eq("id", id)
    .maybeSingle();
  if (error) reportQueryError("Detail produk", error);
  if (!data) notFound();
  return data;
}

export async function getWarehouseRecords(
  companyId: string,
  filters: QueryFilters = {},
) {
  const { supabase } = await requireUser();
  const { from, to } = pageRange(filters.page);
  let query = supabase
    .from("warehouses")
    .select(
      "id,code,name,address_line,city,province,is_active,version,branches(code,name)",
    )
    .eq("company_id", companyId)
    .order("code");
  if (filters.q)
    query = query.or(`code.ilike.%${filters.q}%,name.ilike.%${filters.q}%`);
  if (filters.active === "active") query = query.eq("is_active", true);
  if (filters.active === "inactive") query = query.eq("is_active", false);
  const { data, error } = await query.range(from, to);
  if (error) reportQueryError("Daftar gudang", error);
  return data ?? [];
}

export async function getWarehouseRecord(companyId: string, id: string) {
  const { supabase } = await requireUser();
  const { data, error } = await supabase
    .from("warehouses")
    .select("*, branches(code,name)")
    .eq("company_id", companyId)
    .eq("id", id)
    .maybeSingle();
  if (error) reportQueryError("Detail gudang", error);
  if (!data) notFound();
  return data;
}

export async function getTaxCodeRecords(
  companyId: string,
  filters: QueryFilters = {},
) {
  const { supabase } = await requireUser();
  const { from, to } = pageRange(filters.page);
  let query = supabase
    .from("tax_codes")
    .select(
      "id,code,name,category,is_active,version,tax_rate_versions(id,rate,effective_from,effective_to,status)",
    )
    .eq("company_id", companyId)
    .order("code");
  if (filters.q)
    query = query.or(`code.ilike.%${filters.q}%,name.ilike.%${filters.q}%`);
  if (filters.active === "active") query = query.eq("is_active", true);
  if (filters.active === "inactive") query = query.eq("is_active", false);
  const { data, error } = await query.range(from, to);
  if (error) reportQueryError("Daftar pajak", error);
  return data ?? [];
}

export async function getTaxCodeRecord(companyId: string, id: string) {
  const { supabase } = await requireUser();
  const { data, error } = await supabase
    .from("tax_codes")
    .select("*, tax_rate_versions(*)")
    .eq("company_id", companyId)
    .eq("id", id)
    .maybeSingle();
  if (error) reportQueryError("Detail pajak", error);
  if (!data) notFound();
  return data;
}

export async function getBankAccountRecords(
  companyId: string,
  filters: QueryFilters = {},
) {
  const { supabase } = await requireUser();
  const { from, to } = pageRange(filters.page);
  let query = supabase
    .from("bank_accounts")
    .select(
      "id,code,name,account_type,bank_name,masked_account_number,currency_code,is_active,version,chart_of_accounts(code,name)",
    )
    .eq("company_id", companyId)
    .order("code");
  if (filters.q)
    query = query.or(`code.ilike.%${filters.q}%,name.ilike.%${filters.q}%`);
  if (filters.active === "active") query = query.eq("is_active", true);
  if (filters.active === "inactive") query = query.eq("is_active", false);
  const { data, error } = await query.range(from, to);
  if (error) reportQueryError("Daftar akun bank/kas", error);
  return data ?? [];
}

export async function getBankAccountRecord(companyId: string, id: string) {
  const { supabase } = await requireUser();
  const { data, error } = await supabase
    .from("bank_accounts")
    .select("*, chart_of_accounts(code,name)")
    .eq("company_id", companyId)
    .eq("id", id)
    .maybeSingle();
  if (error) reportQueryError("Detail akun bank/kas", error);
  if (!data) notFound();
  return data;
}
