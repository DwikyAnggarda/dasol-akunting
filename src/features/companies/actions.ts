"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireUser } from "@/server/auth/require-user";
import { ACTIVE_COMPANY_COOKIE } from "@/server/queries/company-context";

export async function selectCompanyAction(formData: FormData) {
  const parsedCompanyId = z.uuid().safeParse(formData.get("companyId"));
  if (!parsedCompanyId.success) redirect("/select-company?error=invalid");

  const { supabase, user } = await requireUser();
  const { data, error } = await supabase
    .from("company_memberships")
    .select("id")
    .eq("company_id", parsedCompanyId.data)
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle();

  if (error || !data) redirect("/unauthorized");

  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_COMPANY_COOKIE, parsedCompanyId.data, {
    httpOnly: true,
    maxAge: 60 * 60 * 12,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
  redirect("/dashboard");
}
