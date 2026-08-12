import { createClient, type User } from "@supabase/supabase-js";
import { config } from "dotenv";
import { z } from "zod";

config({ path: ".env.local", quiet: true });

const environmentSchema = z.object({
  DEMO_ACCOUNTANT_EMAIL: z.email(),
  DEMO_ACCOUNTANT_PASSWORD: z.string().min(12),
  DEMO_ADMIN_EMAIL: z.email(),
  DEMO_ADMIN_PASSWORD: z.string().min(12),
  DEMO_APPROVER_EMAIL: z.email(),
  DEMO_APPROVER_PASSWORD: z.string().min(12),
  DEMO_OPERATOR_EMAIL: z.email(),
  DEMO_OPERATOR_PASSWORD: z.string().min(12),
  DEMO_SEED_ALLOW_PRODUCTION: z.enum(["true", "false"]).default("false"),
  DEMO_SEED_ENABLED: z.literal("true"),
  DEMO_VIEWER_EMAIL: z.email(),
  DEMO_VIEWER_PASSWORD: z.string().min(12),
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
});

const parsed = environmentSchema.safeParse(process.env);
if (!parsed.success) {
  const fields = parsed.error.issues
    .map((issue) => issue.path.join("."))
    .join(", ");
  throw new Error(`Demo seed environment is incomplete or unsafe: ${fields}`);
}
const environment = parsed.data;
if (
  process.env.NODE_ENV === "production" &&
  environment.DEMO_SEED_ALLOW_PRODUCTION !== "true"
) {
  throw new Error("Demo seed is blocked in production.");
}

const supabase = createClient(
  environment.NEXT_PUBLIC_SUPABASE_URL,
  environment.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: { autoRefreshToken: false, persistSession: false },
  },
);

async function findUserByEmail(email: string): Promise<User | null> {
  for (let page = 1; page <= 100; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage: 100,
    });
    if (error) throw new Error("Unable to inspect demo users.");
    const match = data.users.find(
      (user) => user.email?.toLowerCase() === email.toLowerCase(),
    );
    if (match) return match;
    if (data.users.length < 100) return null;
  }
  throw new Error("Demo user lookup exceeded the safe pagination limit.");
}

async function ensureUser(
  email: string,
  password: string,
  displayName: string,
): Promise<string> {
  const existing = await findUserByEmail(email);
  if (existing) {
    const { error } = await supabase.auth.admin.updateUserById(existing.id, {
      email_confirm: true,
      password,
      user_metadata: { display_name: displayName },
    });
    if (error)
      throw new Error(`Unable to update the ${displayName} demo user.`);
    return existing.id;
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    email_confirm: true,
    password,
    user_metadata: { display_name: displayName },
  });
  if (error || !data.user)
    throw new Error(`Unable to create the ${displayName} demo user.`);
  return data.user.id;
}

async function main(): Promise<void> {
  const users = {
    accountant: await ensureUser(
      environment.DEMO_ACCOUNTANT_EMAIL,
      environment.DEMO_ACCOUNTANT_PASSWORD,
      "Akuntan Demo",
    ),
    administrator: await ensureUser(
      environment.DEMO_ADMIN_EMAIL,
      environment.DEMO_ADMIN_PASSWORD,
      "Administrator Demo",
    ),
    approver: await ensureUser(
      environment.DEMO_APPROVER_EMAIL,
      environment.DEMO_APPROVER_PASSWORD,
      "Approver Demo",
    ),
    operator: await ensureUser(
      environment.DEMO_OPERATOR_EMAIL,
      environment.DEMO_OPERATOR_PASSWORD,
      "Operator Demo",
    ),
    viewer: await ensureUser(
      environment.DEMO_VIEWER_EMAIL,
      environment.DEMO_VIEWER_PASSWORD,
      "Auditor Demo",
    ),
  };

  const { data: companyId, error } = await supabase.rpc(
    "bootstrap_demo_company",
    { p_users: users },
  );
  if (error || typeof companyId !== "string")
    throw new Error("The database rejected demo company bootstrap.");

  process.stdout.write(
    `Demo company is ready (${companyId}). Passwords were read from the environment and were not logged.\n`,
  );
}

void main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Unknown error";
  process.stderr.write(`Demo seed failed: ${message}\n`);
  process.exitCode = 1;
});
