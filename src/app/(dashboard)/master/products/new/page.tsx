import type { Metadata } from "next";

import { EntityPage, FormCard } from "@/components/common/EntityPage";
import { MutationForm } from "@/components/forms/MutationForm";
import { saveProductAction } from "@/features/master/actions";
import { productFields } from "@/features/master/form-config";
import { requireCompanyPermission } from "@/server/auth/require-permission";
import { getMasterOptions } from "@/server/queries/master";

export const metadata: Metadata = { title: "Tambah Produk" };

export default async function NewProductPage() {
  const context = await requireCompanyPermission("item.write");
  const options = await getMasterOptions(context.companyId);
  return (
    <EntityPage
      description="Tentukan tipe produk, harga, satuan, pajak, dan akun pencatatan default."
      title="Tambah Produk/Jasa"
    >
      <FormCard>
        <MutationForm
          action={saveProductAction}
          cancelHref="/master/products"
          fields={productFields(options)}
        />
      </FormCard>
    </EntityPage>
  );
}
