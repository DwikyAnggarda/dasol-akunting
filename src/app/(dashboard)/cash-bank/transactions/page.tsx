import type { Metadata } from "next";
import { CashListPage } from "@/features/cash/CashPages";
export const metadata: Metadata = { title: "Transaksi Kas & Bank" };
export default function Page({
  searchParams,
}: {
  searchParams: Promise<{ deleted?: string }>;
}) {
  return <CashListPage searchParams={searchParams} />;
}
