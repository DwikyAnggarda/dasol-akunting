import { EntityPage, FormCard } from "@/components/common/EntityPage";
import { saveReconciliationAction } from "@/features/reconciliation/actions";
import { ReconciliationForm } from "@/features/reconciliation/ReconciliationForm";
import { requireCompanyPermission } from "@/server/auth/require-permission";
import { getReconciliationOptions } from "@/server/queries/reconciliation";
export default async function Page() {
  const context = await requireCompanyPermission("settings.manage"),
    options = await getReconciliationOptions(context.companyId);
  return (
    <EntityPage
      description="CSV diparse dan divalidasi sebelum seluruh baris disimpan secara atomik."
      title="Import Statement Bank"
    >
      <FormCard>
        <ReconciliationForm
          action={saveReconciliationAction}
          banks={options.banks.map((row) => ({
            label: `${row.code} — ${row.name}`,
            value: row.id,
          }))}
          today={new Date().toISOString().slice(0, 10)}
        />
      </FormCard>
    </EntityPage>
  );
}
