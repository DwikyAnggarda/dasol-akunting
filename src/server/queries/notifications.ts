import { requireUser } from "@/server/auth/require-user";

export async function getNotifications(companyId: string) {
  const { supabase } = await requireUser();
  const { data, error } = await supabase
    .from("notifications")
    .select(
      "id,notification_type,title,message,entity_type,entity_id,read_at,created_at",
    )
    .eq("company_id", companyId)
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw new Error("Notifikasi tidak dapat dimuat.");
  return data ?? [];
}
