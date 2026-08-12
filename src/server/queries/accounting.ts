import { notFound } from "next/navigation";
import { requireUser } from "@/server/auth/require-user";
function fail(scope: string, error: unknown): never {
  console.error(`${scope} query failed`, error);
  throw new Error(`${scope} tidak dapat dimuat.`);
}
export async function getJournalOptions(companyId: string) {
  const { supabase } = await requireUser();
  const [accounts, branches] = await Promise.all([
    supabase
      .from("chart_of_accounts")
      .select("id,code,name")
      .eq("company_id", companyId)
      .eq("is_active", true)
      .eq("allow_manual_entry", true)
      .eq("is_control_account", false)
      .order("code"),
    supabase
      .from("branches")
      .select("id,code,name")
      .eq("company_id", companyId)
      .eq("is_active", true)
      .order("code"),
  ]);
  if (accounts.error || branches.error)
    fail("Pilihan jurnal", accounts.error ?? branches.error);
  return {
    accounts: (accounts.data ?? []).map((row) => ({
      label: `${row.code} — ${row.name}`,
      value: row.id,
    })),
    branches: (branches.data ?? []).map((row) => ({
      label: `${row.code} — ${row.name}`,
      value: row.id,
    })),
  };
}
export async function getJournalRecords(
  companyId: string,
  { page = 1, q, status }: { page?: number; q?: string; status?: string } = {},
) {
  const { supabase } = await requireUser();
  let query = supabase
    .from("journal_entries")
    .select(
      "id,journal_number,posting_date,description,source_type,status,total_debit,version",
    )
    .eq("company_id", companyId);
  if (q)
    query = query.or(`journal_number.ilike.%${q}%,description.ilike.%${q}%`);
  if (status) query = query.eq("status", status);
  const from = (Math.max(1, page) - 1) * 50;
  const { data, error } = await query
    .order("posting_date", { ascending: false })
    .order("created_at", { ascending: false })
    .range(from, from + 50);
  if (error) fail("Jurnal", error);
  return data ?? [];
}
export async function getJournalRecord(companyId: string, id: string) {
  const { supabase } = await requireUser();
  const [entry, lines, reversal] = await Promise.all([
    supabase
      .from("journal_entries")
      .select("*,branches(code,name)")
      .eq("company_id", companyId)
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("journal_lines")
      .select("*,chart_of_accounts(code,name)")
      .eq("company_id", companyId)
      .eq("journal_entry_id", id)
      .order("line_number"),
    supabase
      .from("journal_reversals")
      .select("*")
      .eq("company_id", companyId)
      .eq("original_journal_id", id)
      .maybeSingle(),
  ]);
  if (entry.error || lines.error || reversal.error)
    fail("Detail jurnal", entry.error ?? lines.error ?? reversal.error);
  if (!entry.data) notFound();
  let reversalJournal: { journal_number: string; posting_date: string } | null =
    null;
  if (reversal.data) {
    const result = await supabase
      .from("journal_entries")
      .select("journal_number,posting_date")
      .eq("company_id", companyId)
      .eq("id", reversal.data.reversal_journal_id)
      .maybeSingle();
    if (result.error) fail("Jurnal pembalik", result.error);
    reversalJournal = result.data;
  }
  return {
    ...entry.data,
    lines: lines.data ?? [],
    reversal: reversal.data
      ? { ...reversal.data, journal_entries: reversalJournal }
      : null,
  };
}
export async function getAccountingPeriods(companyId: string) {
  const { supabase } = await requireUser();
  const { data, error } = await supabase
    .from("accounting_periods")
    .select(
      "id,period_number,starts_on,ends_on,status,closed_at,reopened_at,version,fiscal_years(name)",
    )
    .eq("company_id", companyId)
    .order("starts_on", { ascending: false })
    .limit(36);
  if (error) fail("Periode akuntansi", error);
  return data ?? [];
}
