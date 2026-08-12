import Link from "next/link";
import type { Metadata } from "next";
import { EntityDetails } from "@/components/common/EntityDetails";
import { EntityPage } from "@/components/common/EntityPage";
import { StatusBadge } from "@/components/common/ModulePage";
import { detailCardClass } from "@/features/master/page-ui";
import { requireCompanyPermission } from "@/server/auth/require-permission";
import { getAuditRecord } from "@/server/queries/audit";
export const metadata: Metadata = { title: "Detail Audit" };
const pretty = (value: unknown) =>
  value ? JSON.stringify(value, null, 2) : "—";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const context = await requireCompanyPermission("audit.read");
  const record = await getAuditRecord(context.companyId, id);
  return (
    <EntityPage
      description="Snapshot append-only sebelum dan sesudah perubahan."
      title={`Audit ${record.action}`}
    >
      <section className={detailCardClass}>
        <EntityDetails
          items={[
            {
              label: "Waktu",
              value: new Date(record.created_at).toLocaleString("id-ID"),
            },
            { label: "Aksi", value: <StatusBadge value={record.action} /> },
            { label: "Entitas", value: record.entity_type },
            { label: "Entity ID", value: record.entity_id },
            { label: "Dokumen", value: record.document_number },
            { label: "Alasan", value: record.reason },
          ]}
        />
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <div>
            <h2 className="mb-2 text-sm font-semibold">Sebelum</h2>
            <pre className="max-h-96 overflow-auto rounded-xl bg-gray-950 p-4 text-xs text-gray-100">
              {pretty(record.before_data)}
            </pre>
          </div>
          <div>
            <h2 className="mb-2 text-sm font-semibold">Sesudah</h2>
            <pre className="max-h-96 overflow-auto rounded-xl bg-gray-950 p-4 text-xs text-gray-100">
              {pretty(record.after_data)}
            </pre>
          </div>
        </div>
      </section>
      <Link
        className="text-brand-600 mt-4 inline-block text-sm font-semibold"
        href="/audit-log"
      >
        ← Kembali ke audit log
      </Link>
    </EntityPage>
  );
}
