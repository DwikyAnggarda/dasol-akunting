import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export async function requireUser() {
  let supabase;
  try {
    supabase = await createClient();
  } catch {
    redirect("/login?setup=required");
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) redirect("/login");
  return { supabase, user };
}
