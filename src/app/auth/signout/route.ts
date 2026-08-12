import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
  } catch {
    // An unconfigured environment has no server session to invalidate.
  }

  return NextResponse.redirect(new URL("/login", request.url), { status: 303 });
}
