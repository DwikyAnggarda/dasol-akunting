import type { Metadata } from "next";
import {
  SettlementListPage,
  type SettlementSearchParams,
} from "@/features/settlements/SettlementPages";
export const metadata: Metadata = { title: "Penerimaan Pelanggan" };
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<SettlementSearchParams>;
}) {
  return <SettlementListPage kind="customer" searchParams={searchParams} />;
}
