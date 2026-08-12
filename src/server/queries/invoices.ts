import { notFound } from "next/navigation";

import { requireUser } from "@/server/auth/require-user";

export const INVOICE_PAGE_SIZE = 50;
export type InvoiceKind = "purchase" | "sales";
export type InvoiceFilters = { page?: number; q?: string; status?: string };

function queryFailure(scope: string, error: unknown): never {
  console.error(`${scope} query failed`, error);
  throw new Error(`${scope} tidak dapat dimuat.`);
}

export async function getInvoiceOptions(companyId: string, kind: InvoiceKind) {
  const { supabase } = await requireUser();
  const [branches, contacts, products, warehouses, taxRates] =
    await Promise.all([
      supabase
        .from("branches")
        .select("id,code,name")
        .eq("company_id", companyId)
        .eq("is_active", true)
        .order("code"),
      supabase
        .from("contacts")
        .select("id,code,display_name,contact_type")
        .eq("company_id", companyId)
        .eq("is_active", true)
        .in(
          "contact_type",
          kind === "sales" ? ["customer", "both"] : ["supplier", "both"],
        )
        .order("code"),
      supabase
        .from("products")
        .select("id,sku,name,product_type,sales_price,purchase_price")
        .eq("company_id", companyId)
        .eq("is_active", true)
        .order("sku"),
      supabase
        .from("warehouses")
        .select("id,code,name")
        .eq("company_id", companyId)
        .eq("is_active", true)
        .order("code"),
      supabase
        .from("tax_rate_versions")
        .select(
          "id,rate,effective_from,effective_to,price_includes_tax,tax_codes!inner(code,name,is_active)",
        )
        .eq("company_id", companyId)
        .eq("status", "active")
        .eq("tax_codes.is_active", true)
        .eq("price_includes_tax", false)
        .order("effective_from", { ascending: false }),
    ]);
  const failed = [branches, contacts, products, warehouses, taxRates].find(
    (result) => result.error,
  );
  if (failed?.error) queryFailure("Pilihan invoice", failed.error);
  const label = (row: { code: string; name: string }) =>
    `${row.code} — ${row.name}`;
  return {
    branches: (branches.data ?? []).map((row) => ({
      label: label(row),
      value: row.id,
    })),
    contacts: (contacts.data ?? []).map((row) => ({
      label: `${row.code} — ${row.display_name}`,
      value: row.id,
    })),
    products: (products.data ?? []).map((row) => ({
      label: `${row.sku} — ${row.name}`,
      name: row.name,
      productType: row.product_type,
      purchasePrice: String(row.purchase_price),
      salesPrice: String(row.sales_price),
      value: row.id,
    })),
    taxRates: (taxRates.data ?? []).map((row) => {
      const taxCode = Array.isArray(row.tax_codes)
        ? row.tax_codes[0]
        : row.tax_codes;
      return {
        effectiveFrom: row.effective_from,
        effectiveTo: row.effective_to,
        label: `${taxCode?.code ?? "Pajak"} — ${row.rate}% (${row.effective_from}${row.effective_to ? ` s.d. ${row.effective_to}` : ""})`,
        value: row.id,
      };
    }),
    warehouses: (warehouses.data ?? []).map((row) => ({
      label: label(row),
      value: row.id,
    })),
  };
}

export async function getInvoiceRecords(
  companyId: string,
  kind: InvoiceKind,
  filters: InvoiceFilters = {},
) {
  const { supabase } = await requireUser();
  const page =
    Number.isInteger(filters.page) && (filters.page ?? 0) > 0
      ? filters.page!
      : 1;
  const from = (page - 1) * INVOICE_PAGE_SIZE;
  const select =
    "id,document_number,document_date,due_date,status,total,outstanding_balance,version,contacts(display_name)";
  let query =
    kind === "sales"
      ? supabase
          .from("sales_invoices")
          .select(select)
          .eq("company_id", companyId)
      : supabase
          .from("purchase_invoices")
          .select(select)
          .eq("company_id", companyId);
  if (filters.q) query = query.or(`document_number.ilike.%${filters.q}%`);
  if (filters.status) query = query.eq("status", filters.status);
  const { data, error } = await query
    .order("document_date", { ascending: false })
    .order("created_at", { ascending: false })
    .range(from, from + INVOICE_PAGE_SIZE);
  if (error)
    queryFailure(
      kind === "sales" ? "Invoice penjualan" : "Invoice pembelian",
      error,
    );
  return data ?? [];
}

export async function getInvoiceRecord(
  companyId: string,
  kind: InvoiceKind,
  id: string,
) {
  const { supabase } = await requireUser();
  const headerResult =
    kind === "sales"
      ? await supabase
          .from("sales_invoices")
          .select("*,contacts(code,display_name),branches(code,name)")
          .eq("company_id", companyId)
          .eq("id", id)
          .maybeSingle()
      : await supabase
          .from("purchase_invoices")
          .select("*,contacts(code,display_name),branches(code,name)")
          .eq("company_id", companyId)
          .eq("id", id)
          .maybeSingle();
  if (headerResult.error) queryFailure("Detail invoice", headerResult.error);
  if (!headerResult.data) notFound();
  const linesResult =
    kind === "sales"
      ? await supabase
          .from("sales_invoice_lines")
          .select(
            "*,products(sku,name,product_type),warehouses(code,name),tax_rate_versions(rate,tax_codes(code))",
          )
          .eq("company_id", companyId)
          .eq("invoice_id", id)
          .order("line_number")
      : await supabase
          .from("purchase_invoice_lines")
          .select(
            "*,products(sku,name,product_type),warehouses(code,name),tax_rate_versions(rate,tax_codes(code))",
          )
          .eq("company_id", companyId)
          .eq("invoice_id", id)
          .order("line_number");
  if (linesResult.error) queryFailure("Baris invoice", linesResult.error);
  const { data: approval, error: approvalError } = await supabase
    .from("approval_requests")
    .select(
      "id,status,submitted_at,completed_at,approval_actions(action,comment,created_at,actor_user_id)",
    )
    .eq("company_id", companyId)
    .eq("document_type", `${kind}_invoice`)
    .eq("document_id", id)
    .maybeSingle();
  if (approvalError) queryFailure("Riwayat persetujuan", approvalError);
  const { data: journal, error: journalError } = await supabase
    .from("journal_entries")
    .select("id,journal_number,status,posting_date")
    .eq("company_id", companyId)
    .eq("source_type", `${kind}_invoice`)
    .eq("source_id", id)
    .maybeSingle();
  if (journalError) queryFailure("Jurnal invoice", journalError);
  return {
    ...headerResult.data,
    approval,
    journal,
    lines: linesResult.data ?? [],
  };
}
