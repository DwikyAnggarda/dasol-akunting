"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import type { MutationState } from "@/features/shared/mutation-state";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireMutationPermission } from "@/server/mutations/context";
import {
  conflictFailure,
  databaseFailure,
  validationFailure,
} from "@/server/mutations/result";

import {
  accountMappingsSchema,
  inviteMemberSchema,
  membershipSchema,
  roleSchema,
  roleStatusSchema,
} from "./schemas";

const value = (data: FormData, name: string) => data.get(name);

export async function saveRoleAction(
  _state: MutationState,
  formData: FormData,
): Promise<MutationState> {
  const parsed = roleSchema.safeParse({
    code: value(formData, "code"),
    id: value(formData, "id") || "",
    name: value(formData, "name"),
    permissions: formData.getAll("permissions"),
    version: value(formData, "version") || "",
  });
  if (!parsed.success) return validationFailure(parsed.error);
  const { company, supabase } = await requireMutationPermission("role.manage");
  const { data, error } = await supabase.rpc("save_role", {
    p_code: parsed.data.code,
    p_company_id: company.companyId,
    p_name: parsed.data.name,
    p_permission_codes: parsed.data.permissions,
    p_role_id: (parsed.data.id ?? null) as unknown as string,
    p_version: parsed.data.version,
  });
  if (error) return databaseFailure(error, "Role tidak dapat disimpan.");
  revalidatePath("/settings/roles");
  redirect(`/settings/roles/${data}?saved=1`);
}

export async function toggleRoleAction(
  _state: MutationState,
  formData: FormData,
): Promise<MutationState> {
  const parsed = roleStatusSchema.safeParse({
    activate: value(formData, "activate"),
    id: value(formData, "id"),
    version: value(formData, "version"),
  });
  if (!parsed.success) return validationFailure(parsed.error);
  const { company, supabase } = await requireMutationPermission("role.manage");
  const { error } = await supabase.rpc("set_role_active", {
    p_company_id: company.companyId,
    p_is_active: parsed.data.activate,
    p_role_id: parsed.data.id,
    p_version: parsed.data.version,
  });
  if (error) return databaseFailure(error, "Status role tidak dapat diubah.");
  revalidatePath("/settings/roles");
  redirect("/settings/roles?statusChanged=1");
}

export async function inviteMemberAction(
  _state: MutationState,
  formData: FormData,
): Promise<MutationState> {
  const parsed = inviteMemberSchema.safeParse({
    displayName: value(formData, "displayName"),
    email: value(formData, "email"),
    roleId: value(formData, "roleId"),
  });
  if (!parsed.success) return validationFailure(parsed.error);
  const { company, supabase, user } =
    await requireMutationPermission("user.manage");
  const { data: role } = await supabase
    .from("roles")
    .select("id")
    .eq("company_id", company.companyId)
    .eq("id", parsed.data.roleId)
    .eq("is_active", true)
    .maybeSingle();
  if (!role)
    return {
      error: { code: "INVALID_ROLE", message: "Role aktif tidak ditemukan." },
      status: "error",
    };

  const admin = createAdminClient();
  const { data: existing, error: profileError } = await admin
    .from("profiles")
    .select("id")
    .eq("email", parsed.data.email)
    .maybeSingle();
  if (profileError)
    return databaseFailure(profileError, "Pengguna tidak dapat diperiksa.");

  let userId = existing?.id;
  if (!userId) {
    const { data, error } = await admin.auth.admin.inviteUserByEmail(
      parsed.data.email,
      { data: { display_name: parsed.data.displayName } },
    );
    if (error || !data.user)
      return {
        error: {
          code: "INVITE_FAILED",
          message:
            "Undangan tidak dapat dikirim. Periksa email dan konfigurasi Auth.",
        },
        status: "error",
      };
    userId = data.user.id;
  }

  const { error } = await supabase.from("company_memberships").insert({
    company_id: company.companyId,
    created_by: user.id,
    role_id: parsed.data.roleId,
    status: "active",
    user_id: userId,
  });
  if (error)
    return databaseFailure(error, "Keanggotaan pengguna tidak dapat dibuat.");
  revalidatePath("/settings/users");
  redirect("/settings/users?saved=invite");
}

export async function updateMembershipAction(
  _state: MutationState,
  formData: FormData,
): Promise<MutationState> {
  const parsed = membershipSchema.safeParse({
    roleId: value(formData, "roleId"),
    status: value(formData, "status"),
    userId: value(formData, "userId"),
    version: value(formData, "version"),
  });
  if (!parsed.success) return validationFailure(parsed.error);
  const { company, supabase, user } =
    await requireMutationPermission("user.manage");
  if (parsed.data.userId === user.id)
    return {
      error: {
        code: "SELF_LOCKOUT",
        message:
          "Role atau status keanggotaan Anda sendiri tidak dapat diubah.",
      },
      status: "error",
    };
  const { data: role } = await supabase
    .from("roles")
    .select("id")
    .eq("company_id", company.companyId)
    .eq("id", parsed.data.roleId)
    .eq("is_active", true)
    .maybeSingle();
  if (!role)
    return {
      error: { code: "INVALID_ROLE", message: "Role aktif tidak ditemukan." },
      status: "error",
    };
  const { data, error } = await supabase
    .from("company_memberships")
    .update({
      role_id: parsed.data.roleId,
      status: parsed.data.status,
      updated_by: user.id,
    })
    .eq("company_id", company.companyId)
    .eq("user_id", parsed.data.userId)
    .eq("version", parsed.data.version)
    .select("id")
    .maybeSingle();
  if (error)
    return databaseFailure(error, "Keanggotaan pengguna tidak dapat diubah.");
  if (!data) return conflictFailure();
  revalidatePath("/settings/users");
  redirect(`/settings/users/${parsed.data.userId}?saved=1`);
}

export async function saveAccountMappingsAction(
  _state: MutationState,
  formData: FormData,
): Promise<MutationState> {
  const mappings = Object.fromEntries(
    [...formData.entries()]
      .filter(([key]) => key.startsWith("mapping:"))
      .map(([key, mappingValue]) => [key.slice(8), mappingValue]),
  );
  const parsed = accountMappingsSchema.safeParse(mappings);
  if (!parsed.success) return validationFailure(parsed.error);
  const { company, supabase } =
    await requireMutationPermission("settings.manage");
  const { error } = await supabase.rpc("save_account_mappings", {
    p_company_id: company.companyId,
    p_mappings: parsed.data,
  });
  if (error)
    return databaseFailure(error, "Pemetaan akun tidak dapat disimpan.");
  revalidatePath("/settings/account-mapping");
  redirect("/settings/account-mapping?saved=1");
}
