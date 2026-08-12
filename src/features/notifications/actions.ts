"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/server/auth/require-user";
import { getActiveCompanyContext } from "@/server/queries/company-context";

const idSchema = z.uuid();

export async function markNotificationReadAction(formData: FormData) {
  const parsed = idSchema.safeParse(formData.get("id"));
  if (!parsed.success) return;
  const [{ supabase }, company] = await Promise.all([
    requireUser(),
    getActiveCompanyContext(),
  ]);
  await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("company_id", company.companyId)
    .eq("id", parsed.data);
  revalidatePath("/notifications");
}

export async function markAllNotificationsReadAction() {
  const [{ supabase }, company] = await Promise.all([
    requireUser(),
    getActiveCompanyContext(),
  ]);
  await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("company_id", company.companyId)
    .is("read_at", null);
  revalidatePath("/notifications");
}
