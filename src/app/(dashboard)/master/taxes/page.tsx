import type { Metadata } from "next";

import { ListFilters } from "@/components/common/ListFilters";
import { ModulePage, StatusBadge } from "@/components/common/ModulePage";
import { Pagination } from "@/components/common/Pagination";
import { toggleTaxCodeAction } from "@/features/master/actions";
import {
  MasterRowActions,
  mutationMessage,
  PageActions,
  parseListParams,
  type ListSearchParams,
} from "@/features/master/page-ui";
import { requireCompanyPermission } from "@/server/auth/require-permission";
import { getTaxCodeRecords, MASTER_PAGE_SIZE } from "@/server/queries/master";

export const metadata: Metadata = { title: "Kode Pajak" };

export default async function TaxesPage({
  searchParams,
}: {
  searchParams: Promise<ListSearchParams>;
}) {
  const params = await searchParams;
  const filters = parseListParams(params);
  const context = await requireCompanyPermission(
    "settings.manage",
    "report.tax.read",
  );
  const records = await getTaxCodeRecords(context.companyId, filters);
  const rows = records.slice(0, MASTER_PAGE_SIZE);
  const canManage = context.permissions.includes("settings.manage");
  return (
    <ModulePage
      actions={
        <PageActions
          canCreate={canManage}
          canExport={context.permissions.includes("report.export")}
          createHref="/master/taxes/new"
          exportResource="taxes"
        />
      }
      columns={[
        { key: "code", label: "Kode" },
        { key: "name", label: "Nama" },
        { key: "category", label: "Kategori" },
        {
          key: "tax_rate_versions",
          label: "Tarif aktif",
          render: (value) => {
            const today = new Date().toISOString().slice(0, 10);
            const rates =
              (value as {
                effective_from: string;
                effective_to: string | null;
                rate: number;
                status: string;
              }[]) ?? [];
            const active = rates.find(
              (rate) =>
                rate.status === "active" &&
                rate.effective_from <= today &&
                (!rate.effective_to || rate.effective_to >= today),
            );
            return active ? `${active.rate}%` : "—";
          },
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
              action={toggleTaxCodeAction}
              basePath="/master/taxes"
              canManage={canManage}
              row={row}
            />
          ),
        },
      ]}
      description="Kode pajak dan riwayat tarif berdasarkan tanggal efektif. Tarif yang sudah dipakai transaksi bersifat immutable."
      emptyDescription="Tambahkan kode pajak dan versi tarif pertamanya."
      emptyTitle="Belum ada kode pajak"
      filters={<ListFilters active={filters.active} q={filters.q} />}
      rows={rows}
      successMessage={mutationMessage(params, "Kode pajak")}
      title="Kode Pajak"
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
