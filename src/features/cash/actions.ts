"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { MutationState } from "@/features/shared/mutation-state";
import { requireMutationPermission } from "@/server/mutations/context";
import { databaseFailure, validationFailure } from "@/server/mutations/result";
import {
  cashCommandSchema,
  cashReversalSchema,
  cashTransactionSchema,
} from "./schemas";
const value = (data: FormData, name: string) => data.get(name);

export async function saveCashTransactionAction(
  _state: MutationState,
  formData: FormData,
): Promise<MutationState> {
  const parsed = cashTransactionSchema.safeParse({
    amount: value(formData, "amount"),
    bankAccountId: value(formData, "bankAccountId"),
    branchId: value(formData, "branchId"),
    description: value(formData, "description"),
    destinationBankAccountId: value(formData, "destinationBankAccountId") || "",
    id: value(formData, "id") || "",
    offsetAccountId: value(formData, "offsetAccountId") || "",
    reference: value(formData, "reference") || "",
    transactionDate: value(formData, "transactionDate"),
    transactionType: value(formData, "transactionType"),
    version: value(formData, "version") || "",
  });
  if (!parsed.success) return validationFailure(parsed.error);
  const { company, supabase } = await requireMutationPermission("cash.create");
  const { data, error } = await supabase.rpc("save_cash_transaction", {
    p_company_id: company.companyId,
    p_payload: {
      amount: parsed.data.amount,
      bank_account_id: parsed.data.bankAccountId,
      branch_id: parsed.data.branchId,
      description: parsed.data.description,
      destination_bank_account_id: parsed.data.destinationBankAccountId ?? "",
      offset_account_id: parsed.data.offsetAccountId ?? "",
      reference: parsed.data.reference ?? "",
      transaction_date: parsed.data.transactionDate,
      transaction_type: parsed.data.transactionType,
    },
    p_transaction_id: (parsed.data.id ?? null) as unknown as string,
    p_version: parsed.data.version,
  });
  if (error)
    return databaseFailure(error, "Draft transaksi kas tidak dapat disimpan.");
  revalidatePath("/cash-bank/transactions");
  redirect(`/cash-bank/transactions/${data}?saved=1`);
}
export async function deleteCashTransactionAction(
  _state: MutationState,
  formData: FormData,
): Promise<MutationState> {
  const parsed = cashCommandSchema.safeParse({
    id: value(formData, "id"),
    version: value(formData, "version"),
  });
  if (!parsed.success) return validationFailure(parsed.error);
  const { company, supabase } = await requireMutationPermission("cash.create");
  const { error } = await supabase.rpc("delete_cash_transaction_draft", {
    p_company_id: company.companyId,
    p_transaction_id: parsed.data.id,
    p_version: parsed.data.version!,
  });
  if (error)
    return databaseFailure(error, "Draft transaksi kas tidak dapat dihapus.");
  revalidatePath("/cash-bank/transactions");
  redirect("/cash-bank/transactions?deleted=1");
}
export async function submitCashTransactionAction(
  _state: MutationState,
  formData: FormData,
): Promise<MutationState> {
  const parsed = cashCommandSchema.safeParse({ id: value(formData, "id") });
  if (!parsed.success) return validationFailure(parsed.error);
  const { company, supabase } = await requireMutationPermission("cash.submit");
  const { error } = await supabase.rpc("submit_cash_transaction", {
    p_company_id: company.companyId,
    p_transaction_id: parsed.data.id,
  });
  if (error)
    return databaseFailure(error, "Transaksi kas tidak dapat diajukan.");
  revalidatePath("/cash-bank/transactions");
  revalidatePath("/approvals");
  redirect(`/cash-bank/transactions/${parsed.data.id}?submitted=1`);
}
export async function decideCashTransactionAction(
  _state: MutationState,
  formData: FormData,
): Promise<MutationState> {
  const parsed = cashCommandSchema.safeParse({
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
  const { company, supabase } = await requireMutationPermission("cash.approve");
  const { error } = await supabase.rpc("decide_cash_transaction", {
    p_action: parsed.data.action!,
    p_comment: parsed.data.comment,
    p_company_id: company.companyId,
    p_transaction_id: parsed.data.id,
  });
  if (error)
    return databaseFailure(
      error,
      "Keputusan transaksi kas tidak dapat disimpan.",
    );
  revalidatePath("/cash-bank/transactions");
  revalidatePath("/approvals");
  redirect(
    `/cash-bank/transactions/${parsed.data.id}?${parsed.data.action === "approve" ? "approved" : "rejected"}=1`,
  );
}
export async function postCashTransactionAction(
  _state: MutationState,
  formData: FormData,
): Promise<MutationState> {
  const parsed = cashCommandSchema.safeParse({ id: value(formData, "id") });
  if (!parsed.success) return validationFailure(parsed.error);
  const { company, supabase } = await requireMutationPermission("cash.post");
  const { error } = await supabase.rpc("post_cash_transaction", {
    p_company_id: company.companyId,
    p_idempotency_key: `cash-transaction:${parsed.data.id}`,
    p_transaction_id: parsed.data.id,
  });
  if (error)
    return databaseFailure(error, "Transaksi kas tidak dapat diposting.");
  revalidatePath("/cash-bank");
  revalidatePath("/reports");
  revalidatePath("/dashboard");
  redirect(`/cash-bank/transactions/${parsed.data.id}?posted=1`);
}
export async function reverseCashTransactionAction(
  _state: MutationState,
  formData: FormData,
): Promise<MutationState> {
  const parsed = cashReversalSchema.safeParse({
    id: value(formData, "id"),
    reason: value(formData, "reason"),
    reversalDate: value(formData, "reversalDate"),
  });
  if (!parsed.success) return validationFailure(parsed.error);
  const { company, supabase } = await requireMutationPermission("cash.reverse");
  const { error } = await supabase.rpc("reverse_cash_transaction", {
    p_company_id: company.companyId,
    p_idempotency_key: `reverse:cash-transaction:${parsed.data.id}`,
    p_reason: parsed.data.reason,
    p_reversal_date: parsed.data.reversalDate,
    p_transaction_id: parsed.data.id,
  });
  if (error)
    return databaseFailure(error, "Transaksi kas tidak dapat direversal.");
  revalidatePath("/cash-bank");
  revalidatePath("/reports");
  revalidatePath("/dashboard");
  redirect(`/cash-bank/transactions/${parsed.data.id}?reversed=1`);
}
