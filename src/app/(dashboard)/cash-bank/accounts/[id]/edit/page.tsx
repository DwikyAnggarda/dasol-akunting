import type { Metadata } from "next";
import { EntityPage, FormCard } from "@/components/common/EntityPage";
import { MutationForm } from "@/components/forms/MutationForm";
import { saveBankAccountAction } from "@/features/master/actions";
import { bankAccountFields } from "@/features/master/form-config";
import { requireCompanyPermission } from "@/server/auth/require-permission";
import {
  getBankAccountRecord,
  getMasterOptions,
} from "@/server/queries/master";
export const metadata: Metadata = { title: "Edit Akun Bank/Kas" };
export default async function EditBankAccountPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const context = await requireCompanyPermission("settings.manage");
  const [record, options] = await Promise.all([
    getBankAccountRecord(context.companyId, id),
    getMasterOptions(context.companyId),
  ]);
  return (
    <EntityPage
      description="Perbarui informasi rekening dan akun GL terkait."
      title={`Edit ${record.code}`}
    >
      <FormCard>
        <MutationForm
          action={saveBankAccountAction}
          cancelHref={`/cash-bank/accounts/${id}`}
          fields={bankAccountFields(
            options.accounts.filter((item) => item.type === "asset"),
            record,
          )}
          hidden={{ id, version: String(record.version) }}
        />
      </FormCard>
    </EntityPage>
  );
}
