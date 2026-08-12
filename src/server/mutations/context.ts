import { redirect } from "next/navigation";

import { getActiveCompanyContext } from "@/server/queries/company-context";
import { requireUser } from "@/server/auth/require-user";

export async function requireMutationPermission(permission: string) {
  const company = await getActiveCompanyContext();
  if (!company.permissions.includes(permission)) redirect("/unauthorized");
  const { supabase, user } = await requireUser();
  return { company, supabase, user };
}
