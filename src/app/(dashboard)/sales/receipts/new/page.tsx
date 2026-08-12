import type { Metadata } from "next";
import { SettlementEditorPage } from "@/features/settlements/SettlementPages";
export const metadata: Metadata = { title: "Buat Penerimaan Pelanggan" };
export default async function Page() {
  return <SettlementEditorPage kind="customer" />;
}
