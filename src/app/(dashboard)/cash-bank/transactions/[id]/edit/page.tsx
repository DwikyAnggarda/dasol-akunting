import type { Metadata } from "next";
import { CashFormPage } from "@/features/cash/CashPages";
export const metadata: Metadata = { title: "Edit Transaksi Kas" };
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <CashFormPage id={id} />;
}
