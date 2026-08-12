import type { Metadata } from "next";
import Link from "next/link";

import { EntityDetails } from "@/components/common/EntityDetails";
import { EntityPage } from "@/components/common/EntityPage";
import { formatDecimal, formatIDR } from "@/domain/money";
import { detailCardClass } from "@/features/master/page-ui";
import { requireCompanyPermission } from "@/server/auth/require-permission";
import { getStockCard } from "@/server/queries/inventory";

export const metadata: Metadata = { title: "Kartu Stok" };
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const context = await requireCompanyPermission("inventory.read");
  const { balance, movements } = await getStockCard(context.companyId, id);
  return (
    <EntityPage
      description="Ledger pergerakan stok append-only beserta running quantity dan moving average."
      title={`Kartu Stok · ${balance.products?.sku}`}
    >
      <section className={detailCardClass}>
        <EntityDetails
          items={[
            { label: "Produk", value: balance.products?.name },
            { label: "Gudang", value: balance.warehouses?.name },
            {
              label: "On hand",
              value: formatDecimal(String(balance.quantity_on_hand), {
                maximumScale: 6,
              }),
            },
            {
              label: "Reserved",
              value: formatDecimal(String(balance.quantity_reserved), {
                maximumScale: 6,
              }),
            },
            {
              label: "Biaya rata-rata",
              value: formatIDR(String(balance.average_cost)),
            },
            {
              label: "Nilai persediaan",
              value: formatIDR(String(balance.inventory_value)),
            },
          ]}
        />
      </section>
      <section className={`${detailCardClass} mt-4 overflow-x-auto`}>
        <table className="w-full min-w-[880px] text-sm">
          <thead>
            <tr className="border-b text-left text-xs text-gray-500 uppercase">
              <th className="py-3">Tanggal</th>
              <th>Tipe</th>
              <th>Sumber</th>
              <th className="text-right">Qty</th>
              <th className="text-right">Biaya</th>
              <th className="text-right">Total</th>
              <th className="text-right">Running qty</th>
              <th className="text-right">Running avg</th>
            </tr>
          </thead>
          <tbody>
            {movements.map((movement) => (
              <tr
                className="border-b border-gray-100 dark:border-gray-800"
                key={movement.id}
              >
                <td className="py-3">{movement.movement_date}</td>
                <td>{movement.movement_type}</td>
                <td>{movement.source_type}</td>
                <td className="text-right">
                  {formatDecimal(movement.quantity, { maximumScale: 6 })}
                </td>
                <td className="text-right">{formatIDR(movement.unit_cost)}</td>
                <td className="text-right">{formatIDR(movement.total_cost)}</td>
                <td className="text-right">
                  {formatDecimal(movement.running_quantity, {
                    maximumScale: 6,
                  })}
                </td>
                <td className="text-right">
                  {formatIDR(movement.running_average_cost)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {movements.length === 0 ? (
          <p className="py-10 text-center text-sm text-gray-500">
            Belum ada movement untuk saldo ini.
          </p>
        ) : null}
      </section>
      <Link
        className="text-brand-600 mt-4 inline-block text-sm font-semibold"
        href="/inventory/stock"
      >
        ← Kembali ke saldo stok
      </Link>
    </EntityPage>
  );
}
