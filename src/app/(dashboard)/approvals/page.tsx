import type { Metadata } from "next";
import { ModulePage, StatusBadge } from "@/components/common/ModulePage";
import { getActiveCompanyContext } from "@/server/queries/company-context";
import { getApprovals } from "@/server/queries/modules";
export const metadata: Metadata = { title: "Persetujuan" };
export default async function ApprovalsPage() {
  const c = await getActiveCompanyContext();
  const rows = await getApprovals(c.companyId);
  return (
    <ModulePage
      title="Persetujuan"
      description="Antrean persetujuan dengan separation of duties; pembuat dokumen tidak dapat menyetujui sendiri secara default."
      emptyTitle="Tidak ada dokumen menunggu"
      emptyDescription="Dokumen submitted akan muncul di sini sesuai izin dan workflow perusahaan."
      rows={rows}
      columns={[
        { key: "documentNumber", label: "Dokumen" },
        { key: "documentType", label: "Tipe" },
        { key: "submittedAt", label: "Diajukan" },
        {
          key: "status",
          label: "Status",
          render: (v) => <StatusBadge value={String(v)} />,
        },
      ]}
    />
  );
}
