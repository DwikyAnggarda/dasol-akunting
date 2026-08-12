import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { EntityPage, FormCard } from "@/components/common/EntityPage";
import {
  MutationForm,
  type MutationField,
} from "@/components/forms/MutationForm";
import { updateMembershipAction } from "@/features/settings/access-actions";
import { requireCompanyPermission } from "@/server/auth/require-permission";
import { getCompanyMember, getRoles } from "@/server/queries/access-settings";

export const metadata: Metadata = { title: "Keanggotaan Pengguna" };

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const context = await requireCompanyPermission("user.manage");
  const [member, roles] = await Promise.all([
    getCompanyMember(context.companyId, id),
    getRoles(context.companyId),
  ]);
  if (!member) notFound();
  const fields: MutationField[] = [
    {
      defaultValue: member.role_id,
      label: "Role",
      name: "roleId",
      options: roles
        .filter((role) => role.is_active)
        .map((role) => ({ label: role.name, value: role.id })),
      required: true,
      type: "select",
    },
    {
      defaultValue: member.status,
      label: "Status",
      name: "status",
      options: [
        { label: "Aktif", value: "active" },
        { label: "Dinonaktifkan", value: "disabled" },
      ],
      required: true,
      type: "select",
    },
  ];
  const self = member.user_id === context.userId;
  return (
    <EntityPage
      description={`${member.email} · ${member.role_name}`}
      title={member.display_name ?? member.email}
    >
      <FormCard>
        {self ? (
          <p className="rounded-xl bg-gray-50 p-4 text-sm text-gray-600 dark:bg-gray-900 dark:text-gray-300">
            Ini adalah membership Anda sendiri. Role dan status tidak dapat
            diubah untuk mencegah kehilangan akses administrator.
          </p>
        ) : (
          <MutationForm
            action={updateMembershipAction}
            cancelHref="/settings/users"
            fields={fields}
            hidden={{ userId: member.user_id, version: String(member.version) }}
            submitLabel="Simpan membership"
          />
        )}
      </FormCard>
    </EntityPage>
  );
}
