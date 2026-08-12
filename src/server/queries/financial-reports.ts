import Decimal from "decimal.js";

import { requireUser } from "@/server/auth/require-user";

export const financialReportTypes = [
  "general-ledger",
  "trial-balance",
  "profit-loss",
  "balance-sheet",
  "cash-flow",
  "ar-aging",
  "ap-aging",
  "tax",
] as const;
export type FinancialReportType = (typeof financialReportTypes)[number];
export type FinancialReportRow = {
  balance: string;
  credit: string;
  debit: string;
  detail: string;
  href?: string;
  id: string;
  label: string;
};

type LedgerLine = {
  accountId: string;
  accountType: string;
  cashFlowCategory: string | null;
  code: string;
  credit: Decimal;
  debit: Decimal;
  description: string;
  entryDescription: string;
  journalId: string;
  journalNumber: string;
  name: string;
  postingDate: string;
};
const d = (value: unknown) => new Decimal(String(value ?? 0));
function relation<T>(value: T | T[] | null): T | null {
  return Array.isArray(value) ? (value[0] ?? null) : value;
}
function fail(scope: string, error: unknown): never {
  console.error(`${scope} report query failed`, error);
  throw new Error(`${scope} tidak dapat dimuat.`);
}

async function ledgerLines(companyId: string, from: string, to: string) {
  const { supabase } = await requireUser();
  const { data, error } = await supabase
    .from("journal_entries")
    .select(
      "id,journal_number,posting_date,description,journal_lines(id,account_id,description,debit,credit,chart_of_accounts(code,name,account_type,cash_flow_category))",
    )
    .eq("company_id", companyId)
    .eq("status", "posted")
    .gte("posting_date", from)
    .lte("posting_date", to)
    .order("posting_date")
    .limit(10000);
  if (error) fail("Ledger", error);
  const rows: LedgerLine[] = [];
  for (const entry of data ?? []) {
    for (const line of entry.journal_lines ?? []) {
      const account = relation(line.chart_of_accounts);
      if (!account) continue;
      rows.push({
        accountId: line.account_id,
        accountType: account.account_type,
        cashFlowCategory: account.cash_flow_category,
        code: account.code,
        credit: d(line.credit),
        debit: d(line.debit),
        description: line.description,
        entryDescription: entry.description,
        journalId: entry.id,
        journalNumber: entry.journal_number,
        name: account.name,
        postingDate: entry.posting_date,
      });
    }
  }
  return rows;
}
function grouped(
  lines: LedgerLine[],
  filter: (line: LedgerLine) => boolean,
  balance: (debit: Decimal, credit: Decimal, line: LedgerLine) => Decimal,
) {
  const map = new Map<
    string,
    { credit: Decimal; debit: Decimal; line: LedgerLine }
  >();
  for (const line of lines.filter(filter)) {
    const current = map.get(line.accountId) ?? {
      credit: new Decimal(0),
      debit: new Decimal(0),
      line,
    };
    current.credit = current.credit.add(line.credit);
    current.debit = current.debit.add(line.debit);
    map.set(line.accountId, current);
  }
  return [...map.values()]
    .sort((a, b) => a.line.code.localeCompare(b.line.code))
    .map(({ credit, debit, line }) => ({
      balance: balance(debit, credit, line).toString(),
      credit: credit.toString(),
      debit: debit.toString(),
      detail: line.accountType,
      id: line.accountId,
      label: `${line.code} — ${line.name}`,
    }));
}

async function aging(companyId: string, kind: "ar" | "ap", to: string) {
  const { supabase } = await requireUser();
  const result =
    kind === "ar"
      ? await supabase
          .from("accounts_receivable")
          .select(
            "id,document_number,document_date,due_date,outstanding_amount,status,contacts(display_name),sales_invoice_id",
          )
          .eq("company_id", companyId)
          .gt("outstanding_amount", 0)
          .lte("document_date", to)
          .order("due_date")
      : await supabase
          .from("accounts_payable")
          .select(
            "id,document_number,document_date,due_date,outstanding_amount,status,contacts(display_name),purchase_invoice_id",
          )
          .eq("company_id", companyId)
          .gt("outstanding_amount", 0)
          .lte("document_date", to)
          .order("due_date");
  if (result.error) fail(kind === "ar" ? "AR aging" : "AP aging", result.error);
  const asOf = new Date(`${to}T00:00:00Z`).getTime();
  return (result.data ?? []).map((row) => {
    const days = Math.floor(
      (asOf - new Date(`${row.due_date}T00:00:00Z`).getTime()) / 86400000,
    );
    const bucket =
      days <= 0
        ? "Belum jatuh tempo"
        : days <= 30
          ? "1–30 hari"
          : days <= 60
            ? "31–60 hari"
            : days <= 90
              ? "61–90 hari"
              : "> 90 hari";
    const contact = relation(row.contacts);
    const invoiceId =
      "sales_invoice_id" in row
        ? row.sales_invoice_id
        : row.purchase_invoice_id;
    return {
      balance: String(row.outstanding_amount),
      credit: "0",
      debit: "0",
      detail: `${contact?.display_name ?? "—"} · ${bucket}`,
      href: `${kind === "ar" ? "/sales" : "/purchases"}/invoices/${invoiceId}`,
      id: row.id,
      label: row.document_number,
    };
  });
}

async function taxReport(companyId: string, from: string, to: string) {
  const { supabase } = await requireUser();
  const [invoices, taxes] = await Promise.all([
    Promise.all([
      supabase
        .from("sales_invoices")
        .select("id,document_number,document_date")
        .eq("company_id", companyId)
        .in("status", ["posted", "partially_paid", "paid", "reversed"])
        .gte("document_date", from)
        .lte("document_date", to),
      supabase
        .from("purchase_invoices")
        .select("id,document_number,document_date")
        .eq("company_id", companyId)
        .in("status", ["posted", "partially_paid", "paid", "reversed"])
        .gte("document_date", from)
        .lte("document_date", to),
    ]),
    supabase
      .from("document_line_taxes")
      .select(
        "id,document_type,document_id,tax_base,rate,tax_amount,tax_codes(code,name)",
      )
      .eq("company_id", companyId),
  ]);
  const [sales, purchases] = invoices;
  if (sales.error || purchases.error || taxes.error)
    fail("Laporan pajak", sales.error ?? purchases.error ?? taxes.error);
  const docs = new Map<string, { date: string; number: string }>();
  for (const row of [...(sales.data ?? []), ...(purchases.data ?? [])])
    docs.set(row.id, { date: row.document_date, number: row.document_number });
  return (taxes.data ?? [])
    .filter((row) => docs.has(row.document_id))
    .map((row) => {
      const code = relation(row.tax_codes);
      const doc = docs.get(row.document_id)!;
      return {
        balance: String(row.tax_amount),
        credit:
          row.document_type === "sales_invoice" ? String(row.tax_amount) : "0",
        debit:
          row.document_type === "purchase_invoice"
            ? String(row.tax_amount)
            : "0",
        detail: `${doc.date} · ${code?.code ?? "Pajak"} ${row.rate}% · DPP ${row.tax_base}`,
        href: `${row.document_type === "sales_invoice" ? "/sales" : "/purchases"}/invoices/${row.document_id}`,
        id: row.id,
        label: doc.number,
      };
    });
}

export async function getFinancialReport(
  companyId: string,
  type: FinancialReportType,
  from: string,
  to: string,
): Promise<FinancialReportRow[]> {
  if (type === "ar-aging") return aging(companyId, "ar", to);
  if (type === "ap-aging") return aging(companyId, "ap", to);
  if (type === "tax") return taxReport(companyId, from, to);
  const start =
    type === "trial-balance" || type === "balance-sheet" ? "1900-01-01" : from;
  const lines = await ledgerLines(companyId, start, to);
  if (type === "general-ledger")
    return lines.map((line, index) => ({
      balance: line.debit.minus(line.credit).toString(),
      credit: line.credit.toString(),
      debit: line.debit.toString(),
      detail: `${line.postingDate} · ${line.journalNumber} · ${line.description}`,
      href: `/accounting/journals/${line.journalId}`,
      id: `${line.journalId}-${index}`,
      label: `${line.code} — ${line.name}`,
    }));
  if (type === "trial-balance")
    return grouped(
      lines,
      () => true,
      (debit, credit) => debit.minus(credit),
    );
  if (type === "profit-loss")
    return grouped(
      lines,
      (line) =>
        [
          "revenue",
          "other_income",
          "cost_of_goods_sold",
          "expense",
          "other_expense",
        ].includes(line.accountType),
      (debit, credit, line) =>
        ["revenue", "other_income"].includes(line.accountType)
          ? credit.minus(debit)
          : debit.minus(credit),
    );
  if (type === "balance-sheet")
    return grouped(
      lines,
      (line) => ["asset", "liability", "equity"].includes(line.accountType),
      (debit, credit, line) =>
        line.accountType === "asset"
          ? debit.minus(credit)
          : credit.minus(debit),
    );
  return grouped(
    lines,
    (line) => Boolean(line.cashFlowCategory),
    (debit, credit) => debit.minus(credit),
  ).map((row) => ({
    ...row,
    detail: `Arus kas ${lines.find((line) => line.accountId === row.id)?.cashFlowCategory ?? "lainnya"}`,
  }));
}
