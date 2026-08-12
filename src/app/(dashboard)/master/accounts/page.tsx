import type { Metadata } from "next";

import { ListFilters } from "@/components/common/ListFilters";
import { ModulePage, StatusBadge } from "@/components/common/ModulePage";
import { Pagination } from "@/components/common/Pagination";
import { toggleAccountAction } from "@/features/master/actions";
import {
  MasterRowActions,
  mutationMessage,
  PageActions,
  parseListParams,
  type ListSearchParams,
} from "@/features/master/page-ui";
import { requireCompanyPermission } from "@/server/auth/require-permission";
import { getAccountRecords, MASTER_PAGE_SIZE } from "@/server/queries/master";

export const metadata: Metadata = { title: "Daftar Akun" };

export default async function AccountsPage({
  searchParams,
}: {
  searchParams: Promise<ListSearchParams>;
}) {
  const params = await searchParams;
  const filters = parseListParams(params);
  const context = await requireCompanyPermission("coa.read");
  const records = await getAccountRecords(context.companyId, filters);
  const rows = records.slice(0, MASTER_PAGE_SIZE);
  const canManage = context.permissions.includes("coa.write");

  return (
    <ModulePage
      actions={
        <PageActions
          canCreate={canManage}
          canExport={context.permissions.includes("report.export")}
          createHref="/master/accounts/new"
          exportResource="accounts"
        />
      }
      columns={[
        { key: "code", label: "Kode" },
        { key: "name", label: "Nama akun" },
        { key: "account_type", label: "Tipe" },
        { key: "normal_balance", label: "Saldo normal" },
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
              action={toggleAccountAction}
              basePath="/master/accounts"
              canManage={canManage}
              row={row}
            />
          ),
        },
      ]}
      description="Struktur akun perusahaan, saldo normal, dan status pencatatan manual. Akun historis dinonaktifkan, bukan dihapus."
      emptyDescription="Tambahkan chart of accounts sebelum memposting transaksi."
      emptyTitle="Belum ada akun"
      filters={
        <ListFilters
          active={filters.active}
          q={filters.q}
          type={filters.type}
          typeOptions={[
            { label: "Aset", value: "asset" },
            { label: "Liabilitas", value: "liability" },
            { label: "Ekuitas", value: "equity" },
            { label: "Pendapatan", value: "revenue" },
            { label: "Beban", value: "expense" },
          ]}
        />
      }
      rows={rows}
      successMessage={mutationMessage(params, "Akun")}
      title="Daftar Akun"
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
