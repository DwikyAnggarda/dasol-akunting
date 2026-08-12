import Link from "next/link";
import type { Metadata } from "next";

import { EntityDetails } from "@/components/common/EntityDetails";
import { EntityPage } from "@/components/common/EntityPage";
import { StatusBadge } from "@/components/common/ModulePage";
import { detailCardClass } from "@/features/master/page-ui";
import { requireCompanyPermission } from "@/server/auth/require-permission";
import { getAccountRecord } from "@/server/queries/master";

export const metadata: Metadata = { title: "Detail Akun" };

export default async function AccountDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const context = await requireCompanyPermission("coa.read");
  const record = await getAccountRecord(context.companyId, id);
  return (
    <EntityPage
      description="Detail chart of accounts dan aturan pencatatannya."
      primaryHref={
        context.permissions.includes("coa.write")
          ? `/master/accounts/${id}/edit`
          : undefined
      }
      primaryLabel="Edit akun"
      title={`${record.code} — ${record.name}`}
    >
      <section className={detailCardClass}>
        <EntityDetails
          items={[
            { label: "Tipe", value: record.account_type },
            { label: "Saldo normal", value: record.normal_balance },
            { label: "Kategori arus kas", value: record.cash_flow_category },
            {
              label: "Akun kontrol",
              value: record.is_control_account ? "Ya" : "Tidak",
            },
            {
              label: "Jurnal manual",
              value: record.allow_manual_entry ? "Diizinkan" : "Diblokir",
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
        href="/master/accounts"
      >
        ← Kembali ke daftar
      </Link>
    </EntityPage>
  );
}
