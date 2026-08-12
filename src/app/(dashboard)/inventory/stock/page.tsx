import type { Metadata } from "next";
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
      ]}
    />
  );
}
