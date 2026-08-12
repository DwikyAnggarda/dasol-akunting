import type { Metadata } from "next";

import { EntityPage, FormCard } from "@/components/common/EntityPage";
import { MutationForm } from "@/components/forms/MutationForm";
import { saveTaxCodeAction } from "@/features/master/actions";
import { taxCodeFields } from "@/features/master/form-config";
import { requireCompanyPermission } from "@/server/auth/require-permission";
import { getMasterOptions, getTaxCodeRecord } from "@/server/queries/master";

export const metadata: Metadata = { title: "Edit Kode Pajak" };

export default async function EditTaxCodePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const context = await requireCompanyPermission("settings.manage");
  const [record, options] = await Promise.all([
    getTaxCodeRecord(context.companyId, id),
    getMasterOptions(context.companyId),
  ]);
  return (
    <EntityPage
      description="Ubah identitas dan akun pajak. Gunakan versi baru untuk perubahan tarif."
      title={`Edit ${record.code}`}
    >
      <FormCard>
        <MutationForm
          action={saveTaxCodeAction}
          cancelHref={`/master/taxes/${id}`}
          fields={taxCodeFields(options.accounts, record)}
          hidden={{ id, version: String(record.version) }}
        />
      </FormCard>
    </EntityPage>
  );
}
