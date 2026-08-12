"use client";

import { createBrowserClient } from "@supabase/ssr";

import { requireSupabaseEnvironment } from "@/config/env";

export function createClient() {
  const environment = requireSupabaseEnvironment();
  return createBrowserClient(environment.url, environment.publishableKey);
}
