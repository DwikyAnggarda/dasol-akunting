"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { MutationState } from "@/features/shared/mutation-state";
import { requireMutationPermission } from "@/server/mutations/context";
import { databaseFailure, validationFailure } from "@/server/mutations/result";
import {
  journalFormSchema,
  journalReversalSchema,
  periodCommandSchema,
} from "./schemas";
const value = (formData: FormData, name: string) => formData.get(name);
export async function postManualJournalAction(
  _state: MutationState,
  formData: FormData,
): Promise<MutationState> {
  const parsed = journalFormSchema.safeParse({
    branchId: value(formData, "branchId") || "",
    description: value(formData, "description"),
    lines: value(formData, "lines"),
    postingDate: value(formData, "postingDate"),
  });
  if (!parsed.success) return validationFailure(parsed.error);
  const { company, supabase } = await requireMutationPermission("journal.post");
  const { data, error } = await supabase.rpc("post_manual_journal", {
    p_branch_id: parsed.data.branchId,
    p_company_id: company.companyId,
    p_description: parsed.data.description,
    p_idempotency_key: crypto.randomUUID(),
    p_lines: parsed.data.lines.map((line) => ({
      account_id: line.accountId,
      credit: line.credit,
      debit: line.debit,
      description: line.description,
    })),
    p_posting_date: parsed.data.postingDate,
  });
  if (error)
    return databaseFailure(error, "Jurnal manual tidak dapat diposting.");
  revalidatePath("/accounting/journals");
  revalidatePath("/reports");
  redirect(`/accounting/journals/${data}?posted=1`);
}
export async function reverseJournalAction(
  _state: MutationState,
  formData: FormData,
): Promise<MutationState> {
  const parsed = journalReversalSchema.safeParse({
    id: value(formData, "id"),
    reason: value(formData, "reason"),
    reversalDate: value(formData, "reversalDate"),
  });
  if (!parsed.success) return validationFailure(parsed.error);
  const { company, supabase } =
    await requireMutationPermission("journal.reverse");
  const { error } = await supabase.rpc("reverse_journal_entry", {
    p_company_id: company.companyId,
    p_idempotency_key: `reverse:journal:${parsed.data.id}`,
    p_journal_id: parsed.data.id,
    p_reason: parsed.data.reason,
    p_reversal_date: parsed.data.reversalDate,
  });
  if (error) return databaseFailure(error, "Jurnal tidak dapat direversal.");
  revalidatePath("/accounting/journals");
  revalidatePath("/reports");
  redirect(`/accounting/journals/${parsed.data.id}?reversed=1`);
}
export async function closePeriodAction(
  _state: MutationState,
  formData: FormData,
): Promise<MutationState> {
  const parsed = periodCommandSchema.safeParse({ id: value(formData, "id") });
  if (!parsed.success) return validationFailure(parsed.error);
  const { company, supabase } = await requireMutationPermission("period.close");
  const { error } = await supabase.rpc("close_accounting_period", {
    p_company_id: company.companyId,
    p_period_id: parsed.data.id,
  });
  if (error) return databaseFailure(error, "Periode tidak dapat ditutup.");
  revalidatePath("/accounting/periods");
  redirect("/accounting/periods?closed=1");
}
export async function reopenPeriodAction(
  _state: MutationState,
  formData: FormData,
): Promise<MutationState> {
  const parsed = periodCommandSchema.safeParse({
    id: value(formData, "id"),
    reason: value(formData, "comment") || "",
  });
  if (!parsed.success) return validationFailure(parsed.error);
  if (parsed.data.reason.length < 5)
    return {
      status: "error",
      error: {
        code: "VALIDATION",
        message: "Alasan pembukaan minimal lima karakter.",
      },
    };
  const { company, supabase } =
    await requireMutationPermission("period.reopen");
  const { error } = await supabase.rpc("reopen_accounting_period", {
    p_company_id: company.companyId,
    p_period_id: parsed.data.id,
    p_reason: parsed.data.reason,
  });
  if (error)
    return databaseFailure(error, "Periode tidak dapat dibuka kembali.");
  revalidatePath("/accounting/periods");
  redirect("/accounting/periods?reopened=1");
}
