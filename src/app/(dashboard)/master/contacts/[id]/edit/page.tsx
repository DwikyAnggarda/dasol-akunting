import type { Metadata } from "next";

import { EntityPage, FormCard } from "@/components/common/EntityPage";
import { MutationForm } from "@/components/forms/MutationForm";
import { saveContactAction } from "@/features/master/actions";
import { contactFields } from "@/features/master/form-config";
import { requireCompanyPermission } from "@/server/auth/require-permission";
import { getContactRecord, getMasterOptions } from "@/server/queries/master";

export const metadata: Metadata = { title: "Edit Kontak" };

export default async function EditContactPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const context = await requireCompanyPermission("contact.write");
  const [record, options] = await Promise.all([
    getContactRecord(context.companyId, id),
    getMasterOptions(context.companyId),
  ]);
  return (
    <EntityPage
      description="Profil dan alamat utama disimpan dalam satu transaksi database."
      title={`Edit ${record.code}`}
    >
      <FormCard>
        <MutationForm
          action={saveContactAction}
          cancelHref={`/master/contacts/${id}`}
          fields={contactFields(options, record)}
          hidden={{ id, version: String(record.version) }}
        />
      </FormCard>
    </EntityPage>
  );
}
