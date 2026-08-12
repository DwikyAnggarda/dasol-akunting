import { notFound } from "next/navigation";
import { requireUser } from "@/server/auth/require-user";
export async function getAuditRecord(companyId: string, id: string) {
  const { supabase } = await requireUser();
  const { data, error } = await supabase
    .from("audit_logs")
    .select("*")
    .eq("company_id", companyId)
    .eq("id", id)
    .maybeSingle();
  if (error) {
    console.error("Audit detail query failed", error);
    throw new Error("Detail audit tidak dapat dimuat.");
  }
  if (!data) notFound();
  return data;
}
