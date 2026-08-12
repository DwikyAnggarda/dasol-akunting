import type { Metadata } from "next";
import { SettlementEditorPage } from "@/features/settlements/SettlementPages";
export const metadata: Metadata = { title: "Buat Pembayaran Pemasok" };
export default async function Page() {
  return <SettlementEditorPage kind="supplier" />;
}
