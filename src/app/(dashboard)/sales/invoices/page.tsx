import type { Metadata } from "next";
import { ModulePage, StatusBadge } from "@/components/common/ModulePage";
import { formatIDR } from "@/domain/money";
import { getActiveCompanyContext } from "@/server/queries/company-context";
import { getSalesInvoices } from "@/server/queries/modules";
export const metadata: Metadata = { title: "Invoice Penjualan" };
export default async function SalesInvoicesPage() {
  const c = await getActiveCompanyContext();
  const rows = await getSalesInvoices(c.companyId);
  return (
    <ModulePage
      title="Invoice Penjualan"
      description="Dokumen penjualan, status persetujuan, posting, dan saldo piutang."
      emptyTitle="Belum ada invoice penjualan"
      emptyDescription="Invoice baru akan tampil setelah dibuat oleh operator yang memiliki izin sales.create."
      rows={rows}
      columns={[
        { key: "documentNumber", label: "Nomor" },
        { key: "date", label: "Tanggal" },
        { key: "contact", label: "Pelanggan" },
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
