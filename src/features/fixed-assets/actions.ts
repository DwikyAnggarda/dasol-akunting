"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import type { MutationState } from "@/features/shared/mutation-state";
import { requireMutationPermission } from "@/server/mutations/context";
import {
  conflictFailure,
  databaseFailure,
  validationFailure,
} from "@/server/mutations/result";

import {
  assetCommandSchema,
  assetSchema,
  categorySchema,
  depreciationSchema,
  disposalSchema,
} from "./schemas";

const value = (data: FormData, name: string) => data.get(name);

export async function saveAssetCategoryAction(
  _state: MutationState,
  formData: FormData,
): Promise<MutationState> {
  const parsed = categorySchema.safeParse({
    accumulatedAccountId: value(formData, "accumulatedAccountId"),
    assetAccountId: value(formData, "assetAccountId"),
    code: value(formData, "code"),
    expenseAccountId: value(formData, "expenseAccountId"),
    id: value(formData, "id") || "",
    name: value(formData, "name"),
    usefulLife: value(formData, "usefulLife"),
    version: value(formData, "version") || "",
  });
  if (!parsed.success) return validationFailure(parsed.error);
  const { company, supabase, user } =
    await requireMutationPermission("fixed_asset.write");
  const payload = {
    accumulated_depreciation_account_id: parsed.data.accumulatedAccountId,
    asset_account_id: parsed.data.assetAccountId,
    code: parsed.data.code,
    depreciation_expense_account_id: parsed.data.expenseAccountId,
    default_useful_life_months: parsed.data.usefulLife,
    name: parsed.data.name,
    updated_by: user.id,
  };
  if (parsed.data.id) {
    const { data, error } = await supabase
      .from("fixed_asset_categories")
      .update(payload)
      .eq("company_id", company.companyId)
      .eq("id", parsed.data.id)
      .eq("version", parsed.data.version)
      .select("id")
      .maybeSingle();
    if (error)
      return databaseFailure(error, "Kategori aset tidak dapat diperbarui.");
    if (!data) return conflictFailure();
  } else {
    const { error } = await supabase.from("fixed_asset_categories").insert({
      ...payload,
      company_id: company.companyId,
      created_by: user.id,
    });
    if (error)
      return databaseFailure(error, "Kategori aset tidak dapat dibuat.");
  }
  revalidatePath("/fixed-assets/categories");
  redirect("/fixed-assets/categories?saved=1");
}

export async function toggleAssetCategoryAction(
  _state: MutationState,
  formData: FormData,
): Promise<MutationState> {
  const parsed = zToggle.safeParse({
    activate: value(formData, "activate"),
    id: value(formData, "id"),
    version: value(formData, "version"),
  });
  if (!parsed.success) return validationFailure(parsed.error);
  const { company, supabase, user } =
    await requireMutationPermission("fixed_asset.write");
  const { data, error } = await supabase
    .from("fixed_asset_categories")
    .update({ is_active: parsed.data.activate, updated_by: user.id })
    .eq("company_id", company.companyId)
    .eq("id", parsed.data.id)
    .eq("version", parsed.data.version)
    .select("id")
    .maybeSingle();
  if (error)
    return databaseFailure(error, "Status kategori tidak dapat diubah.");
  if (!data) return conflictFailure();
  revalidatePath("/fixed-assets/categories");
  redirect("/fixed-assets/categories?statusChanged=1");
}

import { z } from "zod";
const zToggle = z.object({
  activate: z.enum(["true", "false"]).transform((value) => value === "true"),
  id: z.uuid(),
  version: z.coerce.number().int().positive(),
});

export async function saveFixedAssetAction(
  _state: MutationState,
  formData: FormData,
): Promise<MutationState> {
  const parsed = assetSchema.safeParse({
    acquisitionCost: value(formData, "acquisitionCost"),
    acquisitionDate: value(formData, "acquisitionDate"),
    assetCode: value(formData, "assetCode"),
    categoryId: value(formData, "categoryId"),
    id: value(formData, "id") || "",
    inServiceDate: value(formData, "inServiceDate"),
    name: value(formData, "name"),
    residualValue: value(formData, "residualValue"),
    usefulLife: value(formData, "usefulLife"),
    version: value(formData, "version") || "",
  });
  if (!parsed.success) return validationFailure(parsed.error);
  const { company, supabase } =
    await requireMutationPermission("fixed_asset.write");
  const { data, error } = await supabase.rpc("save_fixed_asset", {
    p_asset: {
      acquisition_cost: parsed.data.acquisitionCost,
      acquisition_date: parsed.data.acquisitionDate,
      asset_code: parsed.data.assetCode,
      category_id: parsed.data.categoryId,
      in_service_date: parsed.data.inServiceDate,
      name: parsed.data.name,
      residual_value: parsed.data.residualValue,
      useful_life_months: parsed.data.usefulLife,
    },
    p_asset_id: (parsed.data.id ?? null) as unknown as string,
    p_company_id: company.companyId,
    p_version: parsed.data.version,
  });
  if (error) return databaseFailure(error, "Aset tetap tidak dapat disimpan.");
  revalidatePath("/fixed-assets");
  redirect(`/fixed-assets/${data}?saved=1`);
}

export async function deleteFixedAssetAction(
  _state: MutationState,
  formData: FormData,
): Promise<MutationState> {
  const parsed = assetCommandSchema.safeParse({
    id: value(formData, "id"),
    version: value(formData, "version"),
  });
  if (!parsed.success) return validationFailure(parsed.error);
  const { company, supabase } =
    await requireMutationPermission("fixed_asset.write");
  const { error } = await supabase.rpc("delete_fixed_asset_draft", {
    p_asset_id: parsed.data.id,
    p_company_id: company.companyId,
    p_version: parsed.data.version!,
  });
  if (error) return databaseFailure(error, "Draft aset tidak dapat dihapus.");
  revalidatePath("/fixed-assets");
  redirect("/fixed-assets?deleted=1");
}

export async function activateFixedAssetAction(
  _state: MutationState,
  formData: FormData,
): Promise<MutationState> {
  const parsed = assetCommandSchema.safeParse({ id: value(formData, "id") });
  if (!parsed.success) return validationFailure(parsed.error);
  const { company, supabase } =
    await requireMutationPermission("fixed_asset.post");
  const { error } = await supabase.rpc("activate_fixed_asset", {
    p_asset_id: parsed.data.id,
    p_company_id: company.companyId,
  });
  if (error) return databaseFailure(error, "Aset tidak dapat diaktifkan.");
  revalidatePath("/fixed-assets");
  redirect(`/fixed-assets/${parsed.data.id}?activated=1`);
}

export async function postDepreciationAction(
  _state: MutationState,
  formData: FormData,
): Promise<MutationState> {
  const parsed = depreciationSchema.safeParse({
    id: value(formData, "id"),
    throughDate: value(formData, "throughDate"),
  });
  if (!parsed.success) return validationFailure(parsed.error);
  const { company, supabase } =
    await requireMutationPermission("fixed_asset.post");
  const { data, error } = await supabase.rpc("post_fixed_asset_depreciation", {
    p_asset_id: parsed.data.id,
    p_company_id: company.companyId,
    p_through_date: parsed.data.throughDate,
  });
  if (error) return databaseFailure(error, "Penyusutan tidak dapat diposting.");
  revalidatePath("/fixed-assets");
  revalidatePath("/reports");
  redirect(`/fixed-assets/${parsed.data.id}?depreciated=${data}`);
}

export async function disposeFixedAssetAction(
  _state: MutationState,
  formData: FormData,
): Promise<MutationState> {
  const parsed = disposalSchema.safeParse({
    disposalDate: value(formData, "disposalDate"),
    gainLossAccountId: value(formData, "gainLossAccountId"),
    id: value(formData, "id"),
    proceeds: value(formData, "proceeds"),
    proceedsAccountId: value(formData, "proceedsAccountId") || "",
    reason: value(formData, "reason"),
  });
  if (!parsed.success) return validationFailure(parsed.error);
  const { company, supabase } = await requireMutationPermission(
    "fixed_asset.dispose",
  );
  const { error } = await supabase.rpc("dispose_fixed_asset", {
    p_asset_id: parsed.data.id,
    p_company_id: company.companyId,
    p_disposal_date: parsed.data.disposalDate,
    p_gain_loss_account_id: parsed.data.gainLossAccountId,
    p_idempotency_key: `fixed-asset-disposal:${parsed.data.id}`,
    p_proceeds: parsed.data.proceeds,
    p_proceeds_account_id: (parsed.data.proceedsAccountId ??
      null) as unknown as string,
    p_reason: parsed.data.reason,
  });
  if (error) return databaseFailure(error, "Aset tidak dapat didisposal.");
  revalidatePath("/fixed-assets");
  revalidatePath("/reports");
  redirect(`/fixed-assets/${parsed.data.id}?disposed=1`);
}
