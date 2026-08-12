import { z } from "zod";
import { requireUser } from "@/server/auth/require-user";

const decimalValue = z.union([z.string(), z.number()]).transform(String);
const ledgerSchema = z.object({
  balanced: z.boolean(),
  total_credit: decimalValue,
  total_debit: decimalValue,
});
const subledgerSchema = z.object({
  ap_balanced: z.boolean(),
  ap_ledger: decimalValue,
  ap_subledger: decimalValue,
  ar_balanced: z.boolean(),
  ar_ledger: decimalValue,
  ar_subledger: decimalValue,
});
export type ReportHealth = {
  apBalanced: boolean;
  apLedger: string;
  apSubledger: string;
  arBalanced: boolean;
  arLedger: string;
  arSubledger: string;
  ledgerBalanced: boolean;
  totalCredit: string;
  totalDebit: string;
};
export async function getReportHealth(
  companyId: string,
): Promise<ReportHealth> {
  const { supabase } = await requireUser();
  const today = new Date().toISOString().slice(0, 10);
  const [ledgerResult, subledgerResult] = await Promise.all([
    supabase.rpc("verify_general_ledger_balance", {
      p_company_id: companyId,
      p_from: "1900-01-01",
      p_to: today,
    }),
    supabase.rpc("verify_subledger_reconciliation", {
      p_company_id: companyId,
    }),
  ]);
  if (ledgerResult.error || subledgerResult.error)
    throw new Error("Rekonsiliasi laporan tidak dapat dijalankan.");
  const ledger = ledgerSchema.safeParse(
    Array.isArray(ledgerResult.data) ? ledgerResult.data[0] : ledgerResult.data,
  );
  const subledger = subledgerSchema.safeParse(subledgerResult.data);
  if (!ledger.success || !subledger.success)
    throw new Error("Hasil rekonsiliasi laporan tidak valid.");
  return {
    apBalanced: subledger.data.ap_balanced,
    apLedger: subledger.data.ap_ledger,
    apSubledger: subledger.data.ap_subledger,
    arBalanced: subledger.data.ar_balanced,
    arLedger: subledger.data.ar_ledger,
    arSubledger: subledger.data.ar_subledger,
    ledgerBalanced: ledger.data.balanced,
    totalCredit: ledger.data.total_credit,
    totalDebit: ledger.data.total_debit,
  };
}
