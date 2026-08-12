import type { Metadata } from "next";
import { EntityPage, FormCard } from "@/components/common/EntityPage";
import { MutationForm } from "@/components/forms/MutationForm";
import { saveBankAccountAction } from "@/features/master/actions";
import { bankAccountFields } from "@/features/master/form-config";
import { requireCompanyPermission } from "@/server/auth/require-permission";
import { getMasterOptions } from "@/server/queries/master";
export const metadata: Metadata = { title: "Tambah Akun Bank/Kas" };
export default async function NewBankAccountPage() {
  const context = await requireCompanyPermission("settings.manage");
  const options = await getMasterOptions(context.companyId);
  return (
    <EntityPage
      description="Peta rekening operasional ke akun GL kas atau bank."
      title="Tambah Akun Bank/Kas"
    >
      <FormCard>
        <MutationForm
          action={saveBankAccountAction}
          cancelHref="/cash-bank/accounts"
          fields={bankAccountFields(
            options.accounts.filter((item) => item.type === "asset"),
          )}
        />
      </FormCard>
    </EntityPage>
  );
}
