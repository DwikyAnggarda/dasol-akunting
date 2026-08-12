import { z } from "zod";

import { createAdminClient } from "@/lib/supabase/admin";
import { requireUser } from "@/server/auth/require-user";

const permissionSchema = z.object({
  code: z.string(),
  description: z.string(),
  id: z.uuid(),
});

const roleSchema = z.object({
  code: z.string(),
  id: z.uuid(),
  is_active: z.boolean(),
  is_system: z.boolean(),
  name: z.string(),
  version: z.number().int(),
});

export async function getRoles(companyId: string) {
  const { supabase } = await requireUser();
  const [
    { data: roles, error: roleError },
    { data: grants, error: grantError },
  ] = await Promise.all([
    supabase
      .from("roles")
      .select("id,code,name,is_system,is_active,version")
      .eq("company_id", companyId)
      .order("is_system", { ascending: false })
      .order("name"),
    supabase
      .from("role_permissions")
      .select("role_id,permissions!inner(code)")
      .eq("company_id", companyId),
  ]);
  if (roleError || grantError)
    throw new Error("Daftar role tidak dapat dimuat.");
  const parsed = z.array(roleSchema).safeParse(roles);
  if (!parsed.success) throw new Error("Data role tidak valid.");
  const permissionMap = new Map<string, string[]>();
  for (const grant of grants ?? []) {
    const relation = grant.permissions as { code?: string };
    if (!relation?.code) continue;
    permissionMap.set(grant.role_id, [
      ...(permissionMap.get(grant.role_id) ?? []),
      relation.code,
    ]);
  }
  return parsed.data.map((role) => ({
    ...role,
    permissions: permissionMap.get(role.id) ?? [],
  }));
}

export async function getRole(companyId: string, roleId: string) {
  const roles = await getRoles(companyId);
  return roles.find((role) => role.id === roleId) ?? null;
}

export async function getPermissions() {
  const { supabase } = await requireUser();
  const { data, error } = await supabase
    .from("permissions")
    .select("id,code,description")
    .order("code");
  if (error) throw new Error("Daftar permission tidak dapat dimuat.");
  const parsed = z.array(permissionSchema).safeParse(data);
  if (!parsed.success) throw new Error("Data permission tidak valid.");
  return parsed.data;
}

export async function getCompanyMembers(companyId: string) {
  const { supabase } = await requireUser();
  const { data, error } = await supabase
    .from("company_memberships")
    .select("id,user_id,role_id,status,version,created_at,roles!inner(name)")
    .eq("company_id", companyId)
    .order("created_at");
  if (error) throw new Error("Daftar pengguna tidak dapat dimuat.");

  const ids = (data ?? []).map((member) => member.user_id);
  const admin = createAdminClient();
  const profileResult = ids.length
    ? await admin.from("profiles").select("id,email,display_name").in("id", ids)
    : { data: [], error: null };
  if (profileResult.error)
    throw new Error("Profil pengguna tidak dapat dimuat.");
  const profiles = new Map(
    (profileResult.data ?? []).map((profile) => [profile.id, profile]),
  );
  return (data ?? []).map((member) => ({
    ...member,
    display_name: profiles.get(member.user_id)?.display_name ?? null,
    email: profiles.get(member.user_id)?.email ?? "Email tidak tersedia",
    role_name: Array.isArray(member.roles)
      ? (member.roles[0]?.name ?? "Role tidak tersedia")
      : (member.roles as { name: string }).name,
  }));
}

export async function getCompanyMember(companyId: string, userId: string) {
  const members = await getCompanyMembers(companyId);
  return members.find((member) => member.user_id === userId) ?? null;
}

export async function getAccountMappingSettings(companyId: string) {
  const { supabase } = await requireUser();
  const [{ data: accounts, error: accountError }, { data: mappings, error }] =
    await Promise.all([
      supabase
        .from("chart_of_accounts")
        .select("id,code,name")
        .eq("company_id", companyId)
        .eq("is_active", true)
        .order("code"),
      supabase
        .from("account_mappings")
        .select("mapping_code,account_id")
        .eq("company_id", companyId),
    ]);
  if (accountError || error)
    throw new Error("Pemetaan akun tidak dapat dimuat.");
  return {
    accounts: accounts ?? [],
    mappings: Object.fromEntries(
      (mappings ?? []).map((mapping) => [
        mapping.mapping_code,
        mapping.account_id,
      ]),
    ),
  };
}
