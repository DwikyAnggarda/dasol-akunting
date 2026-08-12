import type { Metadata } from "next";

import { EntityPage, FormCard } from "@/components/common/EntityPage";
import { MutationForm } from "@/components/forms/MutationForm";
import { saveAccountAction } from "@/features/master/actions";
import { accountFields } from "@/features/master/form-config";
import { requireCompanyPermission } from "@/server/auth/require-permission";
import { getAccountRecord, getMasterOptions } from "@/server/queries/master";

export const metadata: Metadata = { title: "Edit Akun" };

export default async function EditAccountPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const context = await requireCompanyPermission("coa.write");
  const [record, options] = await Promise.all([
    getAccountRecord(context.companyId, id),
    getMasterOptions(context.companyId),
  ]);
  return (
    <EntityPage
      description="Perubahan struktur yang dapat merusak histori jurnal akan ditolak oleh database."
      title={`Edit ${record.code}`}
    >
      <FormCard>
        <MutationForm
          action={saveAccountAction}
          cancelHref={`/master/accounts/${id}`}
          fields={accountFields(
            options.accounts.filter((item) => item.value !== id),
            record,
          )}
          hidden={{ id, version: String(record.version) }}
        />
      </FormCard>
    </EntityPage>
  );
}
