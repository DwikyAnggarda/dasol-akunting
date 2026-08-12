import Link from "next/link";
import type { Metadata } from "next";

import { EntityDetails } from "@/components/common/EntityDetails";
import { EntityPage } from "@/components/common/EntityPage";
import { StatusBadge } from "@/components/common/ModulePage";
import { formatIDR } from "@/domain/money";
import { detailCardClass } from "@/features/master/page-ui";
import { requireCompanyPermission } from "@/server/auth/require-permission";
import { getProductRecord } from "@/server/queries/master";

export const metadata: Metadata = { title: "Detail Produk" };

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const context = await requireCompanyPermission("item.read");
  const record = await getProductRecord(context.companyId, id);
  return (
    <EntityPage
      description="Konfigurasi penjualan, pembelian, pajak, serta saldo per gudang."
      primaryHref={
        context.permissions.includes("item.write")
          ? `/master/products/${id}/edit`
          : undefined
      }
      primaryLabel="Edit produk"
      title={`${record.sku} — ${record.name}`}
    >
      <section className={detailCardClass}>
        <EntityDetails
          items={[
            { label: "Tipe", value: record.product_type },
            { label: "Barcode", value: record.barcode },
            { label: "Satuan", value: record.units?.code },
            {
              label: "Harga jual",
              value: formatIDR(String(record.sales_price)),
            },
            {
              label: "Harga beli",
              value: formatIDR(String(record.purchase_price)),
            },
            { label: "Stok minimum", value: record.minimum_stock },
            {
              label: "Status",
              value: (
                <StatusBadge value={record.is_active ? "active" : "inactive"} />
              ),
            },
          ]}
        />
      </section>
      {record.product_warehouses.length ? (
        <section className={`${detailCardClass} mt-4`}>
          <h2 className="mb-4 font-semibold text-gray-900 dark:text-white">
            Saldo Gudang
          </h2>
          <div className="space-y-2 text-sm">
            {record.product_warehouses.map(
              (stock: {
                average_cost: number;
                id: string;
                quantity_on_hand: number;
                quantity_reserved: number;
                warehouses: { name: string } | null;
              }) => (
                <div className="flex justify-between gap-4" key={stock.id}>
                  <span>{stock.warehouses?.name ?? "Gudang"}</span>
                  <span>
                    {stock.quantity_on_hand} tersedia, {stock.quantity_reserved}{" "}
                    dipesan · biaya rata-rata{" "}
                    {formatIDR(String(stock.average_cost))}
                  </span>
                </div>
              ),
            )}
          </div>
        </section>
      ) : null}
      <Link
        className="text-brand-600 mt-4 inline-block text-sm font-semibold"
        href="/master/products"
      >
        ← Kembali ke daftar
      </Link>
    </EntityPage>
  );
}
