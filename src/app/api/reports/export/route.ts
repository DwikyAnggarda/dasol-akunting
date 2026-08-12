import { NextResponse } from "next/server";
import { requireCompanyPermission } from "@/server/auth/require-permission";
import {
  financialReportTypes,
  getFinancialReport,
  type FinancialReportType,
} from "@/server/queries/financial-reports";
const cell = (value: unknown) => {
  let text = String(value ?? "");
  if (/^[=+\-@]/.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
};
export async function GET(request: Request) {
  const url = new URL(request.url);
  const report = url.searchParams.get("report") ?? "";
  if (!financialReportTypes.includes(report as FinancialReportType))
    return NextResponse.json(
      { error: "Laporan tidak dikenal." },
      { status: 404 },
    );
  const from = url.searchParams.get("from") ?? "1900-01-01",
    to = url.searchParams.get("to") ?? new Date().toISOString().slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to))
    return NextResponse.json(
      { error: "Rentang tanggal tidak valid." },
      { status: 400 },
    );
  const context = await requireCompanyPermission("report.export");
  const readPermission =
    report === "tax" ? "report.tax.read" : "report.financial.read";
  if (!context.permissions.includes(readPermission)) {
    return NextResponse.json(
      { error: "Anda tidak memiliki izin membaca laporan tersebut." },
      { status: 403 },
    );
  }
  const rows = await getFinancialReport(
    context.companyId,
    report as FinancialReportType,
    from,
    to,
  );
  const columns = ["label", "detail", "debit", "credit", "balance"] as const;
  const csv = [
    columns.map(cell).join(","),
    ...rows.map((row) => columns.map((key) => cell(row[key])).join(",")),
  ].join("\r\n");
  return new Response(`\uFEFF${csv}`, {
    headers: {
      "Cache-Control": "no-store",
      "Content-Disposition": `attachment; filename="dasol-${report}-${from}-${to}.csv"`,
      "Content-Type": "text/csv; charset=utf-8",
    },
  });
}
