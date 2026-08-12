"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { MutationState } from "@/features/shared/mutation-state";
import { requireMutationPermission } from "@/server/mutations/context";
import { databaseFailure, validationFailure } from "@/server/mutations/result";
import {
  returnCommandSchema,
  returnReversalSchema,
  returnSchema,
} from "./schemas";
const value = (data: FormData, name: string) => data.get(name),
  base = (kind: "sales_return" | "purchase_return") =>
    kind === "sales_return" ? "/sales/returns" : "/purchases/returns",
  domain = (kind: "sales_return" | "purchase_return") =>
    kind === "sales_return" ? "sales" : "purchase";
export async function saveReturnAction(
  _state: MutationState,
  formData: FormData,
): Promise<MutationState> {
  let lines: unknown;
  try {
    lines = JSON.parse(String(value(formData, "lines") ?? "[]"));
  } catch {
    return {
      status: "error",
      error: { code: "INVALID_LINES", message: "Baris retur tidak valid." },
    };
  }
  const parsed = returnSchema.safeParse({
    id: value(formData, "id") || "",
    kind: value(formData, "kind"),
    lines,
    reason: value(formData, "reason"),
    returnDate: value(formData, "returnDate"),
    sourceInvoiceId: value(formData, "sourceInvoiceId"),
    version: value(formData, "version") || "",
  });
  if (!parsed.success) return validationFailure(parsed.error);
  const { company, supabase } = await requireMutationPermission(
    `${domain(parsed.data.kind)}.${parsed.data.id ? "update" : "create"}`,
  );
  const { data, error } = await supabase.rpc("save_return_document", {
    p_company_id: company.companyId,
    p_lines: parsed.data.lines.map((line) => ({
      quantity: line.quantity,
      source_line_id: line.sourceLineId,
      warehouse_id: line.warehouseId ?? null,
    })),
    p_reason: parsed.data.reason,
    p_return_date: parsed.data.returnDate,
    p_return_id: (parsed.data.id ?? null) as unknown as string,
    p_return_type: parsed.data.kind,
    p_source_invoice_id: parsed.data.sourceInvoiceId,
    p_version: parsed.data.version,
  });
  if (error) return databaseFailure(error, "Draft retur tidak dapat disimpan.");
  revalidatePath(base(parsed.data.kind));
  redirect(`${base(parsed.data.kind)}/${data}?saved=1`);
}
export async function deleteReturnAction(
  _state: MutationState,
  formData: FormData,
): Promise<MutationState> {
  const parsed = returnCommandSchema.safeParse({
    id: value(formData, "id"),
    kind: value(formData, "kind"),
    version: value(formData, "version"),
  });
  if (!parsed.success) return validationFailure(parsed.error);
  const { company, supabase } = await requireMutationPermission(
    `${domain(parsed.data.kind)}.update`,
  );
  const { error } = await supabase.rpc("delete_return_draft", {
    p_company_id: company.companyId,
    p_return_id: parsed.data.id,
    p_version: parsed.data.version!,
  });
  if (error) return databaseFailure(error, "Draft retur tidak dapat dihapus.");
  revalidatePath(base(parsed.data.kind));
  redirect(`${base(parsed.data.kind)}?deleted=1`);
}
export async function submitReturnAction(
  _state: MutationState,
  formData: FormData,
): Promise<MutationState> {
  const parsed = returnCommandSchema.safeParse({
    id: value(formData, "id"),
    kind: value(formData, "kind"),
  });
  if (!parsed.success) return validationFailure(parsed.error);
  const { company, supabase } = await requireMutationPermission(
    `${domain(parsed.data.kind)}.submit`,
  );
  const { error } = await supabase.rpc("submit_return_document", {
    p_company_id: company.companyId,
    p_return_id: parsed.data.id,
  });
  if (error) return databaseFailure(error, "Retur tidak dapat diajukan.");
  revalidatePath(base(parsed.data.kind));
  revalidatePath("/approvals");
  redirect(`${base(parsed.data.kind)}/${parsed.data.id}?submitted=1`);
}
export async function decideReturnAction(
  _state: MutationState,
  formData: FormData,
): Promise<MutationState> {
  const parsed = returnCommandSchema.safeParse({
    action: value(formData, "action"),
    comment: value(formData, "comment") || "",
    id: value(formData, "id"),
    kind: value(formData, "kind"),
  });
  if (!parsed.success) return validationFailure(parsed.error);
  if (parsed.data.action === "reject" && (parsed.data.comment?.length ?? 0) < 5)
    return {
      status: "error",
      error: {
        code: "INVALID_REASON",
        message: "Alasan minimal lima karakter.",
      },
    };
  const { company, supabase } = await requireMutationPermission(
    `${domain(parsed.data.kind)}.approve`,
  );
  const { error } = await supabase.rpc("decide_return_document", {
    p_action: parsed.data.action!,
    p_comment: parsed.data.comment,
    p_company_id: company.companyId,
    p_return_id: parsed.data.id,
  });
  if (error)
    return databaseFailure(error, "Keputusan retur tidak dapat disimpan.");
  revalidatePath(base(parsed.data.kind));
  revalidatePath("/approvals");
  redirect(
    `${base(parsed.data.kind)}/${parsed.data.id}?${parsed.data.action === "approve" ? "approved" : "rejected"}=1`,
  );
}
export async function postReturnAction(
  _state: MutationState,
  formData: FormData,
): Promise<MutationState> {
  const parsed = returnCommandSchema.safeParse({
    id: value(formData, "id"),
    kind: value(formData, "kind"),
  });
  if (!parsed.success) return validationFailure(parsed.error);
  const { company, supabase } = await requireMutationPermission(
    `${domain(parsed.data.kind)}.post`,
  );
  const { error } = await supabase.rpc("post_return_document", {
    p_company_id: company.companyId,
    p_idempotency_key: `${parsed.data.kind}:${parsed.data.id}`,
    p_return_id: parsed.data.id,
  });
  if (error) return databaseFailure(error, "Retur tidak dapat diposting.");
  revalidatePath(base(parsed.data.kind));
  revalidatePath("/inventory/stock");
  revalidatePath("/reports");
  redirect(`${base(parsed.data.kind)}/${parsed.data.id}?posted=1`);
}
export async function reverseReturnAction(
  _state: MutationState,
  formData: FormData,
): Promise<MutationState> {
  const parsed = returnReversalSchema.safeParse({
    id: value(formData, "id"),
    kind: value(formData, "kind"),
    reason: value(formData, "reason"),
    reversalDate: value(formData, "reversalDate"),
  });
  if (!parsed.success) return validationFailure(parsed.error);
  const { company, supabase } = await requireMutationPermission(
    `${domain(parsed.data.kind)}.post`,
  );
  const { error } = await supabase.rpc("reverse_return_document", {
    p_company_id: company.companyId,
    p_date: parsed.data.reversalDate,
    p_idempotency_key: `reverse:${parsed.data.kind}:${parsed.data.id}`,
    p_reason: parsed.data.reason,
    p_return_id: parsed.data.id,
  });
  if (error) return databaseFailure(error, "Retur tidak dapat direversal.");
  revalidatePath(base(parsed.data.kind));
  revalidatePath("/inventory/stock");
  revalidatePath("/reports");
  redirect(`${base(parsed.data.kind)}/${parsed.data.id}?reversed=1`);
}
