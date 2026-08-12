import type { Metadata } from "next";

import { EntityPage, FormCard } from "@/components/common/EntityPage";
import { RoleForm } from "@/features/settings/RoleForm";
import { requireCompanyPermission } from "@/server/auth/require-permission";
import { getPermissions } from "@/server/queries/access-settings";

export const metadata: Metadata = { title: "Tambah Role" };

export default async function Page() {
  await requireCompanyPermission("role.manage");
  const permissions = await getPermissions();
  return (
    <EntityPage
      description="Buat role kustom dan pilih izin minimum yang diperlukan."
      title="Tambah Role"
    >
      <FormCard>
        <RoleForm permissions={permissions} />
      </FormCard>
    </EntityPage>
  );
}
