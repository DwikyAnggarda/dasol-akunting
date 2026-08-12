import type { Metadata } from "next";

import { EntityPage, FormCard } from "@/components/common/EntityPage";
import { AccountMappingForm } from "@/features/settings/AccountMappingForm";
import { requireCompanyPermission } from "@/server/auth/require-permission";
import { getAccountMappingSettings } from "@/server/queries/access-settings";

export const metadata: Metadata = { title: "Pemetaan Akun" };

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const params = await searchParams;
  const context = await requireCompanyPermission("settings.manage");
  const data = await getAccountMappingSettings(context.companyId);
  return (
    <EntityPage
      description="Pilih akun aktif yang digunakan posting engine. Semua ID disimpan sebagai konfigurasi perusahaan, bukan hard-coded di aplikasi."
      title="Pemetaan Akun"
    >
      {params.saved ? (
        <p
          className="bg-success-50 text-success-700 mb-4 rounded-xl p-3 text-sm"
          role="status"
        >
          Pemetaan akun berhasil disimpan.
        </p>
      ) : null}
      <FormCard>
        <AccountMappingForm accounts={data.accounts} mappings={data.mappings} />
      </FormCard>
    </EntityPage>
  );
}
