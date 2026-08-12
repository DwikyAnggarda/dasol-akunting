import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { EntityPage, FormCard } from "@/components/common/EntityPage";
import { RoleForm } from "@/features/settings/RoleForm";
import { requireCompanyPermission } from "@/server/auth/require-permission";
import { getPermissions, getRole } from "@/server/queries/access-settings";

export const metadata: Metadata = { title: "Detail Role" };

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const context = await requireCompanyPermission("role.manage");
  const [role, permissions] = await Promise.all([
    getRole(context.companyId, id),
    getPermissions(),
  ]);
  if (!role) notFound();
  return (
    <EntityPage
      description={
        role.is_system
          ? "Role sistem ditampilkan sebagai referensi dan tidak dapat diedit."
          : "Ubah identitas dan permission role secara atomik."
      }
      title={role.name}
    >
      <FormCard>
        <RoleForm permissions={permissions} role={role} />
      </FormCard>
    </EntityPage>
  );
}
