import type { Metadata } from "next";
import { EntityPage, FormCard } from "@/components/common/EntityPage";
import {
  MutationForm,
  type MutationField,
} from "@/components/forms/MutationForm";
import {
  saveAccountingSettingsAction,
  saveCompanyIdentityAction,
} from "@/features/settings/actions";
import { requireCompanyPermission } from "@/server/auth/require-permission";
import { getCompanySettings } from "@/server/queries/settings";
export const metadata: Metadata = { title: "Pengaturan Perusahaan" };
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const query = await searchParams;
  const context = await requireCompanyPermission(
    "settings.manage",
    "company.manage",
  );
  const { company, settings } = await getCompanySettings(context.companyId);
  const identityFields: MutationField[] = [
    {
      defaultValue: company.name,
      label: "Nama perusahaan",
      name: "name",
      required: true,
    },
    {
      defaultValue: company.legal_name,
      label: "Nama legal",
      name: "legalName",
    },
    { defaultValue: company.tax_id, label: "NPWP perusahaan", name: "taxId" },
    {
      defaultValue: company.timezone,
      label: "Zona waktu",
      name: "timezone",
      required: true,
    },
  ];
  const accountingFields: MutationField[] = [
    {
      defaultValue: settings.fiscal_year_start_month,
      label: "Bulan awal tahun fiskal",
      name: "fiscalYearStartMonth",
      required: true,
      type: "number",
    },
    {
      defaultValue: settings.allow_negative_stock,
      label: "Izinkan stok negatif",
      name: "allowNegativeStock",
      type: "checkbox",
    },
    {
      defaultValue: settings.allow_self_approval,
      label: "Izinkan self-approval",
      name: "allowSelfApproval",
      type: "checkbox",
    },
  ];
  return (
    <EntityPage
      description="Identitas tenant dan kebijakan akuntansi yang diterapkan pada validasi server dan database."
      title="Pengaturan Perusahaan"
    >
      {query.saved ? (
        <p
          className="bg-success-50 text-success-700 mb-4 rounded-xl p-3 text-sm"
          role="status"
        >
          Pengaturan berhasil disimpan.
        </p>
      ) : null}
      <div className="grid gap-6 xl:grid-cols-2">
        {context.permissions.includes("company.manage") ? (
          <FormCard>
            <h2 className="mb-5 font-semibold">Identitas Perusahaan</h2>
            <MutationForm
              action={saveCompanyIdentityAction}
              cancelHref="/dashboard"
              fields={identityFields}
              hidden={{ version: String(company.version) }}
            />
          </FormCard>
        ) : null}
        {context.permissions.includes("settings.manage") ? (
          <FormCard>
            <h2 className="mb-5 font-semibold">Kebijakan Akuntansi</h2>
            <MutationForm
              action={saveAccountingSettingsAction}
              cancelHref="/dashboard"
              fields={accountingFields}
              hidden={{ version: String(settings.version) }}
            />
          </FormCard>
        ) : null}
      </div>
    </EntityPage>
  );
}
