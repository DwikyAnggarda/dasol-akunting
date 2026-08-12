import type { Metadata } from "next";

import PageBreadCrumb from "@/components/common/PageBreadCrumb";
import { formatIDR } from "@/domain/money";
import { getActiveCompanyContext } from "@/server/queries/company-context";
import { getDashboardMetrics } from "@/server/queries/dashboard";

export const metadata: Metadata = { title: "Dasbor" };

function MetricCard({
  detail,
  label,
  value,
}: {
  detail: string;
  label: string;
  value: string;
}) {
  return (
    <article className="shadow-theme-xs rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
        {label}
      </p>
      <p className="mt-3 text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">
        {value}
      </p>
      <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">{detail}</p>
    </article>
  );
}

export default async function DashboardPage() {
  const context = await getActiveCompanyContext();
  const metrics = await getDashboardMetrics(context.companyId);

  return (
    <div>
      <PageBreadCrumb pageTitle="Dasbor" />
      <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Ringkasan keuangan
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Angka bersumber dari jurnal posted {context.companyName}.
          </p>
        </div>
        <p className="text-xs text-gray-400">Diperbarui saat halaman dimuat</p>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          detail="Kas dan rekening bank"
          label="Kas & Bank"
          value={formatIDR(metrics.cashBalance)}
        />
        <MetricCard
          detail={`Lewat jatuh tempo ${formatIDR(metrics.overdueReceivable)}`}
          label="Piutang Usaha"
          value={formatIDR(metrics.accountsReceivable)}
        />
        <MetricCard
          detail={`Lewat jatuh tempo ${formatIDR(metrics.overduePayable)}`}
          label="Utang Usaha"
          value={formatIDR(metrics.accountsPayable)}
        />
        <MetricCard
          detail={`${metrics.pendingApprovals} dokumen menunggu persetujuan`}
          label="Laba Bersih Bulan Ini"
          value={formatIDR(metrics.netProfit)}
        />
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="shadow-theme-xs rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-gray-900 dark:text-white">
                Transaksi terbaru
              </h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Hanya dokumen yang telah diposting.
              </p>
            </div>
          </div>
          {metrics.recentTransactions.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-200 px-5 py-10 text-center text-sm text-gray-500 dark:border-gray-800 dark:text-gray-400">
              Belum ada transaksi posted pada perusahaan ini.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-gray-100 text-xs tracking-wider text-gray-400 uppercase dark:border-gray-800">
                  <tr>
                    <th className="pb-3 font-medium">Dokumen</th>
                    <th className="pb-3 font-medium">Tanggal</th>
                    <th className="pb-3 font-medium">Keterangan</th>
                    <th className="pb-3 text-right font-medium">Nilai</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {metrics.recentTransactions.map((transaction) => (
                    <tr key={transaction.documentNumber}>
                      <td className="py-3 font-medium text-gray-900 dark:text-white">
                        {transaction.documentNumber}
                      </td>
                      <td className="py-3 text-gray-500 dark:text-gray-400">
                        {transaction.date}
                      </td>
                      <td className="py-3 text-gray-500 dark:text-gray-400">
                        {transaction.description}
                      </td>
                      <td className="py-3 text-right font-medium text-gray-900 dark:text-white">
                        {formatIDR(transaction.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="shadow-theme-md rounded-2xl bg-gray-950 p-6 text-white">
          <p className="text-brand-300 text-xs font-semibold tracking-[0.18em] uppercase">
            Bulan berjalan
          </p>
          <dl className="mt-6 space-y-5">
            <div className="flex items-center justify-between gap-4">
              <dt className="text-sm text-white/60">Pendapatan</dt>
              <dd className="font-semibold">
                {formatIDR(metrics.revenueThisMonth)}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-sm text-white/60">Beban</dt>
              <dd className="font-semibold">
                {formatIDR(metrics.expensesThisMonth)}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-sm text-white/60">Laba kotor</dt>
              <dd className="font-semibold">
                {formatIDR(metrics.grossProfit)}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4 border-t border-white/10 pt-5">
              <dt className="text-sm text-white/60">Stok rendah</dt>
              <dd className="font-semibold">{metrics.lowStockCount} produk</dd>
            </div>
          </dl>
        </div>
      </section>
    </div>
  );
}
