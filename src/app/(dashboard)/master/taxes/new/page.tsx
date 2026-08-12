import type { Metadata } from "next";

import { EntityPage, FormCard } from "@/components/common/EntityPage";
import { MutationForm } from "@/components/forms/MutationForm";
import { saveTaxCodeAction } from "@/features/master/actions";
import { taxCodeFields } from "@/features/master/form-config";
import { requireCompanyPermission } from "@/server/auth/require-permission";
import { getMasterOptions } from "@/server/queries/master";

export const metadata: Metadata = { title: "Tambah Kode Pajak" };

export default async function NewTaxCodePage() {
  const context = await requireCompanyPermission("settings.manage");
  const options = await getMasterOptions(context.companyId);
  return (
    <EntityPage
      description="Buat identitas pajak dan pemetaan akun sebelum menambahkan tarif efektif."
      title="Tambah Kode Pajak"
    >
      <FormCard>
        <MutationForm
          action={saveTaxCodeAction}
          cancelHref="/master/taxes"
          fields={taxCodeFields(options.accounts)}
        />
      </FormCard>
    </EntityPage>
  );
}
