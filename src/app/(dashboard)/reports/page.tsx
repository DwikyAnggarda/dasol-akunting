import type { Metadata } from "next";
import PageBreadCrumb from "@/components/common/PageBreadCrumb";
import { formatIDR } from "@/domain/money";
import { getActiveCompanyContext } from "@/server/queries/company-context";
import { getReportHealth } from "@/server/queries/reports";
export const metadata: Metadata = { title: "Laporan" };
function ReconciliationCard({
  balanced,
  label,
  ledger,
  subledger,
}: {
  balanced: boolean;
  label: string;
  ledger: string;
  subledger: string;
}) {
  return (
    <article className="shadow-theme-xs rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="flex items-center justify-between gap-4">
        <h2 className="font-semibold text-gray-900 dark:text-white">{label}</h2>
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${balanced ? "bg-success-50 text-success-700" : "bg-error-50 text-error-700"}`}
        >
          {balanced ? "Seimbang" : "Selisih"}
        </span>
      </div>
      <dl className="mt-5 space-y-3 text-sm">
        <div className="flex justify-between">
          <dt className="text-gray-500">General Ledger</dt>
          <dd className="font-medium text-gray-900 dark:text-white">
            {formatIDR(ledger)}
          </dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-gray-500">Subledger</dt>
          <dd className="font-medium text-gray-900 dark:text-white">
            {formatIDR(subledger)}
          </dd>
        </div>
      </dl>
    </article>
  );
}
export default async function ReportsPage() {
  const context = await getActiveCompanyContext();
  const health = await getReportHealth(context.companyId);
  return (
    <div>
      <PageBreadCrumb pageTitle="Laporan" />
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          Kontrol laporan keuangan
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Seluruh kontrol menggunakan jurnal posted untuk {context.companyName}.
        </p>
      </div>
      <section className="grid gap-4 md:grid-cols-3">
        <ReconciliationCard
          balanced={health.ledgerBalanced}
          label="Trial Balance"
          ledger={health.totalDebit}
          subledger={health.totalCredit}
        />
        <ReconciliationCard
          balanced={health.arBalanced}
          label="Piutang Usaha"
          ledger={health.arLedger}
          subledger={health.arSubledger}
        />
        <ReconciliationCard
          balanced={health.apBalanced}
          label="Utang Usaha"
          ledger={health.apLedger}
          subledger={health.apSubledger}
        />
      </section>
      <section className="mt-6 rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <h2 className="font-semibold text-gray-900 dark:text-white">
          Katalog laporan
        </h2>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          General Ledger, Trial Balance, Laba Rugi, Neraca, Arus Kas, AR Aging,
          dan AP Aging bersumber dari ledger dan subledger perusahaan aktif.
          Kontrol di atas menjadi guard sebelum ekspor atau penutupan periode.
        </p>
      </section>
    </div>
  );
}
