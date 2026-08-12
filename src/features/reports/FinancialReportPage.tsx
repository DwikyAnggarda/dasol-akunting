import Decimal from "decimal.js";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EntityPage } from "@/components/common/EntityPage";
import { formatIDR } from "@/domain/money";
import { requireCompanyPermission } from "@/server/auth/require-permission";
import {
  financialReportTypes,
  getFinancialReport,
  type FinancialReportType,
} from "@/server/queries/financial-reports";
const titles: Record<FinancialReportType, string> = {
  "ap-aging": "Umur Utang",
  "ar-aging": "Umur Piutang",
  "balance-sheet": "Neraca",
  "cash-flow": "Arus Kas",
  "general-ledger": "Buku Besar",
  "profit-loss": "Laba Rugi",
  tax: "Laporan Pajak",
  "trial-balance": "Neraca Saldo",
};
const validDate = (value: string | undefined, fallback: string) =>
  value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : fallback;
export async function FinancialReportPage({
  report,
  searchParams,
}: {
  report: string;
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  if (!financialReportTypes.includes(report as FinancialReportType)) notFound();
  const type = report as FinancialReportType;
  const params = await searchParams;
  const now = new Date();
  const to = validDate(params.to, now.toISOString().slice(0, 10));
  const from = validDate(params.from, `${now.getUTCFullYear()}-01-01`);
  const context = await requireCompanyPermission(
    type === "tax" ? "report.tax.read" : "report.financial.read",
  );
  const rows = await getFinancialReport(context.companyId, type, from, to);
  const totals = rows.reduce(
    (result, row) => ({
      balance: result.balance.add(row.balance),
      credit: result.credit.add(row.credit),
      debit: result.debit.add(row.debit),
    }),
    { balance: new Decimal(0), credit: new Decimal(0), debit: new Decimal(0) },
  );
  const input =
    "h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm dark:border-gray-700 dark:bg-gray-900";
  return (
    <EntityPage
      description={`Data posted perusahaan aktif untuk periode ${from} sampai ${to}.`}
      title={titles[type]}
    >
      <form className="mb-4 flex flex-wrap items-end gap-3 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
        <label className="text-sm font-medium">
          Dari
          <input
            className={`${input} mt-1 block`}
            defaultValue={from}
            name="from"
            type="date"
          />
        </label>
        <label className="text-sm font-medium">
          Sampai
          <input
            className={`${input} mt-1 block`}
            defaultValue={to}
            name="to"
            type="date"
          />
        </label>
        <button
          className="h-10 rounded-lg bg-gray-900 px-4 text-sm font-semibold text-white dark:bg-white dark:text-gray-900"
          type="submit"
        >
          Terapkan
        </button>
        {context.permissions.includes("report.export") ? (
          <Link
            className="flex h-10 items-center rounded-lg border border-gray-300 px-4 text-sm font-semibold"
            href={`/api/reports/export?report=${type}&from=${from}&to=${to}`}
          >
            Ekspor CSV
          </Link>
        ) : null}
      </form>
      <section className="shadow-theme-xs overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b bg-gray-50 text-left text-xs text-gray-500 uppercase dark:bg-white/[0.02]">
                <th className="px-5 py-3">Akun/Dokumen</th>
                <th>Detail</th>
                <th className="text-right">Debit</th>
                <th className="text-right">Kredit</th>
                <th className="pr-5 text-right">Saldo/Nilai</th>
              </tr>
            </thead>
            <tbody>
              {rows.length ? (
                rows.map((row) => (
                  <tr
                    className="border-b border-gray-100 dark:border-gray-800"
                    key={row.id}
                  >
                    <td className="px-5 py-3">
                      {row.href ? (
                        <Link
                          className="text-brand-600 font-semibold"
                          href={row.href}
                        >
                          {row.label}
                        </Link>
                      ) : (
                        row.label
                      )}
                    </td>
                    <td>{row.detail}</td>
                    <td className="text-right">{formatIDR(row.debit)}</td>
                    <td className="text-right">{formatIDR(row.credit)}</td>
                    <td className="pr-5 text-right font-semibold">
                      {formatIDR(row.balance)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    className="px-5 py-12 text-center text-gray-500"
                    colSpan={5}
                  >
                    Tidak ada data pada periode ini.
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50 font-semibold dark:bg-white/[0.02]">
                <td className="px-5 py-3" colSpan={2}>
                  Total
                </td>
                <td className="text-right">{formatIDR(totals.debit)}</td>
                <td className="text-right">{formatIDR(totals.credit)}</td>
                <td className="pr-5 text-right">{formatIDR(totals.balance)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </section>
      <Link
        className="text-brand-600 mt-4 inline-block text-sm font-semibold"
        href="/reports"
      >
        ← Kembali ke katalog
      </Link>
    </EntityPage>
  );
}
