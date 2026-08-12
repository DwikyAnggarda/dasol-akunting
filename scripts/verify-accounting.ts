import {
  createClient,
  type WebSocketLikeConstructor,
} from "@supabase/supabase-js";
import Decimal from "decimal.js";
import { config } from "dotenv";
import WebSocket from "ws";
import { z } from "zod";

config({ path: ".env.local", quiet: true });

const environment = z
  .object({
    NEXT_PUBLIC_SUPABASE_URL: z.url(),
    SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  })
  .parse(process.env);

// See seed-demo.ts: the implementation is compatible, but `ws` exposes an
// extra server-only constructor overload that needs an explicit interop cast.
const nodeWebSocketTransport = WebSocket as unknown as WebSocketLikeConstructor;

const supabase = createClient(
  environment.NEXT_PUBLIC_SUPABASE_URL,
  environment.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: { autoRefreshToken: false, persistSession: false },
    realtime: { transport: nodeWebSocketTransport },
  },
);
async function main(): Promise<void> {
  const { data: companies, error: companiesError } = await supabase
    .from("companies")
    .select("id,code,name")
    .eq("status", "active")
    .order("code");
  if (companiesError)
    throw new Error("Unable to read companies for accounting verification.");

  let failed = false;
  for (const company of companies ?? []) {
    const { data: entries, error: entryError } = await supabase
      .from("journal_entries")
      .select("id,journal_number,total_debit,total_credit")
      .eq("company_id", company.id)
      .eq("status", "posted");
    if (entryError)
      throw new Error(`Unable to verify journals for ${company.code}.`);
    const unbalanced = (entries ?? []).filter(
      (entry) =>
        !new Decimal(String(entry.total_debit)).equals(
          String(entry.total_credit),
        ),
    );
    const totalDebit = (entries ?? []).reduce(
      (sum, entry) => sum.plus(String(entry.total_debit)),
      new Decimal(0),
    );
    const totalCredit = (entries ?? []).reduce(
      (sum, entry) => sum.plus(String(entry.total_credit)),
      new Decimal(0),
    );
    const balanced = unbalanced.length === 0 && totalDebit.equals(totalCredit);
    process.stdout.write(
      `${company.code}: ${entries?.length ?? 0} posted journal(s), balance=${balanced ? "PASS" : "FAIL"}\n`,
    );
    if (!balanced) failed = true;
  }
  if (failed) throw new Error("Accounting verification failed.");
}

void main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Unknown error";
  process.stderr.write(`Accounting verification failed: ${message}\n`);
  process.exitCode = 1;
});
