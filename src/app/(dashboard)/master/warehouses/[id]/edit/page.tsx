import type { Metadata } from "next";

import { EntityPage, FormCard } from "@/components/common/EntityPage";
import { MutationForm } from "@/components/forms/MutationForm";
import { saveWarehouseAction } from "@/features/master/actions";
import { warehouseFields } from "@/features/master/form-config";
import { requireCompanyPermission } from "@/server/auth/require-permission";
import { getMasterOptions, getWarehouseRecord } from "@/server/queries/master";

export const metadata: Metadata = { title: "Edit Gudang" };

export default async function EditWarehousePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const context = await requireCompanyPermission("settings.manage");
  const [record, options] = await Promise.all([
    getWarehouseRecord(context.companyId, id),
    getMasterOptions(context.companyId),
  ]);
  return (
    <EntityPage
      description="Perbarui cabang atau alamat gudang tanpa mengubah histori stok."
      title={`Edit ${record.code}`}
    >
      <FormCard>
        <MutationForm
          action={saveWarehouseAction}
          cancelHref={`/master/warehouses/${id}`}
          fields={warehouseFields(options.branches, record)}
          hidden={{ id, version: String(record.version) }}
        />
      </FormCard>
    </EntityPage>
  );
}
