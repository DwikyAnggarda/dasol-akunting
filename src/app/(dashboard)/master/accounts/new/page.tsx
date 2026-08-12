import type { Metadata } from "next";

import { EntityPage, FormCard } from "@/components/common/EntityPage";
import { MutationForm } from "@/components/forms/MutationForm";
import { saveAccountAction } from "@/features/master/actions";
import { accountFields } from "@/features/master/form-config";
import { requireCompanyPermission } from "@/server/auth/require-permission";
import { getMasterOptions } from "@/server/queries/master";

export const metadata: Metadata = { title: "Tambah Akun" };

export default async function NewAccountPage() {
  const context = await requireCompanyPermission("coa.write");
  const options = await getMasterOptions(context.companyId);
  return (
    <EntityPage
      description="Buat akun GL baru dengan tipe, saldo normal, dan aturan posting yang tepat."
      title="Tambah Akun"
    >
      <FormCard>
        <MutationForm
          action={saveAccountAction}
          cancelHref="/master/accounts"
          fields={accountFields(options.accounts)}
        />
      </FormCard>
    </EntityPage>
  );
}
