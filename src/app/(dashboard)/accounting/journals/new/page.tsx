import type { Metadata } from "next";
import { EntityPage, FormCard } from "@/components/common/EntityPage";
import { postManualJournalAction } from "@/features/accounting/actions";
import { JournalForm } from "@/features/accounting/JournalForm";
import { requireCompanyPermission } from "@/server/auth/require-permission";
import { getJournalOptions } from "@/server/queries/accounting";
export const metadata: Metadata = { title: "Jurnal Manual" };
export default async function Page() {
  const context = await requireCompanyPermission("journal.post");
  const options = await getJournalOptions(context.companyId);
  return (
    <EntityPage
      description="Jurnal harus seimbang, menggunakan akun aktif non-kontrol, dan berada pada periode terbuka."
      title="Jurnal Manual"
    >
      <FormCard>
        <JournalForm
          accounts={options.accounts}
          action={postManualJournalAction}
          branches={options.branches}
          today={new Date().toISOString().slice(0, 10)}
        />
      </FormCard>
    </EntityPage>
  );
}
