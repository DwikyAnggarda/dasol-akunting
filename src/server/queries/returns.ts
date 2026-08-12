import { requireUser } from "@/server/auth/require-user";
import type { ReturnKind } from "@/features/returns/schemas";
export async function getReturnDocuments(companyId: string, kind: ReturnKind) {
  const { supabase } = await requireUser();
  const { data, error } = await supabase
    .from("return_documents")
    .select(
      "id,document_number,return_date,total,status,contacts(display_name)",
    )
    .eq("company_id", companyId)
    .eq("return_type", kind)
    .order("return_date", { ascending: false })
    .limit(100);
  if (error) throw new Error("Daftar retur tidak dapat dimuat.");
  return data ?? [];
}
export async function getReturnOptions(companyId: string, kind: ReturnKind) {
  const { supabase } = await requireUser();
  const invoices =
    kind === "sales_return"
      ? await supabase
          .from("sales_invoices")
          .select(
            "id,document_number,document_date,contacts(display_name),sales_invoice_lines(id,product_id,warehouse_id,description,quantity,unit_price,products(name,sku,product_type))",
          )
          .eq("company_id", companyId)
          .in("status", ["posted", "partially_paid", "paid"])
          .order("document_date", { ascending: false })
          .limit(100)
      : await supabase
          .from("purchase_invoices")
          .select(
            "id,document_number,document_date,contacts(display_name),purchase_invoice_lines(id,product_id,warehouse_id,description,quantity,unit_cost,products(name,sku,product_type))",
          )
          .eq("company_id", companyId)
          .in("status", ["posted", "partially_paid", "paid"])
          .order("document_date", { ascending: false })
          .limit(100);
  const warehouses = await supabase
    .from("warehouses")
    .select("id,code,name")
    .eq("company_id", companyId)
    .eq("is_active", true)
    .order("code");
  if (invoices.error || warehouses.error)
    throw new Error("Pilihan retur tidak dapat dimuat.");
  return { invoices: invoices.data ?? [], warehouses: warehouses.data ?? [] };
}
export async function getReturnDocument(
  companyId: string,
  kind: ReturnKind,
  id: string,
) {
  const { supabase } = await requireUser();
  const { data, error } = await supabase
    .from("return_documents")
    .select(
      "*,contacts(display_name,code),branches(name,code),return_document_lines(*,products(name,sku,product_type),warehouses(name,code))",
    )
    .eq("company_id", companyId)
    .eq("return_type", kind)
    .eq("id", id)
    .maybeSingle();
  if (error || !data) throw new Error("Retur tidak ditemukan.");
  const [approval, journal, reversal] = await Promise.all([
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
  ]);
  return {
    ...data,
    approval: approval.data,
    journal: journal.data,
    lines: data.return_document_lines,
    reversalJournal: reversal.data,
  };
}
