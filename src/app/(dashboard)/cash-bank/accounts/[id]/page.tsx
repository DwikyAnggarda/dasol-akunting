import Link from "next/link";
import type { Metadata } from "next";
import { EntityDetails } from "@/components/common/EntityDetails";
import { EntityPage } from "@/components/common/EntityPage";
import { StatusBadge } from "@/components/common/ModulePage";
import { detailCardClass } from "@/features/master/page-ui";
import { requireCompanyPermission } from "@/server/auth/require-permission";
import { getBankAccountRecord } from "@/server/queries/master";
export const metadata: Metadata = { title: "Detail Akun Bank/Kas" };
export default async function BankAccountDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const context = await requireCompanyPermission(
    "settings.manage",
    "report.financial.read",
  );
  const record = await getBankAccountRecord(context.companyId, id);
  return (
    <EntityPage
      description="Informasi rekening operasional dan pemetaan buku besar."
      primaryHref={
        context.permissions.includes("settings.manage")
          ? `/cash-bank/accounts/${id}/edit`
          : undefined
      }
      primaryLabel="Edit akun"
      title={`${record.code} — ${record.name}`}
    >
      <section className={detailCardClass}>
        <EntityDetails
          items={[
            { label: "Tipe", value: record.account_type },
            { label: "Bank", value: record.bank_name },
            { label: "Nomor rekening", value: record.masked_account_number },
            { label: "Mata uang", value: record.currency_code },
            {
              label: "Akun GL",
              value: record.chart_of_accounts
                ? `${record.chart_of_accounts.code} — ${record.chart_of_accounts.name}`
                : "—",
            },
            {
              label: "Status",
              value: (
                <StatusBadge value={record.is_active ? "active" : "inactive"} />
              ),
            },
          ]}
        />
      </section>
      <Link
        className="text-brand-600 mt-4 inline-block text-sm font-semibold"
        href="/cash-bank/accounts"
      >
        ← Kembali ke daftar
      </Link>
    </EntityPage>
  );
}
