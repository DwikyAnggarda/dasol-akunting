import Link from "next/link";
import type { Metadata } from "next";

import { EntityDetails } from "@/components/common/EntityDetails";
import { EntityPage } from "@/components/common/EntityPage";
import { StatusBadge } from "@/components/common/ModulePage";
import { detailCardClass } from "@/features/master/page-ui";
import { requireCompanyPermission } from "@/server/auth/require-permission";
import { getWarehouseRecord } from "@/server/queries/master";

export const metadata: Metadata = { title: "Detail Gudang" };

export default async function WarehouseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const context = await requireCompanyPermission(
    "inventory.read",
    "settings.manage",
  );
  const record = await getWarehouseRecord(context.companyId, id);
  return (
    <EntityPage
      description="Identitas dan alamat lokasi penyimpanan."
      primaryHref={
        context.permissions.includes("settings.manage")
          ? `/master/warehouses/${id}/edit`
          : undefined
      }
      primaryLabel="Edit gudang"
      title={`${record.code} — ${record.name}`}
    >
      <section className={detailCardClass}>
        <EntityDetails
          items={[
            { label: "Cabang", value: record.branches?.name },
            { label: "Alamat", value: record.address_line },
            { label: "Kota", value: record.city },
            { label: "Provinsi", value: record.province },
            { label: "Kode pos", value: record.postal_code },
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
        href="/master/warehouses"
      >
        ← Kembali ke daftar
      </Link>
    </EntityPage>
  );
}
