"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import type { MutationState } from "@/features/shared/mutation-state";
import { requireMutationPermission } from "@/server/mutations/context";
import { databaseFailure, validationFailure } from "@/server/mutations/result";

import {
  adjustmentCommandSchema,
  adjustmentReversalSchema,
  adjustmentSchema,
} from "./schemas";

const value = (data: FormData, name: string) => data.get(name);

export async function saveAdjustmentAction(
  _state: MutationState,
  formData: FormData,
): Promise<MutationState> {
  let lines: unknown = [];
  try {
    lines = JSON.parse(String(value(formData, "lines") ?? "[]"));
  } catch {
    return {
      error: {
        code: "INVALID_LINES",
        message: "Baris adjustment tidak valid.",
      },
      status: "error",
    };
  }
  const parsed = adjustmentSchema.safeParse({
    adjustmentDate: value(formData, "adjustmentDate"),
    adjustmentType: value(formData, "adjustmentType"),
    branchId: value(formData, "branchId"),
    id: value(formData, "id") || "",
    lines,
    offsetAccountId: value(formData, "offsetAccountId"),
    reason: value(formData, "reason"),
    version: value(formData, "version") || "",
    warehouseId: value(formData, "warehouseId"),
  });
  if (!parsed.success) return validationFailure(parsed.error);
  const { company, supabase } =
    await requireMutationPermission("inventory.write");
  const { data, error } = await supabase.rpc("save_inventory_adjustment", {
    p_adjustment_id: (parsed.data.id ?? null) as unknown as string,
    p_company_id: company.companyId,
    p_header: {
      adjustment_date: parsed.data.adjustmentDate,
      adjustment_type: parsed.data.adjustmentType,
      branch_id: parsed.data.branchId,
      offset_account_id: parsed.data.offsetAccountId,
      reason: parsed.data.reason,
      warehouse_id: parsed.data.warehouseId,
    },
    p_lines: parsed.data.lines.map((line) => ({
      product_id: line.productId,
      quantity: line.quantity,
      unit_cost: line.unitCost,
    })),
    p_version: parsed.data.version,
  });
  if (error)
    return databaseFailure(error, "Draft adjustment tidak dapat disimpan.");
  revalidatePath("/inventory/adjustments");
  redirect(`/inventory/adjustments/${data}?saved=1`);
}

export async function deleteAdjustmentAction(
  _state: MutationState,
  formData: FormData,
): Promise<MutationState> {
  const parsed = adjustmentCommandSchema.safeParse({
    id: value(formData, "id"),
    version: value(formData, "version"),
  });
  if (!parsed.success) return validationFailure(parsed.error);
  const { company, supabase } =
    await requireMutationPermission("inventory.write");
  const { error } = await supabase.rpc("delete_inventory_adjustment", {
    p_adjustment_id: parsed.data.id,
    p_company_id: company.companyId,
    p_version: parsed.data.version!,
  });
  if (error)
    return databaseFailure(error, "Draft adjustment tidak dapat dihapus.");
  revalidatePath("/inventory/adjustments");
  redirect("/inventory/adjustments?deleted=1");
}

export async function submitAdjustmentAction(
  _state: MutationState,
  formData: FormData,
): Promise<MutationState> {
  const parsed = adjustmentCommandSchema.safeParse({
    id: value(formData, "id"),
  });
  if (!parsed.success) return validationFailure(parsed.error);
  const { company, supabase } =
    await requireMutationPermission("inventory.submit");
  const { error } = await supabase.rpc("submit_inventory_adjustment", {
    p_adjustment_id: parsed.data.id,
    p_company_id: company.companyId,
  });
  if (error) return databaseFailure(error, "Adjustment tidak dapat diajukan.");
  revalidatePath("/inventory/adjustments");
  revalidatePath("/approvals");
  redirect(`/inventory/adjustments/${parsed.data.id}?submitted=1`);
}

export async function decideAdjustmentAction(
  _state: MutationState,
  formData: FormData,
): Promise<MutationState> {
  const parsed = adjustmentCommandSchema.safeParse({
    action: value(formData, "action"),
    comment: value(formData, "comment") || "",
    id: value(formData, "id"),
  });
  if (!parsed.success) return validationFailure(parsed.error);
  if (parsed.data.action === "reject" && (parsed.data.comment?.length ?? 0) < 5)
    return {
      error: {
        code: "INVALID_REASON",
        message: "Alasan penolakan minimal lima karakter.",
      },
      status: "error",
    };
  const { company, supabase } =
    await requireMutationPermission("inventory.approve");
  const { error } = await supabase.rpc("decide_inventory_adjustment", {
    p_action: parsed.data.action!,
    p_adjustment_id: parsed.data.id,
    p_comment: parsed.data.comment,
    p_company_id: company.companyId,
  });
  if (error)
    return databaseFailure(error, "Keputusan adjustment tidak dapat disimpan.");
  revalidatePath("/inventory/adjustments");
  revalidatePath("/approvals");
  redirect(
    `/inventory/adjustments/${parsed.data.id}?${parsed.data.action === "approve" ? "approved" : "rejected"}=1`,
  );
}

export async function postAdjustmentAction(
  _state: MutationState,
  formData: FormData,
): Promise<MutationState> {
  const parsed = adjustmentCommandSchema.safeParse({
    id: value(formData, "id"),
  });
  if (!parsed.success) return validationFailure(parsed.error);
  const { company, supabase } =
    await requireMutationPermission("inventory.post");
  const { error } = await supabase.rpc("post_inventory_adjustment", {
    p_adjustment_id: parsed.data.id,
    p_company_id: company.companyId,
    p_idempotency_key: `inventory-adjustment:${parsed.data.id}`,
  });
  if (error) return databaseFailure(error, "Adjustment tidak dapat diposting.");
  revalidatePath("/inventory");
  revalidatePath("/reports");
  revalidatePath("/dashboard");
  redirect(`/inventory/adjustments/${parsed.data.id}?posted=1`);
}

export async function reverseAdjustmentAction(
  _state: MutationState,
  formData: FormData,
): Promise<MutationState> {
  const parsed = adjustmentReversalSchema.safeParse({
    id: value(formData, "id"),
    reason: value(formData, "reason"),
    reversalDate: value(formData, "reversalDate"),
  });
  if (!parsed.success) return validationFailure(parsed.error);
  const { company, supabase } =
    await requireMutationPermission("inventory.reverse");
  const { error } = await supabase.rpc("reverse_inventory_adjustment", {
    p_adjustment_id: parsed.data.id,
    p_company_id: company.companyId,
    p_idempotency_key: `reverse:inventory-adjustment:${parsed.data.id}`,
    p_reason: parsed.data.reason,
    p_reversal_date: parsed.data.reversalDate,
  });
  if (error)
    return databaseFailure(error, "Adjustment tidak dapat direversal.");
  revalidatePath("/inventory");
  revalidatePath("/reports");
  revalidatePath("/dashboard");
  redirect(`/inventory/adjustments/${parsed.data.id}?reversed=1`);
}
