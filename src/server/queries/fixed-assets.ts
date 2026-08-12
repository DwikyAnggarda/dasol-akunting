import { requireUser } from "@/server/auth/require-user";

export async function getFixedAssetOptions(companyId: string) {
  const { supabase } = await requireUser();
  const [categories, accounts] = await Promise.all([
    supabase
      .from("fixed_asset_categories")
      .select("id,code,name,default_useful_life_months")
      .eq("company_id", companyId)
      .eq("is_active", true)
      .order("code"),
    supabase
      .from("chart_of_accounts")
      .select("id,code,name,account_type")
      .eq("company_id", companyId)
      .eq("is_active", true)
      .order("code"),
  ]);
  if (categories.error || accounts.error)
    throw new Error("Pilihan aset tetap tidak dapat dimuat.");
  return { accounts: accounts.data ?? [], categories: categories.data ?? [] };
}

export async function getFixedAssetCategories(companyId: string) {
  const { supabase } = await requireUser();
  const { data, error } = await supabase
    .from("fixed_asset_categories")
    .select("*")
    .eq("company_id", companyId)
    .order("code");
  if (error) throw new Error("Kategori aset tidak dapat dimuat.");
  return data ?? [];
}

export async function getFixedAssets(companyId: string) {
  const { supabase } = await requireUser();
  const { data, error } = await supabase
    .from("fixed_assets")
    .select(
      "id,asset_code,name,acquisition_date,acquisition_cost,accumulated_depreciation,status,version,fixed_asset_categories!inner(name)",
    )
    .eq("company_id", companyId)
    .order("asset_code");
  if (error) throw new Error("Daftar aset tetap tidak dapat dimuat.");
  return data ?? [];
}

export async function getFixedAsset(companyId: string, id: string) {
  const { supabase } = await requireUser();
  const { data, error } = await supabase
    .from("fixed_assets")
    .select("*,fixed_asset_categories(*)")
    .eq("company_id", companyId)
    .eq("id", id)
    .maybeSingle();
  if (error || !data) throw new Error("Aset tetap tidak ditemukan.");
  const [schedule, disposalJournal] = await Promise.all([
    supabase
      .from("fixed_asset_depreciation_entries")
      .select(
        "id,period_date,amount,status,journal_entry_id,journal_entries(journal_number)",
      )
      .eq("company_id", companyId)
      .eq("asset_id", id)
      .order("period_date"),
    data.disposal_journal_id
      ? supabase
          .from("journal_entries")
          .select("id,journal_number")
          .eq("id", data.disposal_journal_id)
          .single()
      : Promise.resolve({ data: null, error: null }),
  ]);
  if (schedule.error) throw new Error("Jadwal penyusutan tidak dapat dimuat.");
  return {
    ...data,
    disposalJournal: disposalJournal.data,
    schedule: schedule.data ?? [],
  };
}
