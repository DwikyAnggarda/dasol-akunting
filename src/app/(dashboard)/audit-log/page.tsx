import Link from "next/link";
import type { Metadata } from "next";
import { ModulePage, StatusBadge } from "@/components/common/ModulePage";
import { requireCompanyPermission } from "@/server/auth/require-permission";
import { getAuditLogs } from "@/server/queries/modules";
export const metadata: Metadata = { title: "Audit Log" };
export default async function AuditLogPage() {
  const context = await requireCompanyPermission("audit.read");
  const rows = await getAuditLogs(context.companyId);
  return (
    <ModulePage
      actions={
        context.permissions.includes("report.export") ? (
          <Link
            className="rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-semibold"
            href="/api/export/audit-log"
          >
            Ekspor CSV
          </Link>
        ) : undefined
      }
      columns={[
        { key: "createdAt", label: "Waktu" },
        {
          key: "action",
          label: "Aksi",
          render: (value) => <StatusBadge value={String(value)} />,
        },
        { key: "entityType", label: "Entitas" },
        { key: "documentNumber", label: "Dokumen" },
        { key: "reason", label: "Alasan" },
        {
          align: "right",
          key: "id",
          label: "Detail",
          render: (_value, row) => (
            <Link
              className="text-brand-600 font-semibold"
              href={`/audit-log/${row.id}`}
            >
              Lihat
            </Link>
          ),
        },
      ]}
      description="Jejak perubahan kritis append-only dan scoped ke perusahaan aktif."
      emptyDescription="Submit, approve, reject, post, reversal, dan perubahan periode tercatat di sini."
      emptyTitle="Belum ada aktivitas audit"
      rows={rows}
      title="Audit Log"
    />
  );
}
