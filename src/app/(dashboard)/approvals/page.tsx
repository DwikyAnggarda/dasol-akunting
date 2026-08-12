import type { Metadata } from "next";
import Link from "next/link";
import { ModulePage, StatusBadge } from "@/components/common/ModulePage";
import { requireCompanyPermission } from "@/server/auth/require-permission";
import { getApprovals } from "@/server/queries/modules";
export const metadata: Metadata = { title: "Persetujuan" };
const detailPath = (type: string, id: string) => {
  if (type === "sales_invoice") return `/sales/invoices/${id}`;
  if (type === "sales_return") return `/sales/returns/${id}`;
  if (type === "purchase_invoice") return `/purchases/invoices/${id}`;
  if (type === "purchase_return") return `/purchases/returns/${id}`;
  if (type === "inventory_adjustment") return `/inventory/adjustments/${id}`;
  if (type === "inventory_transfer") return `/inventory/transfers/${id}`;
  if (type === "stock_count") return `/inventory/opname/${id}`;
  if (type === "cash_transaction") return `/cash-bank/transactions/${id}`;
  if (type === "sales_order") return `/sales/orders/${id}`;
  if (type === "sales_quotation") return `/sales/quotations/${id}`;
  if (type === "sales_delivery") return `/sales/deliveries/${id}`;
  if (type === "purchase_order") return `/purchases/orders/${id}`;
  if (type === "purchase_request") return `/purchases/requests/${id}`;
  if (type === "goods_receipt") return `/purchases/receipts/${id}`;
  return "/approvals";
};
export default async function ApprovalsPage() {
  const c = await requireCompanyPermission("approval.read");
  const rows = await getApprovals(c.companyId);
  return (
    <ModulePage
      title="Persetujuan"
      description="Antrean persetujuan dengan separation of duties; pembuat dokumen tidak dapat menyetujui sendiri secara default."
      emptyTitle="Tidak ada dokumen menunggu"
      emptyDescription="Dokumen submitted akan muncul di sini sesuai izin dan workflow perusahaan."
      rows={rows}
      columns={[
        {
          key: "documentNumber",
          label: "Dokumen",
          render: (value, row) => (
            <Link
              className="text-brand-600 font-semibold"
              href={detailPath(row.documentType, row.documentId)}
            >
              {String(value)}
            </Link>
          ),
        },
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
