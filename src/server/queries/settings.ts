import { requireUser } from "@/server/auth/require-user";
export async function getCompanySettings(companyId: string) {
  const { supabase } = await requireUser();
  const [company, settings] = await Promise.all([
    supabase.from("companies").select("*").eq("id", companyId).single(),
    supabase
      .from("company_settings")
      .select("*")
      .eq("company_id", companyId)
      .single(),
  ]);
  if (company.error || settings.error) {
    console.error(
      "Company settings query failed",
      company.error ?? settings.error,
    );
    throw new Error("Pengaturan perusahaan tidak dapat dimuat.");
  }
  return { company: company.data, settings: settings.data };
}
