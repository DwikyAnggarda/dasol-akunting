import { z } from "zod";

import { requireUser } from "@/server/auth/require-user";

const accountSchema = z.object({
  account_type: z.string(),
  code: z.string(),
  id: z.uuid(),
  is_active: z.boolean(),
  name: z.string(),
  normal_balance: z.string(),
});
export type AccountRow = {
  accountType: string;
  code: string;
  id: string;
  name: string;
  normalBalance: string;
  status: string;
};

const invoiceSchema = z.object({
  document_date: z.string(),
  document_number: z.string(),
  due_date: z.string(),
  id: z.uuid(),
  outstanding_balance: z.union([z.string(), z.number()]).transform(String),
  status: z.string(),
  total: z.union([z.string(), z.number()]).transform(String),
  contacts: z.object({ display_name: z.string() }),
});
export type InvoiceRow = {
  contact: string;
  date: string;
  documentNumber: string;
  dueDate: string;
  id: string;
  outstanding: string;
  status: string;
  total: string;
};

const journalSchema = z.object({
  description: z.string(),
  id: z.uuid(),
  journal_number: z.string(),
  posting_date: z.string(),
  source_type: z.string(),
  status: z.string(),
  total_debit: z.union([z.string(), z.number()]).transform(String),
});
export type JournalRow = {
  amount: string;
  date: string;
  description: string;
  id: string;
  number: string;
  source: string;
  status: string;
};

const stockSchema = z.object({
  average_cost: z.union([z.string(), z.number()]).transform(String),
  id: z.uuid(),
  inventory_value: z.union([z.string(), z.number()]).transform(String),
  quantity_on_hand: z.union([z.string(), z.number()]).transform(String),
  products: z.object({ name: z.string(), sku: z.string() }),
  warehouses: z.object({ name: z.string() }),
});
export type StockRow = {
  averageCost: string;
  id: string;
  product: string;
  quantity: string;
  sku: string;
  value: string;
  warehouse: string;
};

const approvalSchema = z.object({
  document_id: z.uuid(),
  document_number: z.string(),
  document_type: z.string(),
  id: z.uuid(),
  status: z.string(),
  submitted_at: z.string(),
});
export type ApprovalRow = {
  documentId: string;
  documentNumber: string;
  documentType: string;
  id: string;
  status: string;
  submittedAt: string;
};

const auditSchema = z.object({
  action: z.string(),
  created_at: z.string(),
  document_number: z.string().nullable(),
  entity_type: z.string(),
  entity_id: z.uuid().nullable(),
  id: z.uuid(),
  reason: z.string().nullable(),
});
export type AuditRow = {
  action: string;
  createdAt: string;
  documentNumber: string;
  entityType: string;
  entityId: string;
  id: string;
  reason: string;
};

function parseRows<Schema extends z.ZodType>(
  schema: Schema,
  data: unknown,
  message: string,
): z.infer<Schema>[] {
  const parsed = z.array(schema).safeParse(data);
  if (!parsed.success) throw new Error(message);
  return parsed.data;
}

export async function getAccounts(companyId: string): Promise<AccountRow[]> {
  const { supabase } = await requireUser();
  const { data, error } = await supabase
    .from("chart_of_accounts")
    .select("id, code, name, account_type, normal_balance, is_active")
    .eq("company_id", companyId)
    .order("code")
    .limit(250);
  if (error) throw new Error("Daftar akun tidak dapat dimuat.");
  return parseRows(accountSchema, data, "Data akun tidak valid.").map(
    (row) => ({
      accountType: row.account_type,
      code: row.code,
      id: row.id,
      name: row.name,
      normalBalance: row.normal_balance,
      status: row.is_active ? "active" : "inactive",
    }),
  );
}

async function getInvoices(
  companyId: string,
  kind: "purchase" | "sales",
): Promise<InvoiceRow[]> {
  const { supabase } = await requireUser();
  const table = kind === "sales" ? "sales_invoices" : "purchase_invoices";
  const { data, error } = await supabase
    .from(table)
    .select(
      "id, document_number, document_date, due_date, status, total, outstanding_balance, contacts(display_name)",
    )
    .eq("company_id", companyId)
    .order("document_date", { ascending: false })
    .limit(100);
  if (error) {
    console.error("Invoice list query failed", {
      code: error.code,
      details: error.details,
      hint: error.hint,
      kind,
      message: error.message,
    });
    throw new Error(
      `Invoice ${kind === "sales" ? "penjualan" : "pembelian"} tidak dapat dimuat.`,
    );
  }
  return parseRows(invoiceSchema, data, "Data invoice tidak valid.").map(
    (row) => ({
      contact: row.contacts.display_name,
      date: row.document_date,
      documentNumber: row.document_number,
      dueDate: row.due_date,
      id: row.id,
      outstanding: row.outstanding_balance,
      status: row.status,
      total: row.total,
    }),
  );
}

export const getSalesInvoices = (companyId: string) =>
  getInvoices(companyId, "sales");
export const getPurchaseInvoices = (companyId: string) =>
  getInvoices(companyId, "purchase");

export async function getJournals(companyId: string): Promise<JournalRow[]> {
  const { supabase } = await requireUser();
  const { data, error } = await supabase
    .from("journal_entries")
    .select(
      "id, journal_number, posting_date, description, source_type, status, total_debit",
    )
    .eq("company_id", companyId)
    .order("posting_date", { ascending: false })
    .limit(100);
  if (error) throw new Error("Jurnal tidak dapat dimuat.");
  return parseRows(journalSchema, data, "Data jurnal tidak valid.").map(
    (row) => ({
      amount: row.total_debit,
      date: row.posting_date,
      description: row.description,
      id: row.id,
      number: row.journal_number,
      source: row.source_type,
      status: row.status,
    }),
  );
}

export async function getStock(companyId: string): Promise<StockRow[]> {
  const { supabase } = await requireUser();
  const { data, error } = await supabase
    .from("product_warehouses")
    .select(
      "id, quantity_on_hand, average_cost, inventory_value, products!inner(sku,name), warehouses!inner(name)",
    )
    .eq("company_id", companyId)
    .order("updated_at", { ascending: false })
    .limit(250);
  if (error) throw new Error("Saldo persediaan tidak dapat dimuat.");
  return parseRows(stockSchema, data, "Data persediaan tidak valid.").map(
    (row) => ({
      averageCost: row.average_cost,
      id: row.id,
      product: row.products.name,
      quantity: row.quantity_on_hand,
      sku: row.products.sku,
      value: row.inventory_value,
      warehouse: row.warehouses.name,
    }),
  );
}

export async function getApprovals(companyId: string): Promise<ApprovalRow[]> {
  const { supabase } = await requireUser();
  const { data, error } = await supabase
    .from("approval_requests")
    .select(
      "id, document_id, document_type, document_number, status, submitted_at",
    )
    .eq("company_id", companyId)
    .order("submitted_at", { ascending: false })
    .limit(100);
  if (error) throw new Error("Antrean persetujuan tidak dapat dimuat.");
  return parseRows(approvalSchema, data, "Data persetujuan tidak valid.").map(
    (row) => ({
      documentId: row.document_id,
      documentNumber: row.document_number,
      documentType: row.document_type,
      id: row.id,
      status: row.status,
      submittedAt: row.submitted_at,
    }),
  );
}

export async function getAuditLogs(companyId: string): Promise<AuditRow[]> {
  const { supabase } = await requireUser();
  const { data, error } = await supabase
    .from("audit_logs")
    .select(
      "id, action, entity_type, entity_id, document_number, reason, created_at",
    )
    .eq("company_id", companyId)
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw new Error("Audit log tidak dapat dimuat.");
  return parseRows(auditSchema, data, "Data audit tidak valid.").map((row) => ({
    action: row.action,
    createdAt: row.created_at,
    documentNumber: row.document_number ?? "—",
    entityType: row.entity_type,
    entityId: row.entity_id ?? "",
    id: row.id,
    reason: row.reason ?? "—",
  }));
}
