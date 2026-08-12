import type { Metadata } from "next";
import Link from "next/link";

import { ModulePage, StatusBadge } from "@/components/common/ModulePage";
import { ConfirmActionForm } from "@/components/forms/ConfirmActionForm";
import { toggleRoleAction } from "@/features/settings/access-actions";
import { requireCompanyPermission } from "@/server/auth/require-permission";
import { getRoles } from "@/server/queries/access-settings";

export const metadata: Metadata = { title: "Roles & Permission" };

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ statusChanged?: string }>;
}) {
  const params = await searchParams;
  const context = await requireCompanyPermission("role.manage");
  const roles = await getRoles(context.companyId);
  return (
    <ModulePage
      actions={
        <Link
          className="bg-brand-500 rounded-xl px-4 py-2.5 text-sm font-semibold text-white"
          href="/settings/roles/new"
        >
          Tambah role
        </Link>
      }
      columns={[
        { key: "code", label: "Kode" },
        { key: "name", label: "Nama" },
        {
          key: "permissions",
          label: "Permission",
          render: (value) => `${(value as string[]).length} izin`,
        },
        {
          key: "is_system",
          label: "Jenis",
          render: (value) => (value ? "Sistem (terkunci)" : "Kustom"),
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
            <div className="flex items-center justify-end gap-2">
              <Link
                className="text-brand-600 text-xs font-semibold"
                href={`/settings/roles/${row.id}`}
              >
                {row.is_system ? "Lihat" : "Edit"}
              </Link>
              {!row.is_system ? (
                <ConfirmActionForm
                  action={toggleRoleAction}
                  confirmMessage={`${row.is_active ? "Nonaktifkan" : "Aktifkan"} role ${row.name}?`}
                  fields={{
                    activate: String(!row.is_active),
                    id: row.id,
                    version: String(row.version),
                  }}
                  label={row.is_active ? "Nonaktifkan" : "Aktifkan"}
                  tone={row.is_active ? "danger" : "primary"}
                />
              ) : null}
            </div>
          ),
        },
      ]}
      description="Role sistem bersifat read-only. Role kustom dapat diberi permission dan dinonaktifkan selama tidak dipakai anggota aktif."
      emptyDescription="Buat role kustom untuk membatasi tugas pengguna."
      emptyTitle="Belum ada role"
      rows={roles}
      successMessage={
        params.statusChanged ? "Status role berhasil diubah." : undefined
      }
      title="Roles & Permission"
    />
  );
}
