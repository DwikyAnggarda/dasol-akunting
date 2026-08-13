import { redirect } from "next/navigation";
import { cache } from "react";

import { createClient } from "@/lib/supabase/server";

export const requireUser = cache(async () => {
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
});
