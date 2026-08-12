import { z } from "zod";

import { requireUser } from "@/server/auth/require-user";

export const INVENTORY_PAGE_SIZE = 50;

type AdjustmentLineRecord = {
  id: string;
  line_number: number;
  product_id: string;
  products: { name: string; sku: string } | null;
  quantity: number | string;
  total_cost: number | string;
  unit_cost: number | string;
};

type ApprovalActionRecord = {
  action: string;
  comment: string | null;
  created_at: string;
};

export async function getInventoryAdjustments(
  companyId: string,
  filters: { page: number; q?: string; status?: string },
) {
  const { supabase } = await requireUser();
  const from = (filters.page - 1) * INVENTORY_PAGE_SIZE;
  let query = supabase
    .from("inventory_adjustments")
    .select(
      "id,document_number,adjustment_date,adjustment_type,status,total_cost,warehouses!inner(name)",
    )
    .eq("company_id", companyId)
    .order("adjustment_date", { ascending: false })
    .order("created_at", { ascending: false })
    .range(from, from + INVENTORY_PAGE_SIZE);
  if (filters.q) query = query.ilike("document_number", `%${filters.q}%`);
  if (filters.status) query = query.eq("status", filters.status);
  const { data, error } = await query;
  if (error) throw new Error("Daftar adjustment tidak dapat dimuat.");
  return (data ?? []).map((row) => ({
    ...row,
    warehouse: Array.isArray(row.warehouses)
      ? (row.warehouses[0]?.name ?? "—")
      : (row.warehouses as { name: string }).name,
  }));
}

export async function getInventoryOptions(companyId: string) {
  const { supabase } = await requireUser();
  const [branches, warehouses, products, accounts, balances] =
    await Promise.all([
      supabase
        .from("branches")
        .select("id,code,name")
        .eq("company_id", companyId)
        .eq("is_active", true)
        .order("code"),
      supabase
        .from("warehouses")
        .select("id,code,name,branch_id")
        .eq("company_id", companyId)
        .eq("is_active", true)
        .order("code"),
      supabase
        .from("products")
        .select("id,sku,name")
        .eq("company_id", companyId)
        .eq("product_type", "inventory")
        .eq("is_active", true)
        .order("sku"),
      supabase
        .from("chart_of_accounts")
        .select("id,code,name")
        .eq("company_id", companyId)
        .eq("is_active", true)
        .eq("allow_manual_entry", true)
        .order("code"),
      supabase
        .from("product_warehouses")
        .select("product_id,warehouse_id,quantity_on_hand")
        .eq("company_id", companyId),
    ]);
  if (
    branches.error ||
    warehouses.error ||
    products.error ||
    accounts.error ||
    balances.error
  )
    throw new Error("Pilihan adjustment tidak dapat dimuat.");
  return {
    accounts: accounts.data ?? [],
    branches: branches.data ?? [],
    balances: balances.data ?? [],
    products: products.data ?? [],
    warehouses: warehouses.data ?? [],
  };
}

export async function getInventoryOperations(
  companyId: string,
  operationType: "inventory_transfer" | "stock_count",
) {
  const { supabase } = await requireUser();
  const [operations, warehouses] = await Promise.all([
    supabase
      .from("inventory_operations")
      .select(
        "id,document_number,operation_date,source_warehouse_id,destination_warehouse_id,status,reason",
      )
      .eq("company_id", companyId)
      .eq("operation_type", operationType)
      .order("operation_date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(100),
    supabase.from("warehouses").select("id,name").eq("company_id", companyId),
  ]);
  if (operations.error || warehouses.error)
    throw new Error("Daftar operasi stok tidak dapat dimuat.");
  const names = new Map(
    (warehouses.data ?? []).map((row) => [row.id, row.name]),
  );
  return (operations.data ?? []).map((row) => ({
    ...row,
    destination: row.destination_warehouse_id
      ? names.get(row.destination_warehouse_id)
      : "—",
    source: names.get(row.source_warehouse_id) ?? "—",
  }));
}

export async function getInventoryOperation(
  companyId: string,
  operationType: "inventory_transfer" | "stock_count",
  id: string,
) {
  const { supabase } = await requireUser();
  const { data, error } = await supabase
    .from("inventory_operations")
    .select("*")
    .eq("company_id", companyId)
    .eq("operation_type", operationType)
    .eq("id", id)
    .maybeSingle();
  if (error || !data) throw new Error("Operasi stok tidak ditemukan.");
  const [lines, warehouses, account, approval, journal, reversal] =
    await Promise.all([
      supabase
        .from("inventory_operation_lines")
        .select("*,products(name,sku)")
        .eq("company_id", companyId)
        .eq("operation_id", id)
        .order("line_number"),
      supabase
        .from("warehouses")
        .select("id,name,code")
        .eq("company_id", companyId)
        .in(
          "id",
          [data.source_warehouse_id, data.destination_warehouse_id].filter(
            Boolean,
          ) as string[],
        ),
      data.offset_account_id
        ? supabase
            .from("chart_of_accounts")
            .select("id,code,name")
            .eq("company_id", companyId)
            .eq("id", data.offset_account_id)
            .single()
        : Promise.resolve({ data: null, error: null }),
      supabase
        .from("approval_requests")
        .select("id,status,approval_actions(action,comment,created_at)")
        .eq("company_id", companyId)
        .eq("document_type", operationType)
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
  if (
    lines.error ||
    warehouses.error ||
    account.error ||
    approval.error ||
    journal.error ||
    reversal.error
  ) {
    console.error("Inventory operation detail query failed", {
      account: account.error,
      approval: approval.error,
      journal: journal.error,
      lines: lines.error,
      reversal: reversal.error,
      warehouses: warehouses.error,
    });
    throw new Error("Detail operasi stok tidak dapat dimuat.");
  }
  const warehouseMap = new Map(
    (warehouses.data ?? []).map((row) => [row.id, row]),
  );
  return {
    ...data,
    account: account.data,
    approval: approval.data,
    destinationWarehouse: data.destination_warehouse_id
      ? warehouseMap.get(data.destination_warehouse_id)
      : null,
    journal: journal.data,
    lines: lines.data ?? [],
    reversalJournal: reversal.data,
    sourceWarehouse: warehouseMap.get(data.source_warehouse_id),
  };
}

export async function getInventoryAdjustment(companyId: string, id: string) {
  const { supabase } = await requireUser();
  const { data, error } = await supabase
    .from("inventory_adjustments")
    .select(
      "*,branches(name),warehouses(name),chart_of_accounts(name,code),inventory_adjustment_lines(*,products(name,sku))",
    )
    .eq("company_id", companyId)
    .eq("id", id)
    .maybeSingle();
  if (error || !data) throw new Error("Adjustment persediaan tidak ditemukan.");
  const [approval, journal, reversal] = await Promise.all([
    supabase
      .from("approval_requests")
      .select("id,status,approval_actions(action,comment,created_at)")
      .eq("company_id", companyId)
      .eq("document_type", "inventory_adjustment")
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
    approval: approval.data
      ? {
          ...approval.data,
          approval_actions: approval.data
            .approval_actions as unknown as ApprovalActionRecord[],
        }
      : null,
    journal: journal.data,
    lines: [
      ...(data.inventory_adjustment_lines as unknown as AdjustmentLineRecord[]),
    ].sort((a, b) => a.line_number - b.line_number),
    reversalJournal: reversal.data,
  };
}

const movementSchema = z.object({
  created_at: z.string(),
  id: z.uuid(),
  movement_date: z.string(),
  movement_type: z.string(),
  quantity: z.union([z.number(), z.string()]).transform(String),
  running_average_cost: z.union([z.number(), z.string()]).transform(String),
  running_quantity: z.union([z.number(), z.string()]).transform(String),
  source_id: z.uuid(),
  source_type: z.string(),
  total_cost: z.union([z.number(), z.string()]).transform(String),
  unit_cost: z.union([z.number(), z.string()]).transform(String),
});

export async function getStockCard(companyId: string, balanceId: string) {
  const { supabase } = await requireUser();
  const { data: balance, error } = await supabase
    .from("product_warehouses")
    .select("*,products(name,sku),warehouses(name,code)")
    .eq("company_id", companyId)
    .eq("id", balanceId)
    .maybeSingle();
  if (error || !balance) throw new Error("Saldo stok tidak ditemukan.");
  const { data, error: movementError } = await supabase
    .from("inventory_movements")
    .select(
      "id,movement_date,movement_type,quantity,unit_cost,total_cost,running_quantity,running_average_cost,source_type,source_id,created_at",
    )
    .eq("company_id", companyId)
    .eq("product_id", balance.product_id)
    .eq("warehouse_id", balance.warehouse_id)
    .order("movement_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(250);
  if (movementError) throw new Error("Kartu stok tidak dapat dimuat.");
  const parsed = z.array(movementSchema).safeParse(data);
  if (!parsed.success) throw new Error("Data kartu stok tidak valid.");
  return { balance, movements: parsed.data };
}
