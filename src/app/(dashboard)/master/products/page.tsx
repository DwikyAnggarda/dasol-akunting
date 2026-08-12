import type { Metadata } from "next";

import { ListFilters } from "@/components/common/ListFilters";
import { ModulePage, StatusBadge } from "@/components/common/ModulePage";
import { Pagination } from "@/components/common/Pagination";
import { formatIDR } from "@/domain/money";
import { toggleProductAction } from "@/features/master/actions";
import {
  MasterRowActions,
  mutationMessage,
  PageActions,
  parseListParams,
  type ListSearchParams,
} from "@/features/master/page-ui";
import { requireCompanyPermission } from "@/server/auth/require-permission";
import { getProductRecords, MASTER_PAGE_SIZE } from "@/server/queries/master";

export const metadata: Metadata = { title: "Produk & Jasa" };

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<ListSearchParams>;
}) {
  const params = await searchParams;
  const filters = parseListParams(params);
  const context = await requireCompanyPermission("item.read");
  const records = await getProductRecords(context.companyId, filters);
  const rows = records.slice(0, MASTER_PAGE_SIZE);
  const canManage = context.permissions.includes("item.write");
  return (
    <ModulePage
      actions={
        <PageActions
          canCreate={canManage}
          canExport={context.permissions.includes("report.export")}
          createHref="/master/products/new"
          exportResource="products"
        />
      }
      columns={[
        { key: "sku", label: "SKU" },
        { key: "name", label: "Nama" },
        { key: "product_type", label: "Tipe" },
        {
          align: "right",
          key: "sales_price",
          label: "Harga jual",
          render: (value) => formatIDR(String(value)),
        },
        {
          key: "is_active",
          label: "Status",
          render: (value) => (
            <StatusBadge value={value ? "active" : "inactive"} />
          ),
        },
        {
          align: "right",
          key: "id",
          label: "Aksi",
          render: (_value, row) => (
            <MasterRowActions
              action={toggleProductAction}
              basePath="/master/products"
              canManage={canManage}
              row={row}
            />
          ),
        },
      ]}
      description="Katalog barang dan jasa, harga default, satuan, akun GL, dan konfigurasi pajak."
      emptyDescription="Tambahkan produk persediaan, non-persediaan, atau jasa."
      emptyTitle="Belum ada produk"
      filters={
        <ListFilters
          active={filters.active}
          q={filters.q}
          type={filters.type}
          typeOptions={[
            { label: "Persediaan", value: "inventory" },
            { label: "Non-persediaan", value: "non_inventory" },
            { label: "Jasa", value: "service" },
          ]}
        />
      }
      rows={rows}
      successMessage={mutationMessage(params, "Produk")}
      title="Produk & Jasa"
      trailing={
        <Pagination
          hasNext={records.length > MASTER_PAGE_SIZE}
          page={filters.page}
          searchParams={params}
        />
      }
    />
  );
}
