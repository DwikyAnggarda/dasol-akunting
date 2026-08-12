import type { Metadata } from "next";

import { EntityPage, FormCard } from "@/components/common/EntityPage";
import { MutationForm } from "@/components/forms/MutationForm";
import { saveProductAction } from "@/features/master/actions";
import { productFields } from "@/features/master/form-config";
import { requireCompanyPermission } from "@/server/auth/require-permission";
import { getMasterOptions, getProductRecord } from "@/server/queries/master";

export const metadata: Metadata = { title: "Edit Produk" };

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const context = await requireCompanyPermission("item.write");
  const [record, options] = await Promise.all([
    getProductRecord(context.companyId, id),
    getMasterOptions(context.companyId),
  ]);
  return (
    <EntityPage
      description="Jenis produk yang sudah memiliki mutasi stok tidak dapat diubah."
      title={`Edit ${record.sku}`}
    >
      <FormCard>
        <MutationForm
          action={saveProductAction}
          cancelHref={`/master/products/${id}`}
          fields={productFields(options, record)}
          hidden={{ id, version: String(record.version) }}
        />
      </FormCard>
    </EntityPage>
  );
}
