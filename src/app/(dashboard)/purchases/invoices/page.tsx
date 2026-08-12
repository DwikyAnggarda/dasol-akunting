import type { Metadata } from "next";
import { ModulePage, StatusBadge } from "@/components/common/ModulePage";
import { formatIDR } from "@/domain/money";
import { getActiveCompanyContext } from "@/server/queries/company-context";
import { getPurchaseInvoices } from "@/server/queries/modules";
export const metadata: Metadata = { title: "Invoice Pembelian" };
export default async function PurchaseInvoicesPage() {
  const c = await getActiveCompanyContext();
  const rows = await getPurchaseInvoices(c.companyId);
  return (
    <ModulePage
      title="Invoice Pembelian"
      description="Dokumen pemasok, status persetujuan, posting, dan saldo utang."
      emptyTitle="Belum ada invoice pembelian"
      emptyDescription="Invoice baru akan tampil setelah dibuat oleh operator yang memiliki izin purchase.create."
      rows={rows}
      columns={[
        { key: "documentNumber", label: "Nomor" },
        { key: "date", label: "Tanggal" },
        { key: "contact", label: "Pemasok" },
        { key: "dueDate", label: "Jatuh tempo" },
        {
          key: "status",
          label: "Status",
          render: (v) => <StatusBadge value={String(v)} />,
        },
        {
          key: "total",
          label: "Total",
          align: "right",
          render: (v) => formatIDR(String(v)),
        },
        {
          key: "outstanding",
          label: "Sisa",
          align: "right",
          render: (v) => formatIDR(String(v)),
        },
      ]}
    />
  );
}
