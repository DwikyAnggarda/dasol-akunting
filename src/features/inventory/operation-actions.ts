"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { MutationState } from "@/features/shared/mutation-state";
import { requireMutationPermission } from "@/server/mutations/context";
import { databaseFailure, validationFailure } from "@/server/mutations/result";
import {
  adjustmentReversalSchema,
  inventoryOperationCommandSchema,
  inventoryOperationSchema,
} from "./schemas";

const value = (data: FormData, name: string) => data.get(name);
const base = (type: "inventory_transfer" | "stock_count") =>
  type === "inventory_transfer" ? "/inventory/transfers" : "/inventory/opname";

export async function saveInventoryOperationAction(
  _state: MutationState,
  formData: FormData,
): Promise<MutationState> {
  let lines: unknown;
  try {
    lines = JSON.parse(String(value(formData, "lines") ?? "[]"));
  } catch {
    return {
      status: "error",
      error: {
        code: "INVALID_LINES",
        message: "Baris operasi stok tidak valid.",
      },
    };
  }
  const parsed = inventoryOperationSchema.safeParse({
    branchId: value(formData, "branchId"),
    destinationWarehouseId: value(formData, "destinationWarehouseId") || "",
    id: value(formData, "id") || "",
    lines,
    offsetAccountId: value(formData, "offsetAccountId") || "",
    operationDate: value(formData, "operationDate"),
    operationType: value(formData, "operationType"),
    reason: value(formData, "reason"),
    sourceWarehouseId: value(formData, "sourceWarehouseId"),
    version: value(formData, "version") || "",
  });
  if (!parsed.success) return validationFailure(parsed.error);
  const { company, supabase } =
    await requireMutationPermission("inventory.write");
  const { data, error } = await supabase.rpc("save_inventory_operation", {
    p_company_id: company.companyId,
    p_header: {
      branch_id: parsed.data.branchId,
      destination_warehouse_id: parsed.data.destinationWarehouseId ?? "",
      offset_account_id: parsed.data.offsetAccountId ?? "",
      operation_date: parsed.data.operationDate,
      reason: parsed.data.reason,
      source_warehouse_id: parsed.data.sourceWarehouseId,
    },
    p_lines: parsed.data.lines.map((line) => ({
      counted_quantity: line.countedQuantity ?? null,
      product_id: line.productId,
      quantity: line.quantity ?? null,
    })),
    p_operation_id: (parsed.data.id ?? null) as unknown as string,
    p_operation_type: parsed.data.operationType,
    p_version: parsed.data.version,
  });
  if (error)
    return databaseFailure(error, "Draft operasi stok tidak dapat disimpan.");
  revalidatePath(base(parsed.data.operationType));
  redirect(`${base(parsed.data.operationType)}/${data}?saved=1`);
}

export async function deleteInventoryOperationAction(
  _state: MutationState,
  formData: FormData,
): Promise<MutationState> {
  const parsed = inventoryOperationCommandSchema.safeParse({
    id: value(formData, "id"),
    operationType: value(formData, "operationType"),
    version: value(formData, "version"),
  });
  if (!parsed.success) return validationFailure(parsed.error);
  const { company, supabase } =
    await requireMutationPermission("inventory.write");
  const { error } = await supabase.rpc("delete_inventory_operation", {
    p_company_id: company.companyId,
    p_operation_id: parsed.data.id,
    p_version: parsed.data.version!,
  });
  if (error)
    return databaseFailure(error, "Draft operasi stok tidak dapat dihapus.");
  revalidatePath(base(parsed.data.operationType));
  redirect(`${base(parsed.data.operationType)}?deleted=1`);
}

export async function submitInventoryOperationAction(
  _state: MutationState,
  formData: FormData,
): Promise<MutationState> {
  const parsed = inventoryOperationCommandSchema.safeParse({
    id: value(formData, "id"),
    operationType: value(formData, "operationType"),
  });
  if (!parsed.success) return validationFailure(parsed.error);
  const { company, supabase } =
    await requireMutationPermission("inventory.submit");
  const { error } = await supabase.rpc("submit_inventory_operation", {
    p_company_id: company.companyId,
    p_operation_id: parsed.data.id,
  });
  if (error)
    return databaseFailure(error, "Operasi stok tidak dapat diajukan.");
  revalidatePath(base(parsed.data.operationType));
  revalidatePath("/approvals");
  redirect(`${base(parsed.data.operationType)}/${parsed.data.id}?submitted=1`);
}

export async function decideInventoryOperationAction(
  _state: MutationState,
  formData: FormData,
): Promise<MutationState> {
  const parsed = inventoryOperationCommandSchema.safeParse({
    action: value(formData, "action"),
    comment: value(formData, "comment") || "",
    id: value(formData, "id"),
    operationType: value(formData, "operationType"),
  });
  if (!parsed.success) return validationFailure(parsed.error);
  if (parsed.data.action === "reject" && (parsed.data.comment?.length ?? 0) < 5)
    return {
      status: "error",
      error: {
        code: "INVALID_REASON",
        message: "Alasan penolakan minimal lima karakter.",
      },
    };
  const { company, supabase } =
    await requireMutationPermission("inventory.approve");
  const { error } = await supabase.rpc("decide_inventory_operation", {
    p_action: parsed.data.action!,
    p_comment: parsed.data.comment,
    p_company_id: company.companyId,
    p_operation_id: parsed.data.id,
  });
  if (error)
    return databaseFailure(
      error,
      "Keputusan operasi stok tidak dapat disimpan.",
    );
  revalidatePath(base(parsed.data.operationType));
  revalidatePath("/approvals");
  redirect(
    `${base(parsed.data.operationType)}/${parsed.data.id}?${parsed.data.action === "approve" ? "approved" : "rejected"}=1`,
  );
}

export async function postInventoryOperationAction(
  _state: MutationState,
  formData: FormData,
): Promise<MutationState> {
  const parsed = inventoryOperationCommandSchema.safeParse({
    id: value(formData, "id"),
    operationType: value(formData, "operationType"),
  });
  if (!parsed.success) return validationFailure(parsed.error);
  const { company, supabase } =
    await requireMutationPermission("inventory.post");
  const { error } = await supabase.rpc("post_inventory_operation", {
    p_company_id: company.companyId,
    p_idempotency_key: `${parsed.data.operationType}:${parsed.data.id}`,
    p_operation_id: parsed.data.id,
  });
  if (error)
    return databaseFailure(error, "Operasi stok tidak dapat diposting.");
  revalidatePath(base(parsed.data.operationType));
  revalidatePath("/inventory/stock");
  revalidatePath("/reports");
  redirect(`${base(parsed.data.operationType)}/${parsed.data.id}?posted=1`);
}

export async function reverseInventoryOperationAction(
  _state: MutationState,
  formData: FormData,
): Promise<MutationState> {
  const parsed = adjustmentReversalSchema.safeParse({
    id: value(formData, "id"),
    reason: value(formData, "reason"),
    reversalDate: value(formData, "reversalDate"),
  });
  const operationType = value(formData, "operationType");
  if (
    !parsed.success ||
    (operationType !== "inventory_transfer" && operationType !== "stock_count")
  )
    return parsed.success
      ? {
          status: "error",
          error: {
            code: "INVALID_TYPE",
            message: "Jenis operasi tidak valid.",
          },
        }
      : validationFailure(parsed.error);
  const { company, supabase } =
    await requireMutationPermission("inventory.reverse");
  const { error } = await supabase.rpc("reverse_inventory_operation", {
    p_company_id: company.companyId,
    p_idempotency_key: `reverse:${operationType}:${parsed.data.id}`,
    p_operation_id: parsed.data.id,
    p_reason: parsed.data.reason,
    p_reversal_date: parsed.data.reversalDate,
  });
  if (error)
    return databaseFailure(error, "Operasi stok tidak dapat direversal.");
  revalidatePath(base(operationType));
  revalidatePath("/inventory/stock");
  revalidatePath("/reports");
  redirect(`${base(operationType)}/${parsed.data.id}?reversed=1`);
}
