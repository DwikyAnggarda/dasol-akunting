import type { Metadata } from "next";
import { ModulePage, StatusBadge } from "@/components/common/ModulePage";
import { getActiveCompanyContext } from "@/server/queries/company-context";
import { getAuditLogs } from "@/server/queries/modules";
export const metadata: Metadata = { title: "Audit Log" };
export default async function AuditLogPage() {
  const c = await getActiveCompanyContext();
  const rows = await getAuditLogs(c.companyId);
  return (
    <ModulePage
      title="Audit Log"
      description="Jejak perubahan kritis append-only dan scoped ke perusahaan aktif."
      emptyTitle="Belum ada aktivitas audit"
      emptyDescription="Submit, approve, reject, post, reversal, dan perubahan periode akan tercatat di sini."
      rows={rows}
      columns={[
        { key: "createdAt", label: "Waktu" },
        {
          key: "action",
          label: "Aksi",
          render: (v) => <StatusBadge value={String(v)} />,
        },
        { key: "entityType", label: "Entitas" },
        { key: "documentNumber", label: "Dokumen" },
        { key: "reason", label: "Alasan" },
      ]}
    />
  );
}
