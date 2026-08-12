import { notFound } from "next/navigation";

import { requireUser } from "@/server/auth/require-user";

export type SettlementKind = "customer" | "supplier";
export const SETTLEMENT_PAGE_SIZE = 50;

function fail(scope: string, error: unknown): never {
  console.error(`${scope} query failed`, error);
  throw new Error(`${scope} tidak dapat dimuat.`);
}

export async function getSettlementOptions(
  companyId: string,
  kind: SettlementKind,
) {
  const { supabase } = await requireUser();
  const [branches, banks, contacts, items] = await Promise.all([
    supabase
      .from("branches")
      .select("id,code,name")
      .eq("company_id", companyId)
      .eq("is_active", true)
      .order("code"),
    supabase
      .from("bank_accounts")
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
        kind === "customer" ? ["customer", "both"] : ["supplier", "both"],
      )
      .order("code"),
    kind === "customer"
      ? supabase
          .from("accounts_receivable")
          .select(
            "id,customer_id,document_number,document_date,due_date,original_amount,outstanding_amount,status",
          )
          .eq("company_id", companyId)
          .gt("outstanding_amount", 0)
          .order("due_date")
      : supabase
          .from("accounts_payable")
          .select(
            "id,supplier_id,document_number,document_date,due_date,original_amount,outstanding_amount,status",
          )
          .eq("company_id", companyId)
          .gt("outstanding_amount", 0)
          .order("due_date"),
  ]);
  const failed = [branches, banks, contacts, items].find(
    (result) => result.error,
  );
  if (failed?.error) fail("Pilihan pembayaran", failed.error);
  const label = (row: { code: string; name: string }) =>
    `${row.code} — ${row.name}`;
  return {
    banks: (banks.data ?? []).map((row) => ({
      label: label(row),
      value: row.id,
    })),
    branches: (branches.data ?? []).map((row) => ({
      label: label(row),
      value: row.id,
    })),
    contacts: (contacts.data ?? []).map((row) => ({
      label: `${row.code} — ${row.display_name}`,
      value: row.id,
    })),
    items: (items.data ?? []).map((row) => ({
      contactId: "customer_id" in row ? row.customer_id : row.supplier_id,
      documentDate: row.document_date,
      documentNumber: row.document_number,
      dueDate: row.due_date,
      label: `${row.document_number} · sisa ${row.outstanding_amount}`,
      outstanding: String(row.outstanding_amount),
      value: row.id,
    })),
  };
}

export async function getSettlementRecords(
  companyId: string,
  kind: SettlementKind,
  { page = 1, q, status }: { page?: number; q?: string; status?: string } = {},
) {
  const { supabase } = await requireUser();
  const from = (Math.max(1, page) - 1) * SETTLEMENT_PAGE_SIZE;
  const select =
    "id,document_number,amount,status,version,created_at,contacts(display_name),bank_accounts(name)";
  let query =
    kind === "customer"
      ? supabase
          .from("customer_receipts")
          .select(`${select},receipt_date`)
          .eq("company_id", companyId)
      : supabase
          .from("supplier_payments")
          .select(`${select},payment_date`)
          .eq("company_id", companyId);
  if (q) query = query.or(`document_number.ilike.%${q}%`);
  if (status) query = query.eq("status", status);
  const { data, error } = await query
    .order("created_at", { ascending: false })
    .range(from, from + SETTLEMENT_PAGE_SIZE);
  if (error) fail("Daftar pembayaran", error);
  return data ?? [];
}

export async function getSettlementRecord(
  companyId: string,
  kind: SettlementKind,
  id: string,
) {
  const { supabase } = await requireUser();
  const header =
    kind === "customer"
      ? await supabase
          .from("customer_receipts")
          .select(
            "*,contacts(code,display_name),bank_accounts(code,name),branches(code,name)",
          )
          .eq("company_id", companyId)
          .eq("id", id)
          .maybeSingle()
      : await supabase
          .from("supplier_payments")
          .select(
            "*,contacts(code,display_name),bank_accounts(code,name),branches(code,name)",
          )
          .eq("company_id", companyId)
          .eq("id", id)
          .maybeSingle();
  if (header.error) fail("Detail pembayaran", header.error);
  if (!header.data) notFound();
  const allocations =
    kind === "customer"
      ? await supabase
          .from("customer_receipt_allocations")
          .select(
            "*,accounts_receivable(document_number,due_date,original_amount,outstanding_amount)",
          )
          .eq("company_id", companyId)
          .eq("receipt_id", id)
      : await supabase
          .from("supplier_payment_allocations")
          .select(
            "*,accounts_payable(document_number,due_date,original_amount,outstanding_amount)",
          )
          .eq("company_id", companyId)
          .eq("payment_id", id);
  if (allocations.error) fail("Alokasi pembayaran", allocations.error);
  const { data: journal, error: journalError } = await supabase
    .from("journal_entries")
    .select("id,journal_number,status,posting_date")
    .eq("company_id", companyId)
    .eq(
      "source_type",
      kind === "customer" ? "customer_receipt" : "supplier_payment",
    )
    .eq("source_id", id)
    .maybeSingle();
  if (journalError) fail("Jurnal pembayaran", journalError);
  return { ...header.data, allocations: allocations.data ?? [], journal };
}
