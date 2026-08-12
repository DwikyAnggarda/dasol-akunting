import type { Metadata } from "next";
import { SettlementEditorPage } from "@/features/settlements/SettlementPages";
export const metadata: Metadata = { title: "Edit Penerimaan Pelanggan" };
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <SettlementEditorPage id={id} kind="customer" />;
}
