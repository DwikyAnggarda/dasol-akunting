import Link from "next/link";
import { ModulePage, StatusBadge } from "@/components/common/ModulePage";
import { formatIDR } from "@/domain/money";
import { requireCompanyPermission } from "@/server/auth/require-permission";
import { getReconciliations } from "@/server/queries/reconciliation";
export default async function Page() {
  const context = await requireCompanyPermission("report.financial.read"),
    rows = await getReconciliations(context.companyId);
  return (
    <ModulePage
      actions={
        context.permissions.includes("settings.manage") ? (
          <Link
            className="bg-brand-500 rounded-xl px-4 py-2.5 text-sm font-semibold text-white"
            href="/cash-bank/reconciliations/new"
          >
            Import statement
          </Link>
        ) : undefined
      }
      columns={[
        {
          key: "statement_date",
          label: "Tanggal",
          render: (value, row) => (
            <Link
              className="text-brand-600 font-semibold"
              href={`/cash-bank/reconciliations/${row.id}`}
            >
              {String(value)}
            </Link>
          ),
        },
        {
          key: "bank_accounts",
          label: "Akun",
          render: (value) => {
            const bank = Array.isArray(value)
              ? value[0]
              : (value as { code: string; name: string });
            return `${bank.code} — ${bank.name}`;
          },
        },
        {
          key: "opening_balance",
          label: "Pembukaan",
          align: "right",
          render: (value) => formatIDR(String(value)),
        },
        {
          key: "closing_balance",
          label: "Penutupan",
          align: "right",
          render: (value) => formatIDR(String(value)),
        },
        {
          key: "status",
          label: "Status",
          render: (value) => <StatusBadge value={String(value)} />,
        },
      ]}
      description="Import CSV, preview, matching transaksi, adjustment selisih, dan finalisasi saldo bank."
      emptyAction={
        context.permissions.includes("settings.manage") ? (
          <Link
            className="text-brand-600 text-sm font-semibold"
            href="/cash-bank/reconciliations/new"
          >
            Import statement pertama
          </Link>
        ) : undefined
      }
      emptyDescription="Belum ada statement bank yang diimpor."
      emptyTitle="Belum ada rekonsiliasi"
      rows={rows}
      title="Rekonsiliasi Bank"
    />
  );
}
