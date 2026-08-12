import type { Metadata } from "next";

import { EntityPage, FormCard } from "@/components/common/EntityPage";
import { MutationForm } from "@/components/forms/MutationForm";
import { saveContactAction } from "@/features/master/actions";
import { contactFields } from "@/features/master/form-config";
import { requireCompanyPermission } from "@/server/auth/require-permission";
import { getMasterOptions } from "@/server/queries/master";

export const metadata: Metadata = { title: "Tambah Kontak" };

export default async function NewContactPage() {
  const context = await requireCompanyPermission("contact.write");
  const options = await getMasterOptions(context.companyId);
  return (
    <EntityPage
      description="Simpan profil kontak dan alamat utama secara atomik."
      title="Tambah Pelanggan/Pemasok"
    >
      <FormCard>
        <MutationForm
          action={saveContactAction}
          cancelHref="/master/contacts"
          fields={contactFields(options)}
        />
      </FormCard>
    </EntityPage>
  );
}
