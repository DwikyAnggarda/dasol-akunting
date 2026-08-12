import type { Metadata } from "next";
import { SettlementDetailPage } from "@/features/settlements/SettlementPages";
export const metadata: Metadata = { title: "Detail Pembayaran Pemasok" };
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { id } = await params;
  return (
    <SettlementDetailPage id={id} kind="supplier" searchParams={searchParams} />
  );
}
