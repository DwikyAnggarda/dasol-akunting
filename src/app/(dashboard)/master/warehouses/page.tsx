import type { Metadata } from "next";

import { ListFilters } from "@/components/common/ListFilters";
import { ModulePage, StatusBadge } from "@/components/common/ModulePage";
import { Pagination } from "@/components/common/Pagination";
import { toggleWarehouseAction } from "@/features/master/actions";
import {
  MasterRowActions,
  mutationMessage,
  PageActions,
  parseListParams,
  type ListSearchParams,
} from "@/features/master/page-ui";
import { requireCompanyPermission } from "@/server/auth/require-permission";
import { getWarehouseRecords, MASTER_PAGE_SIZE } from "@/server/queries/master";

export const metadata: Metadata = { title: "Gudang" };

export default async function WarehousesPage({
  searchParams,
}: {
  searchParams: Promise<ListSearchParams>;
}) {
  const params = await searchParams;
  const filters = parseListParams(params);
  const context = await requireCompanyPermission(
    "inventory.read",
    "settings.manage",
  );
  const records = await getWarehouseRecords(context.companyId, filters);
  const rows = records.slice(0, MASTER_PAGE_SIZE);
  const canManage = context.permissions.includes("settings.manage");
  return (
    <ModulePage
      actions={
        <PageActions
          canCreate={canManage}
          canExport={context.permissions.includes("report.export")}
          createHref="/master/warehouses/new"
          exportResource="warehouses"
        />
      }
      columns={[
        { key: "code", label: "Kode" },
        { key: "name", label: "Nama" },
        {
          key: "branches",
          label: "Cabang",
          render: (value) =>
            (value as { code?: string; name?: string } | null)?.name ?? "—",
        },
        { key: "city", label: "Kota" },
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
              action={toggleWarehouseAction}
              basePath="/master/warehouses"
              canManage={canManage}
              row={row}
            />
          ),
        },
      ]}
      description="Lokasi penyimpanan per cabang beserta alamat operasionalnya."
      emptyDescription="Tambahkan gudang untuk transaksi persediaan."
      emptyTitle="Belum ada gudang"
      filters={<ListFilters active={filters.active} q={filters.q} />}
      rows={rows}
      successMessage={mutationMessage(params, "Gudang")}
      title="Gudang"
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
