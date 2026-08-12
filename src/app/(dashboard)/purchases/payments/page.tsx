import type { Metadata } from "next";
import {
  SettlementListPage,
  type SettlementSearchParams,
} from "@/features/settlements/SettlementPages";
export const metadata: Metadata = { title: "Pembayaran Pemasok" };
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<SettlementSearchParams>;
}) {
  return <SettlementListPage kind="supplier" searchParams={searchParams} />;
}
