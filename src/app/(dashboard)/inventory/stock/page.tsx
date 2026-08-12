import type { Metadata } from "next";
import Link from "next/link";
import { ModulePage } from "@/components/common/ModulePage";
import { formatDecimal, formatIDR } from "@/domain/money";
import { getActiveCompanyContext } from "@/server/queries/company-context";
import { getStock } from "@/server/queries/modules";
export const metadata: Metadata = { title: "Saldo Persediaan" };
export default async function StockPage() {
  const c = await getActiveCompanyContext();
  const rows = await getStock(c.companyId);
  return (
    <ModulePage
      actions={
        c.permissions.includes("inventory.write") ? (
          <Link
            className="bg-brand-500 rounded-xl px-4 py-2.5 text-sm font-semibold text-white"
            href="/inventory/adjustments/new"
          >
            Adjust stok
          </Link>
        ) : undefined
      }
      title="Saldo Persediaan"
      description="Kuantitas dan moving weighted-average cost per produk dan gudang."
      emptyTitle="Belum ada saldo stok"
      emptyDescription="Saldo muncul setelah opening inventory atau penerimaan barang diposting."
      rows={rows}
      columns={[
        { key: "sku", label: "SKU" },
        { key: "product", label: "Produk" },
        { key: "warehouse", label: "Gudang" },
        {
          key: "quantity",
          label: "Kuantitas",
          align: "right",
          render: (v) => formatDecimal(String(v), { maximumScale: 6 }),
        },
        {
          key: "averageCost",
          label: "Biaya rata-rata",
          align: "right",
          render: (v) => formatIDR(String(v)),
        },
        {
          key: "value",
          label: "Nilai",
          align: "right",
          render: (v) => formatIDR(String(v)),
        },
        {
          key: "id",
          label: "Aksi",
          align: "right",
          render: (_value, row) => (
            <Link
              className="text-brand-600 text-xs font-semibold"
              href={`/inventory/stock/${row.id}`}
            >
              Kartu stok
            </Link>
          ),
        },
      ]}
    />
  );
}
