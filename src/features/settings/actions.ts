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
import { accountingSettingsSchema, companyIdentitySchema } from "./schemas";
const value = (data: FormData, name: string) => data.get(name);
export async function saveCompanyIdentityAction(
  _state: MutationState,
  formData: FormData,
): Promise<MutationState> {
  const parsed = companyIdentitySchema.safeParse({
    legalName: value(formData, "legalName") || "",
    name: value(formData, "name"),
    taxId: value(formData, "taxId") || "",
    timezone: value(formData, "timezone"),
    version: value(formData, "version"),
  });
  if (!parsed.success) return validationFailure(parsed.error);
  const { company, supabase, user } =
    await requireMutationPermission("company.manage");
  const { data, error } = await supabase
    .from("companies")
    .update({
      legal_name: parsed.data.legalName,
      name: parsed.data.name,
      tax_id: parsed.data.taxId,
      timezone: parsed.data.timezone,
      updated_by: user.id,
    })
    .eq("id", company.companyId)
    .eq("version", parsed.data.version)
    .select("id")
    .maybeSingle();
  if (error)
    return databaseFailure(error, "Identitas perusahaan tidak dapat disimpan.");
  if (!data) return conflictFailure();
  revalidatePath("/settings/company");
  redirect("/settings/company?saved=identity");
}
export async function saveAccountingSettingsAction(
  _state: MutationState,
  formData: FormData,
): Promise<MutationState> {
  const parsed = accountingSettingsSchema.safeParse({
    allowNegativeStock: value(formData, "allowNegativeStock") ?? undefined,
    allowSelfApproval: value(formData, "allowSelfApproval") ?? undefined,
    fiscalYearStartMonth: value(formData, "fiscalYearStartMonth"),
    version: value(formData, "version"),
  });
  if (!parsed.success) return validationFailure(parsed.error);
  const { company, supabase, user } =
    await requireMutationPermission("settings.manage");
  const { data, error } = await supabase
    .from("company_settings")
    .update({
      allow_negative_stock: parsed.data.allowNegativeStock,
      allow_self_approval: parsed.data.allowSelfApproval,
      fiscal_year_start_month: parsed.data.fiscalYearStartMonth,
      updated_by: user.id,
    })
    .eq("company_id", company.companyId)
    .eq("version", parsed.data.version)
    .select("id")
    .maybeSingle();
  if (error)
    return databaseFailure(error, "Pengaturan akuntansi tidak dapat disimpan.");
  if (!data) return conflictFailure();
  revalidatePath("/settings/company");
  redirect("/settings/company?saved=accounting");
}
