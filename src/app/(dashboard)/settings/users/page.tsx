import type { Metadata } from "next";
import Link from "next/link";

import { ModulePage, StatusBadge } from "@/components/common/ModulePage";
import { requireCompanyPermission } from "@/server/auth/require-permission";
import { getCompanyMembers } from "@/server/queries/access-settings";

export const metadata: Metadata = { title: "Pengguna" };

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const params = await searchParams;
  const context = await requireCompanyPermission("user.manage");
  const members = await getCompanyMembers(context.companyId);
  return (
    <ModulePage
      actions={
        <Link
          className="bg-brand-500 rounded-xl px-4 py-2.5 text-sm font-semibold text-white"
          href="/settings/users/new"
        >
          Undang pengguna
        </Link>
      }
      columns={[
        {
          key: "display_name",
          label: "Nama",
          render: (value) => String(value ?? "—"),
        },
        { key: "email", label: "Email" },
        { key: "role_name", label: "Role" },
        {
          key: "status",
          label: "Status",
          render: (value) => <StatusBadge value={String(value)} />,
        },
        {
          align: "right",
          key: "id",
          label: "Aksi",
          render: (_value, row) => (
            <Link
              className="text-brand-600 text-xs font-semibold"
              href={`/settings/users/${row.user_id}`}
            >
              {row.user_id === context.userId ? "Lihat" : "Kelola"}
            </Link>
          ),
        },
      ]}
      description="Undang pengguna melalui Supabase Auth resmi, lalu kelola role dan status membership perusahaan."
      emptyDescription="Undang anggota pertama untuk berkolaborasi di perusahaan ini."
      emptyTitle="Belum ada pengguna"
      rows={members}
      successMessage={
        params.saved ? "Keanggotaan pengguna berhasil diperbarui." : undefined
      }
      title="Pengguna"
    />
  );
}
