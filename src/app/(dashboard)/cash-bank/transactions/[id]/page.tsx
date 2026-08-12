import type { Metadata } from "next";
import { CashDetailPage } from "@/features/cash/CashPages";
export const metadata: Metadata = { title: "Detail Transaksi Kas" };
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { id } = await params;
  return <CashDetailPage id={id} searchParams={searchParams} />;
}
