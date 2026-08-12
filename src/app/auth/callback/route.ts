import { type NextRequest, NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

function safeNextPath(value: string | null): string {
  return value?.startsWith("/") && !value.startsWith("//")
    ? value
    : "/dashboard";
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const redirectUrl = request.nextUrl.clone();
  redirectUrl.pathname = safeNextPath(request.nextUrl.searchParams.get("next"));
  redirectUrl.search = "";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(redirectUrl);
  }

  redirectUrl.pathname = "/login";
  redirectUrl.searchParams.set(
    "error",
    "Tautan autentikasi tidak valid atau kedaluwarsa.",
  );
  return NextResponse.redirect(redirectUrl);
}
