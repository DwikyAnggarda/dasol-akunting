import { requireUser } from "@/server/auth/require-user";
export async function getCashOptions(companyId: string) {
  const { supabase } = await requireUser();
  const [branches, banks, accounts] = await Promise.all([
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
      .from("chart_of_accounts")
      .select("id,code,name")
      .eq("company_id", companyId)
      .eq("is_active", true)
      .eq("allow_manual_entry", true)
      .order("code"),
  ]);
  if (branches.error || banks.error || accounts.error)
    throw new Error("Pilihan transaksi kas tidak dapat dimuat.");
  return {
    accounts: accounts.data ?? [],
    banks: banks.data ?? [],
    branches: branches.data ?? [],
  };
}
export async function getCashTransactions(companyId: string) {
  const { supabase } = await requireUser();
  const { data, error } = await supabase
    .from("cash_transactions")
    .select(
      "id,document_number,transaction_date,transaction_type,amount,status,description,bank_accounts!cash_transactions_company_id_bank_account_id_fkey(name)",
    )
    .eq("company_id", companyId)
    .order("transaction_date", { ascending: false })
    .limit(100);
  if (error) throw new Error("Transaksi kas tidak dapat dimuat.");
  return data ?? [];
}
export async function getCashTransaction(companyId: string, id: string) {
  const { supabase } = await requireUser();
  const { data, error } = await supabase
    .from("cash_transactions")
    .select(
      "*,branches(name),source:bank_accounts!cash_transactions_company_id_bank_account_id_fkey(name,code),destination:bank_accounts!cash_transactions_company_id_destination_bank_account_id_fkey(name,code),offset:chart_of_accounts(name,code)",
    )
    .eq("company_id", companyId)
    .eq("id", id)
    .maybeSingle();
  if (error || !data) throw new Error("Transaksi kas tidak ditemukan.");
  const [approval, journal, reversal] = await Promise.all([
    supabase
      .from("approval_requests")
      .select("id,status,approval_actions(action,comment,created_at)")
      .eq("company_id", companyId)
      .eq("document_type", "cash_transaction")
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
    reversalJournal: reversal.data,
  };
}
