import { redirect } from "next/navigation";

import { getActiveCompanyContext } from "@/server/queries/company-context";

export async function requireCompanyPermission(...permissions: string[]) {
  const context = await getActiveCompanyContext();
  if (
    !permissions.some((permission) => context.permissions.includes(permission))
  ) {
    redirect("/unauthorized");
  }
  return context;
}
