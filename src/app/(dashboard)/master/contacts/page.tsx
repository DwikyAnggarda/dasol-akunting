import type { Metadata } from "next";

import { ListFilters } from "@/components/common/ListFilters";
import { ModulePage, StatusBadge } from "@/components/common/ModulePage";
import { Pagination } from "@/components/common/Pagination";
import { toggleContactAction } from "@/features/master/actions";
import {
  MasterRowActions,
  mutationMessage,
  PageActions,
  parseListParams,
  type ListSearchParams,
} from "@/features/master/page-ui";
import { requireCompanyPermission } from "@/server/auth/require-permission";
import { getContactRecords, MASTER_PAGE_SIZE } from "@/server/queries/master";

export const metadata: Metadata = { title: "Pelanggan & Pemasok" };

export default async function ContactsPage({
  searchParams,
}: {
  searchParams: Promise<ListSearchParams>;
}) {
  const params = await searchParams;
  const filters = parseListParams(params);
  const context = await requireCompanyPermission("contact.read");
  const records = await getContactRecords(context.companyId, filters);
  const rows = records.slice(0, MASTER_PAGE_SIZE);
  const canManage = context.permissions.includes("contact.write");
  return (
    <ModulePage
      actions={
        <PageActions
          canCreate={canManage}
          canExport={context.permissions.includes("report.export")}
          createHref="/master/contacts/new"
          exportResource="contacts"
        />
      }
      columns={[
        { key: "code", label: "Kode" },
        { key: "display_name", label: "Nama" },
        { key: "contact_type", label: "Tipe" },
        { key: "email", label: "Email" },
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
              action={toggleContactAction}
              basePath="/master/contacts"
              canManage={canManage}
              row={row}
            />
          ),
        },
      ]}
      description="Identitas, data pajak, alamat, termin, limit kredit, dan akun kontrol setiap kontak."
      emptyDescription="Tambahkan pelanggan atau pemasok pertama."
      emptyTitle="Belum ada kontak"
      filters={
        <ListFilters
          active={filters.active}
          q={filters.q}
          type={filters.type}
          typeOptions={[
            { label: "Pelanggan", value: "customer" },
            { label: "Pemasok", value: "supplier" },
            { label: "Keduanya", value: "both" },
          ]}
        />
      }
      rows={rows}
      successMessage={mutationMessage(params, "Kontak")}
      title="Pelanggan & Pemasok"
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
