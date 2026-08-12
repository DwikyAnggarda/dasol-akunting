import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

import type {
  ActiveCompanyContext,
  CompanyMembershipSummary,
} from "@/features/companies/types";
import { requireUser } from "@/server/auth/require-user";

export const ACTIVE_COMPANY_COOKIE = "dasol_active_company";

const membershipSchema = z.object({
  company_id: z.uuid(),
  companies: z.object({ code: z.string(), name: z.string() }),
  id: z.uuid(),
  roles: z.object({ name: z.string() }),
});

function mapMembership(
  value: z.infer<typeof membershipSchema>,
): CompanyMembershipSummary {
  return {
    companyCode: value.companies.code,
    companyId: value.company_id,
    companyName: value.companies.name,
    membershipId: value.id,
    roleName: value.roles.name,
  };
}

export async function getCompanyMemberships(): Promise<
  CompanyMembershipSummary[]
> {
  const { supabase, user } = await requireUser();
  const { data, error } = await supabase
    .from("company_memberships")
    .select("id, company_id, companies!inner(code, name), roles!inner(name)")
    .eq("user_id", user.id)
    .eq("status", "active")
    .order("created_at");

  if (error) throw new Error("Keanggotaan perusahaan tidak dapat dimuat.");
  const parsed = z.array(membershipSchema).safeParse(data);
  if (!parsed.success)
    throw new Error("Data keanggotaan perusahaan tidak valid.");
  return parsed.data.map(mapMembership);
}

export async function getActiveCompanyContext(): Promise<ActiveCompanyContext> {
  const { supabase, user } = await requireUser();
  const cookieStore = await cookies();
  const companyId = cookieStore.get(ACTIVE_COMPANY_COOKIE)?.value;
  if (!companyId || !z.uuid().safeParse(companyId).success)
    redirect("/select-company");

  const { data, error } = await supabase
    .from("company_memberships")
    .select("id, company_id, companies!inner(code, name), roles!inner(name)")
    .eq("company_id", companyId)
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle();

  const parsedMembership = membershipSchema.safeParse(data);
  if (error || !parsedMembership.success) redirect("/select-company");

  const { data: permissionData, error: permissionError } = await supabase.rpc(
    "get_my_permissions",
    { p_company_id: companyId },
  );
  const parsedPermissions = z.array(z.string()).safeParse(permissionData);
  if (permissionError || !parsedPermissions.success) {
    throw new Error("Hak akses perusahaan tidak dapat diverifikasi.");
  }

  return {
    ...mapMembership(parsedMembership.data),
    permissions: parsedPermissions.data,
    userEmail: user.email ?? "",
    userId: user.id,
  };
}
