import type { Metadata } from "next";

import { EntityPage, FormCard } from "@/components/common/EntityPage";
import {
  MutationForm,
  type MutationField,
} from "@/components/forms/MutationForm";
import { inviteMemberAction } from "@/features/settings/access-actions";
import { requireCompanyPermission } from "@/server/auth/require-permission";
import { getRoles } from "@/server/queries/access-settings";

export const metadata: Metadata = { title: "Undang Pengguna" };

export default async function Page() {
  const context = await requireCompanyPermission("user.manage");
  const roles = (await getRoles(context.companyId)).filter(
    (role) => role.is_active,
  );
  const fields: MutationField[] = [
    { label: "Nama", name: "displayName", required: true },
    {
      autoComplete: "email",
      label: "Email",
      name: "email",
      required: true,
      type: "email",
    },
    {
      label: "Role",
      name: "roleId",
      options: roles.map((role) => ({ label: role.name, value: role.id })),
      required: true,
      type: "select",
    },
  ];
  return (
    <EntityPage
      description="Undangan memakai API Supabase Auth; password tidak pernah dikelola oleh administrator Dasol."
      title="Undang Pengguna"
    >
      <FormCard>
        <MutationForm
          action={inviteMemberAction}
          cancelHref="/settings/users"
          fields={fields}
          submitLabel="Kirim undangan"
        />
      </FormCard>
    </EntityPage>
  );
}
