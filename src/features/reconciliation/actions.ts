"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { MutationState } from "@/features/shared/mutation-state";
import { requireMutationPermission } from "@/server/mutations/context";
import { databaseFailure, validationFailure } from "@/server/mutations/result";
import {
  adjustmentSchema,
  finalizeSchema,
  lineCommandSchema,
  matchSchema,
  reconciliationSchema,
} from "./schemas";
const value = (data: FormData, name: string) => data.get(name);
export async function saveReconciliationAction(
  _state: MutationState,
  formData: FormData,
): Promise<MutationState> {
  let lines: unknown;
  try {
    lines = JSON.parse(String(value(formData, "lines") ?? "[]"));
  } catch {
    return {
      status: "error",
      error: { code: "INVALID_CSV", message: "Data CSV tidak valid." },
    };
  }
  const parsed = reconciliationSchema.safeParse({
    bankAccountId: value(formData, "bankAccountId"),
    closingBalance: value(formData, "closingBalance"),
    id: value(formData, "id") || "",
    lines,
    openingBalance: value(formData, "openingBalance"),
    statementDate: value(formData, "statementDate"),
    version: value(formData, "version") || "",
  });
  if (!parsed.success) return validationFailure(parsed.error);
  const { company, supabase } =
    await requireMutationPermission("settings.manage");
  const { data, error } = await supabase.rpc("save_bank_reconciliation", {
    p_company_id: company.companyId,
    p_header: {
      bank_account_id: parsed.data.bankAccountId,
      closing_balance: parsed.data.closingBalance,
      opening_balance: parsed.data.openingBalance,
      statement_date: parsed.data.statementDate,
    },
    p_lines: parsed.data.lines.map((line) => ({
      amount: line.amount,
      description: line.description,
      reference: line.reference ?? "",
      transaction_date: line.transactionDate,
    })),
    p_reconciliation_id: (parsed.data.id ?? null) as unknown as string,
    p_version: parsed.data.version,
  });
  if (error)
    return databaseFailure(error, "Rekonsiliasi tidak dapat disimpan.");
  revalidatePath("/cash-bank/reconciliations");
  redirect(`/cash-bank/reconciliations/${data}?saved=1`);
}
export async function matchStatementAction(
  _state: MutationState,
  formData: FormData,
): Promise<MutationState> {
  const parsed = matchSchema.safeParse({
    candidate: value(formData, "candidate"),
    lineId: value(formData, "lineId"),
    reconciliationId: value(formData, "reconciliationId"),
  });
  if (!parsed.success) return validationFailure(parsed.error);
  const [type, id] = parsed.data.candidate.split(":");
  const { company, supabase } =
    await requireMutationPermission("settings.manage");
  const { error } = await supabase.rpc("match_bank_statement_line", {
    p_company_id: company.companyId,
    p_line_id: parsed.data.lineId,
    p_matched_id: id,
    p_matched_type: type,
  });
  if (error)
    return databaseFailure(error, "Baris statement tidak dapat dicocokkan.");
  revalidatePath(`/cash-bank/reconciliations/${parsed.data.reconciliationId}`);
  redirect(
    `/cash-bank/reconciliations/${parsed.data.reconciliationId}?matched=1`,
  );
}
export async function unmatchStatementAction(
  _state: MutationState,
  formData: FormData,
): Promise<MutationState> {
  const parsed = lineCommandSchema.safeParse({
    lineId: value(formData, "lineId"),
    reconciliationId: value(formData, "reconciliationId"),
  });
  if (!parsed.success) return validationFailure(parsed.error);
  const { company, supabase } =
    await requireMutationPermission("settings.manage");
  const { error } = await supabase.rpc("unmatch_bank_statement_line", {
    p_company_id: company.companyId,
    p_line_id: parsed.data.lineId,
  });
  if (error) return databaseFailure(error, "Match tidak dapat dibatalkan.");
  revalidatePath(`/cash-bank/reconciliations/${parsed.data.reconciliationId}`);
  redirect(
    `/cash-bank/reconciliations/${parsed.data.reconciliationId}?unmatched=1`,
  );
}
export async function adjustStatementAction(
  _state: MutationState,
  formData: FormData,
): Promise<MutationState> {
  const parsed = adjustmentSchema.safeParse({
    description: value(formData, "description"),
    lineId: value(formData, "lineId"),
    offsetAccountId: value(formData, "offsetAccountId"),
    reconciliationId: value(formData, "reconciliationId"),
  });
  if (!parsed.success) return validationFailure(parsed.error);
  const { company, supabase } =
    await requireMutationPermission("settings.manage");
  const { error } = await supabase.rpc("create_reconciliation_adjustment", {
    p_company_id: company.companyId,
    p_description: parsed.data.description,
    p_idempotency_key: `bank-reconciliation:${parsed.data.lineId}`,
    p_line_id: parsed.data.lineId,
    p_offset_account_id: parsed.data.offsetAccountId,
  });
  if (error)
    return databaseFailure(
      error,
      "Adjustment rekonsiliasi tidak dapat dibuat.",
    );
  revalidatePath(`/cash-bank/reconciliations/${parsed.data.reconciliationId}`);
  revalidatePath("/accounting/journals");
  redirect(
    `/cash-bank/reconciliations/${parsed.data.reconciliationId}?adjusted=1`,
  );
}
export async function finalizeReconciliationAction(
  _state: MutationState,
  formData: FormData,
): Promise<MutationState> {
  const parsed = finalizeSchema.safeParse({ id: value(formData, "id") });
  if (!parsed.success) return validationFailure(parsed.error);
  const { company, supabase } =
    await requireMutationPermission("settings.manage");
  const { error } = await supabase.rpc("finalize_bank_reconciliation", {
    p_company_id: company.companyId,
    p_reconciliation_id: parsed.data.id,
  });
  if (error)
    return databaseFailure(error, "Rekonsiliasi belum dapat difinalisasi.");
  revalidatePath("/cash-bank/reconciliations");
  redirect(`/cash-bank/reconciliations/${parsed.data.id}?finalized=1`);
}
