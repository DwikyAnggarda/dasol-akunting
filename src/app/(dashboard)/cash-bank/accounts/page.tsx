import type { Metadata } from "next";

import { ListFilters } from "@/components/common/ListFilters";
import { ModulePage, StatusBadge } from "@/components/common/ModulePage";
import { Pagination } from "@/components/common/Pagination";
import { toggleBankAccountAction } from "@/features/master/actions";
import {
  MasterRowActions,
  mutationMessage,
  PageActions,
  parseListParams,
  type ListSearchParams,
} from "@/features/master/page-ui";
import { requireCompanyPermission } from "@/server/auth/require-permission";
import {
  getBankAccountRecords,
  MASTER_PAGE_SIZE,
} from "@/server/queries/master";

export const metadata: Metadata = { title: "Akun Bank & Kas" };

export default async function BankAccountsPage({
  searchParams,
}: {
  searchParams: Promise<ListSearchParams>;
}) {
  const params = await searchParams;
  const filters = parseListParams(params);
  const context = await requireCompanyPermission(
    "settings.manage",
    "report.financial.read",
  );
  const records = await getBankAccountRecords(context.companyId, filters);
  const rows = records.slice(0, MASTER_PAGE_SIZE);
  const canManage = context.permissions.includes("settings.manage");
  return (
    <ModulePage
      actions={
        <PageActions
          canCreate={canManage}
          canExport={context.permissions.includes("report.export")}
          createHref="/cash-bank/accounts/new"
          exportResource="bank-accounts"
        />
      }
      columns={[
        { key: "code", label: "Kode" },
        { key: "name", label: "Nama" },
        { key: "account_type", label: "Tipe" },
        { key: "bank_name", label: "Bank" },
        { key: "currency_code", label: "Mata uang" },
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
              action={toggleBankAccountAction}
              basePath="/cash-bank/accounts"
              canManage={canManage}
              row={row}
            />
          ),
        },
      ]}
      description="Rekening bank dan kas yang dipetakan satu-ke-satu ke akun buku besar."
      emptyDescription="Tambahkan rekening bank atau kas operasional."
      emptyTitle="Belum ada akun bank/kas"
      filters={
        <ListFilters
          active={filters.active}
          q={filters.q}
          type={filters.type}
          typeOptions={[
            { label: "Bank", value: "bank" },
            { label: "Kas", value: "cash" },
          ]}
        />
      }
      rows={rows}
      successMessage={mutationMessage(params, "Akun bank/kas")}
      title="Akun Bank & Kas"
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
