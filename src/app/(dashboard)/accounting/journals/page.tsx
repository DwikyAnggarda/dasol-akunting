import type { Metadata } from "next";
import { ModulePage, StatusBadge } from "@/components/common/ModulePage";
import { formatIDR } from "@/domain/money";
import { getActiveCompanyContext } from "@/server/queries/company-context";
import { getJournals } from "@/server/queries/modules";
export const metadata: Metadata = { title: "Jurnal Umum" };
export default async function JournalsPage() {
  const c = await getActiveCompanyContext();
  const rows = await getJournals(c.companyId);
  return (
    <ModulePage
      title="Jurnal Umum"
      description="Jurnal posted bersifat immutable; koreksi dilakukan dengan reversal atau adjusting entry."
      emptyTitle="Belum ada jurnal"
      emptyDescription="Jurnal akan terbentuk secara atomik saat dokumen disetujui dan diposting."
      rows={rows}
      columns={[
        { key: "number", label: "Nomor" },
        { key: "date", label: "Tanggal posting" },
        { key: "description", label: "Keterangan" },
        { key: "source", label: "Sumber" },
        {
          key: "status",
          label: "Status",
          render: (v) => <StatusBadge value={String(v)} />,
        },
        {
          key: "amount",
          label: "Debit = Kredit",
          align: "right",
          render: (v) => formatIDR(String(v)),
        },
      ]}
    />
  );
}
