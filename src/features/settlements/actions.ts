"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import type { MutationState } from "@/features/shared/mutation-state";
import { requireMutationPermission } from "@/server/mutations/context";
import { databaseFailure, validationFailure } from "@/server/mutations/result";

import {
  reversalSchema,
  settlementCommandSchema,
  settlementFormSchema,
} from "./schemas";

const value = (formData: FormData, name: string) => formData.get(name);
const basePath = (kind: "customer" | "supplier") =>
  kind === "customer" ? "/sales/receipts" : "/purchases/payments";
const permissionScope = (kind: "customer" | "supplier") =>
  kind === "customer" ? "sales" : "purchase";
const settlementType = (kind: "customer" | "supplier") =>
  kind === "customer" ? "customer_receipt" : "supplier_payment";

export async function saveSettlementAction(
  _state: MutationState,
  formData: FormData,
): Promise<MutationState> {
  const parsed = settlementFormSchema.safeParse({
    allocations: value(formData, "allocations"),
    bankAccountId: value(formData, "bankAccountId"),
    branchId: value(formData, "branchId"),
    contactId: value(formData, "contactId"),
    id: value(formData, "id") || "",
    kind: value(formData, "kind"),
    notes: value(formData, "notes") || "",
    settlementDate: value(formData, "settlementDate"),
    version: value(formData, "version") || null,
  });
  if (!parsed.success) return validationFailure(parsed.error);
  const { company, supabase } = await requireMutationPermission(
    `${permissionScope(parsed.data.kind)}.create`,
  );
  const { data, error } = await supabase.rpc("save_settlement_draft", {
    p_allocations: parsed.data.allocations.map((item) => ({
      amount: item.amount,
      item_id: item.itemId,
    })),
    p_company_id: company.companyId,
    p_header: {
      bank_account_id: parsed.data.bankAccountId,
      branch_id: parsed.data.branchId,
      contact_id: parsed.data.contactId,
      notes: parsed.data.notes,
      settlement_date: parsed.data.settlementDate,
    },
    p_settlement_id: parsed.data.id,
    p_settlement_type: settlementType(parsed.data.kind),
    p_version: parsed.data.version,
  });
  if (error)
    return databaseFailure(error, "Draft pembayaran tidak dapat disimpan.");
  revalidatePath(basePath(parsed.data.kind));
  redirect(`${basePath(parsed.data.kind)}/${data}?saved=1`);
}

export async function deleteSettlementAction(
  _state: MutationState,
  formData: FormData,
): Promise<MutationState> {
  const parsed = settlementCommandSchema.safeParse({
    id: value(formData, "id"),
    kind: value(formData, "kind"),
    version: value(formData, "version"),
  });
  if (!parsed.success) return validationFailure(parsed.error);
  const { company, supabase } = await requireMutationPermission(
    `${permissionScope(parsed.data.kind)}.create`,
  );
  const { error } = await supabase.rpc("delete_settlement_draft", {
    p_company_id: company.companyId,
    p_settlement_id: parsed.data.id,
    p_settlement_type: settlementType(parsed.data.kind),
    p_version: parsed.data.version!,
  });
  if (error)
    return databaseFailure(error, "Draft pembayaran tidak dapat dihapus.");
  revalidatePath(basePath(parsed.data.kind));
  redirect(`${basePath(parsed.data.kind)}?deleted=1`);
}

export async function postSettlementAction(
  _state: MutationState,
  formData: FormData,
): Promise<MutationState> {
  const parsed = settlementCommandSchema.safeParse({
    id: value(formData, "id"),
    kind: value(formData, "kind"),
  });
  if (!parsed.success) return validationFailure(parsed.error);
  const scope = permissionScope(parsed.data.kind);
  const { company, supabase } = await requireMutationPermission(
    `${scope}.post`,
  );
  const result =
    parsed.data.kind === "customer"
      ? await supabase.rpc("post_customer_receipt", {
          p_company_id: company.companyId,
          p_idempotency_key: `customer-receipt:${parsed.data.id}`,
          p_receipt_id: parsed.data.id,
        })
      : await supabase.rpc("post_supplier_payment", {
          p_company_id: company.companyId,
          p_idempotency_key: `supplier-payment:${parsed.data.id}`,
          p_payment_id: parsed.data.id,
        });
  if (result.error)
    return databaseFailure(result.error, "Pembayaran tidak dapat diposting.");
  revalidatePath(basePath(parsed.data.kind));
  revalidatePath("/reports");
  revalidatePath("/dashboard");
  redirect(`${basePath(parsed.data.kind)}/${parsed.data.id}?posted=1`);
}

export async function reverseSettlementAction(
  _state: MutationState,
  formData: FormData,
): Promise<MutationState> {
  const parsed = reversalSchema.safeParse({
    id: value(formData, "id"),
    kind: value(formData, "kind"),
    reason: value(formData, "reason"),
    reversalDate: value(formData, "reversalDate"),
  });
  if (!parsed.success) return validationFailure(parsed.error);
  const { company, supabase } =
    await requireMutationPermission("journal.reverse");
  const { error } = await supabase.rpc("reverse_settlement", {
    p_company_id: company.companyId,
    p_idempotency_key: `reverse:${settlementType(parsed.data.kind)}:${parsed.data.id}`,
    p_reason: parsed.data.reason,
    p_reversal_date: parsed.data.reversalDate,
    p_settlement_id: parsed.data.id,
    p_settlement_type: settlementType(parsed.data.kind),
  });
  if (error)
    return databaseFailure(error, "Pembayaran tidak dapat direversal.");
  revalidatePath(basePath(parsed.data.kind));
  revalidatePath("/reports");
  revalidatePath("/dashboard");
  redirect(`${basePath(parsed.data.kind)}/${parsed.data.id}?reversed=1`);
}
