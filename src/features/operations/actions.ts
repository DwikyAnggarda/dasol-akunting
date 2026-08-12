"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { MutationState } from "@/features/shared/mutation-state";
import { requireMutationPermission } from "@/server/mutations/context";
import { databaseFailure, validationFailure } from "@/server/mutations/result";
import { operationConfig } from "./config";
import {
  operationalCommandSchema,
  operationalDocumentSchema,
  operationalReversalSchema,
} from "./schemas";
const value = (data: FormData, name: string) => data.get(name);
export async function saveOperationalAction(
  _state: MutationState,
  formData: FormData,
): Promise<MutationState> {
  let lines: unknown = [];
  try {
    lines = JSON.parse(String(value(formData, "lines") ?? "[]"));
  } catch {
    return {
      error: { code: "INVALID_LINES", message: "Baris dokumen tidak valid." },
      status: "error",
    };
  }
  const parsed = operationalDocumentSchema.safeParse({
    branchId: value(formData, "branchId"),
    contactId: value(formData, "contactId"),
    documentDate: value(formData, "documentDate"),
    id: value(formData, "id") || "",
    kind: value(formData, "kind"),
    lines,
    notes: value(formData, "notes") || "",
    version: value(formData, "version") || "",
  });
  if (!parsed.success) return validationFailure(parsed.error);
  const config = operationConfig[parsed.data.kind],
    { company, supabase } = await requireMutationPermission(
      `${config.domain}.${parsed.data.id ? "update" : "create"}`,
    );
  const { data, error } = await supabase.rpc("save_operational_document", {
    p_company_id: company.companyId,
    p_document_id: (parsed.data.id ?? null) as unknown as string,
    p_document_type: parsed.data.kind,
    p_header: {
      branch_id: parsed.data.branchId,
      contact_id: parsed.data.contactId,
      document_date: parsed.data.documentDate,
      notes: parsed.data.notes ?? "",
    },
    p_lines: parsed.data.lines.map((line) => ({
      description: line.description,
      product_id: line.productId,
      quantity: line.quantity,
      source_line_id: line.sourceLineId ?? null,
      unit_amount: line.unitAmount,
      warehouse_id: line.warehouseId,
    })),
    p_version: parsed.data.version,
  });
  if (error)
    return databaseFailure(error, "Draft dokumen tidak dapat disimpan.");
  revalidatePath(config.base);
  redirect(`${config.base}/${data}?saved=1`);
}
export async function deleteOperationalAction(
  _state: MutationState,
  formData: FormData,
): Promise<MutationState> {
  const parsed = operationalCommandSchema.safeParse({
    id: value(formData, "id"),
    kind: value(formData, "kind"),
    version: value(formData, "version"),
  });
  if (!parsed.success) return validationFailure(parsed.error);
  const config = operationConfig[parsed.data.kind],
    { company, supabase } = await requireMutationPermission(
      `${config.domain}.update`,
    );
  const { error } = await supabase.rpc("delete_operational_draft", {
    p_company_id: company.companyId,
    p_document_id: parsed.data.id,
    p_version: parsed.data.version!,
  });
  if (error)
    return databaseFailure(error, "Draft dokumen tidak dapat dihapus.");
  revalidatePath(config.base);
  redirect(`${config.base}?deleted=1`);
}
export async function submitOperationalAction(
  _state: MutationState,
  formData: FormData,
): Promise<MutationState> {
  const parsed = operationalCommandSchema.safeParse({
    id: value(formData, "id"),
    kind: value(formData, "kind"),
  });
  if (!parsed.success) return validationFailure(parsed.error);
  const config = operationConfig[parsed.data.kind],
    { company, supabase } = await requireMutationPermission(
      `${config.domain}.submit`,
    );
  const { error } = await supabase.rpc("submit_operational_document", {
    p_company_id: company.companyId,
    p_document_id: parsed.data.id,
  });
  if (error) return databaseFailure(error, "Dokumen tidak dapat diajukan.");
  revalidatePath(config.base);
  revalidatePath("/approvals");
  redirect(`${config.base}/${parsed.data.id}?submitted=1`);
}
export async function decideOperationalAction(
  _state: MutationState,
  formData: FormData,
): Promise<MutationState> {
  const parsed = operationalCommandSchema.safeParse({
    action: value(formData, "action"),
    comment: value(formData, "comment") || "",
    id: value(formData, "id"),
    kind: value(formData, "kind"),
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
  const config = operationConfig[parsed.data.kind],
    { company, supabase } = await requireMutationPermission(
      `${config.domain}.approve`,
    );
  const { error } = await supabase.rpc("decide_operational_document", {
    p_action: parsed.data.action!,
    p_comment: parsed.data.comment,
    p_company_id: company.companyId,
    p_document_id: parsed.data.id,
  });
  if (error)
    return databaseFailure(error, "Keputusan dokumen tidak dapat disimpan.");
  revalidatePath(config.base);
  revalidatePath("/approvals");
  redirect(
    `${config.base}/${parsed.data.id}?${parsed.data.action === "approve" ? "approved" : "rejected"}=1`,
  );
}
export async function convertOperationalAction(
  _state: MutationState,
  formData: FormData,
): Promise<MutationState> {
  const parsed = operationalCommandSchema.safeParse({
    id: value(formData, "id"),
    kind: value(formData, "kind"),
  });
  if (!parsed.success) return validationFailure(parsed.error);
  const config = operationConfig[parsed.data.kind],
    target =
      parsed.data.kind === "sales_quotation"
        ? operationConfig.sales_order
        : parsed.data.kind === "sales_order"
          ? operationConfig.sales_delivery
          : parsed.data.kind === "purchase_request"
            ? operationConfig.purchase_order
            : operationConfig.goods_receipt,
    { company, supabase } = await requireMutationPermission(
      `${config.domain}.create`,
    );
  const { data, error } = await supabase.rpc("convert_operational_document", {
    p_company_id: company.companyId,
    p_source_id: parsed.data.id,
  });
  if (error) return databaseFailure(error, "Order tidak dapat dikonversi.");
  revalidatePath(config.base);
  revalidatePath(target.base);
  redirect(`${target.base}/${data}?converted=1`);
}
export async function postOperationalAction(
  _state: MutationState,
  formData: FormData,
): Promise<MutationState> {
  const parsed = operationalCommandSchema.safeParse({
    id: value(formData, "id"),
    kind: value(formData, "kind"),
  });
  if (!parsed.success) return validationFailure(parsed.error);
  const config = operationConfig[parsed.data.kind],
    { company, supabase } = await requireMutationPermission(
      `${config.domain}.post`,
    );
  const { error } = await supabase.rpc("post_operational_fulfillment", {
    p_company_id: company.companyId,
    p_document_id: parsed.data.id,
    p_idempotency_key: `${parsed.data.kind}:${parsed.data.id}`,
  });
  if (error)
    return databaseFailure(error, "Fulfillment tidak dapat diposting.");
  revalidatePath(config.base);
  revalidatePath("/inventory");
  revalidatePath("/reports");
  redirect(`${config.base}/${parsed.data.id}?posted=1`);
}
export async function reverseOperationalAction(
  _state: MutationState,
  formData: FormData,
): Promise<MutationState> {
  const parsed = operationalReversalSchema.safeParse({
    id: value(formData, "id"),
    kind: value(formData, "kind"),
    reason: value(formData, "reason"),
    reversalDate: value(formData, "reversalDate"),
  });
  if (!parsed.success) return validationFailure(parsed.error);
  const config = operationConfig[parsed.data.kind],
    { company, supabase } = await requireMutationPermission(
      `${config.domain}.post`,
    );
  const { error } = await supabase.rpc("reverse_operational_fulfillment", {
    p_company_id: company.companyId,
    p_document_id: parsed.data.id,
    p_idempotency_key: `reverse:${parsed.data.kind}:${parsed.data.id}`,
    p_reason: parsed.data.reason,
    p_reversal_date: parsed.data.reversalDate,
  });
  if (error)
    return databaseFailure(error, "Fulfillment tidak dapat direversal.");
  revalidatePath(config.base);
  revalidatePath("/inventory");
  revalidatePath("/reports");
  redirect(`${config.base}/${parsed.data.id}?reversed=1`);
}
