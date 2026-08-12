import { z } from "zod";

const optionalUrl = z.union([z.literal(""), z.url()]).default("");

const publicEnvironmentSchema = z
  .object({
    NEXT_PUBLIC_APP_NAME: z.string().trim().min(1).default("Dasol"),
    NEXT_PUBLIC_APP_URL: optionalUrl,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().trim().default(""),
    NEXT_PUBLIC_SUPABASE_URL: optionalUrl,
  })
  .superRefine((environment, context) => {
    const hasUrl = environment.NEXT_PUBLIC_SUPABASE_URL !== "";
    const hasKey = environment.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY !== "";

    if (hasUrl !== hasKey) {
      context.addIssue({
        code: "custom",
        message:
          "NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY must be configured together.",
      });
    }
  });

const parsedPublicEnvironment = publicEnvironmentSchema.safeParse({
  NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
});

if (!parsedPublicEnvironment.success) {
  const fields = parsedPublicEnvironment.error.issues
    .map((issue) => issue.path.join(".") || "Supabase configuration")
    .join(", ");
  throw new Error(`Invalid public environment configuration: ${fields}`);
}

export const publicEnvironment = parsedPublicEnvironment.data;

export function isSupabaseConfigured(): boolean {
  return Boolean(
    publicEnvironment.NEXT_PUBLIC_SUPABASE_URL &&
    publicEnvironment.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
}

export function requireSupabaseEnvironment() {
  if (!isSupabaseConfigured()) {
    throw new Error(
      "Supabase belum dikonfigurasi. Isi variabel NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.",
    );
  }

  return {
    publishableKey: publicEnvironment.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    url: publicEnvironment.NEXT_PUBLIC_SUPABASE_URL,
  };
}
