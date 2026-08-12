import { requireUser } from "@/server/auth/require-user";
import type { OperationalKind } from "@/features/operations/schemas";
export async function getOperationalOptions(
  companyId: string,
  kind: OperationalKind,
) {
  const { supabase } = await requireUser();
  const domain = kind.startsWith("sales") ? "sales" : "purchase";
  const [branches, contacts, products, warehouses] = await Promise.all([
    supabase
      .from("branches")
      .select("id,code,name")
      .eq("company_id", companyId)
      .eq("is_active", true)
      .order("code"),
    supabase
      .from("contacts")
      .select("id,code,display_name")
      .eq("company_id", companyId)
      .eq("is_active", true)
      .in(
        "contact_type",
        domain === "sales" ? ["customer", "both"] : ["supplier", "both"],
      )
      .order("code"),
    supabase
      .from("products")
      .select("id,sku,name,sales_price,purchase_price")
      .eq("company_id", companyId)
      .eq("product_type", "inventory")
      .eq("is_active", true)
      .order("sku"),
    supabase
      .from("warehouses")
      .select("id,code,name,branch_id")
      .eq("company_id", companyId)
      .eq("is_active", true)
      .order("code"),
  ]);
  if (branches.error || contacts.error || products.error || warehouses.error)
    throw new Error("Pilihan dokumen tidak dapat dimuat.");
  return {
    branches: branches.data ?? [],
    contacts: contacts.data ?? [],
    products: products.data ?? [],
    warehouses: warehouses.data ?? [],
  };
}
export async function getOperationalDocuments(
  companyId: string,
  kind: OperationalKind,
) {
  const { supabase } = await requireUser();
  const { data, error } = await supabase
    .from("operational_documents")
    .select(
      "id,document_number,document_date,total,status,contacts!inner(display_name),branches!inner(name)",
    )
    .eq("company_id", companyId)
    .eq("document_type", kind)
    .order("document_date", { ascending: false })
    .limit(100);
  if (error) throw new Error("Daftar dokumen operasional tidak dapat dimuat.");
  return data ?? [];
}
export async function getOperationalDocument(
  companyId: string,
  kind: OperationalKind,
  id: string,
) {
  const { supabase } = await requireUser();
  const { data, error } = await supabase
    .from("operational_documents")
    .select(
      "*,contacts(display_name,code),branches(name,code),operational_document_lines(*,products(name,sku),warehouses(name,code))",
    )
    .eq("company_id", companyId)
    .eq("document_type", kind)
    .eq("id", id)
    .maybeSingle();
  if (error || !data) throw new Error("Dokumen operasional tidak ditemukan.");
  const [approval, journal, reversal, source] = await Promise.all([
    supabase
      .from("approval_requests")
      .select("id,status,approval_actions(action,comment,created_at)")
      .eq("company_id", companyId)
      .eq("document_type", kind)
      .eq("document_id", id)
      .maybeSingle(),
    data.journal_entry_id
      ? supabase
          .from("journal_entries")
          .select("id,journal_number,status")
          .eq("id", data.journal_entry_id)
          .single()
      : Promise.resolve({ data: null, error: null }),
    data.reversal_journal_id
      ? supabase
          .from("journal_entries")
          .select("id,journal_number,status")
          .eq("id", data.reversal_journal_id)
          .single()
      : Promise.resolve({ data: null, error: null }),
    data.source_document_id
      ? supabase
          .from("operational_documents")
          .select("document_number")
          .eq("company_id", companyId)
          .eq("id", data.source_document_id)
          .single()
      : Promise.resolve({ data: null, error: null }),
  ]);
  return {
    ...data,
    approval: approval.data,
    journal: journal.data,
    lines: [...data.operational_document_lines].sort(
      (a, b) => a.line_number - b.line_number,
    ),
    reversalJournal: reversal.data,
    source: source.data,
  };
}
