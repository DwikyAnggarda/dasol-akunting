import { requireUser } from "@/server/auth/require-user";
export async function getReconciliationOptions(companyId: string) {
  const { supabase } = await requireUser();
  const [banks, accounts] = await Promise.all([
    supabase
      .from("bank_accounts")
      .select("id,code,name")
      .eq("company_id", companyId)
      .eq("is_active", true)
      .order("code"),
    supabase
      .from("chart_of_accounts")
      .select("id,code,name")
      .eq("company_id", companyId)
      .eq("is_active", true)
      .eq("allow_manual_entry", true)
      .order("code"),
  ]);
  if (banks.error || accounts.error)
    throw new Error("Pilihan rekonsiliasi tidak dapat dimuat.");
  return { accounts: accounts.data ?? [], banks: banks.data ?? [] };
}
export async function getReconciliations(companyId: string) {
  const { supabase } = await requireUser();
  const { data, error } = await supabase
    .from("bank_reconciliations")
    .select(
      "id,statement_date,opening_balance,closing_balance,status,bank_accounts(name,code)",
    )
    .eq("company_id", companyId)
    .order("statement_date", { ascending: false })
    .limit(100);
  if (error) throw new Error("Daftar rekonsiliasi tidak dapat dimuat.");
  return data ?? [];
}
export async function getReconciliation(companyId: string, id: string) {
  const { supabase } = await requireUser();
  const { data, error } = await supabase
    .from("bank_reconciliations")
    .select("*,bank_accounts(name,code)")
    .eq("company_id", companyId)
    .eq("id", id)
    .maybeSingle();
  if (error || !data) throw new Error("Rekonsiliasi tidak ditemukan.");
  const [lines, receipts, payments, cash, accounts] = await Promise.all([
    supabase
      .from("bank_statement_lines")
      .select("*")
      .eq("company_id", companyId)
      .eq("reconciliation_id", id)
      .order("line_number"),
    supabase
      .from("customer_receipts")
      .select("id,document_number,receipt_date,amount")
      .eq("company_id", companyId)
      .eq("bank_account_id", data.bank_account_id)
      .eq("status", "posted")
      .limit(250),
    supabase
      .from("supplier_payments")
      .select("id,document_number,payment_date,amount")
      .eq("company_id", companyId)
      .eq("bank_account_id", data.bank_account_id)
      .eq("status", "posted")
      .limit(250),
    supabase
      .from("cash_transactions")
      .select(
        "id,document_number,transaction_date,transaction_type,amount,bank_account_id,destination_bank_account_id",
      )
      .eq("company_id", companyId)
      .eq("status", "posted")
      .or(
        `bank_account_id.eq.${data.bank_account_id},destination_bank_account_id.eq.${data.bank_account_id}`,
      )
      .limit(250),
    supabase
      .from("chart_of_accounts")
      .select("id,code,name")
      .eq("company_id", companyId)
      .eq("is_active", true)
      .eq("allow_manual_entry", true)
      .order("code"),
  ]);
  if (
    lines.error ||
    receipts.error ||
    payments.error ||
    cash.error ||
    accounts.error
  )
    throw new Error("Detail rekonsiliasi tidak dapat dimuat.");
  const candidates = [
    ...(receipts.data ?? []).map((row) => ({
      amount: Number(row.amount),
      date: row.receipt_date,
      id: row.id,
      label: `${row.document_number} · +${row.amount}`,
      type: "customer_receipt",
    })),
    ...(payments.data ?? []).map((row) => ({
      amount: -Number(row.amount),
      date: row.payment_date,
      id: row.id,
      label: `${row.document_number} · -${row.amount}`,
      type: "supplier_payment",
    })),
    ...(cash.data ?? []).map((row) => {
      const incoming =
        row.transaction_type === "cash_in" ||
        (row.transaction_type === "bank_transfer" &&
          row.destination_bank_account_id === data.bank_account_id);
      return {
        amount: incoming ? Number(row.amount) : -Number(row.amount),
        date: row.transaction_date,
        id: row.id,
        label: `${row.document_number} · ${incoming ? "+" : "-"}${row.amount}`,
        type: "cash_transaction",
      };
    }),
  ];
  return {
    ...data,
    accounts: accounts.data ?? [],
    candidates,
    lines: lines.data ?? [],
  };
}
