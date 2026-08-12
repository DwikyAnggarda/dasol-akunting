import type { Metadata } from "next";

import { EntityPage, FormCard } from "@/components/common/EntityPage";
import { MutationForm } from "@/components/forms/MutationForm";
import { saveWarehouseAction } from "@/features/master/actions";
import { warehouseFields } from "@/features/master/form-config";
import { requireCompanyPermission } from "@/server/auth/require-permission";
import { getMasterOptions } from "@/server/queries/master";

export const metadata: Metadata = { title: "Tambah Gudang" };

export default async function NewWarehousePage() {
  const context = await requireCompanyPermission("settings.manage");
  const options = await getMasterOptions(context.companyId);
  return (
    <EntityPage
      description="Daftarkan lokasi gudang pada cabang yang tepat."
      title="Tambah Gudang"
    >
      <FormCard>
        <MutationForm
          action={saveWarehouseAction}
          cancelHref="/master/warehouses"
          fields={warehouseFields(options.branches)}
        />
      </FormCard>
    </EntityPage>
  );
}
