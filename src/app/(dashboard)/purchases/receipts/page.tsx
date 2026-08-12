import type { Metadata } from "next";
import { OperationalListPage } from "@/features/operations/OperationalPages";
export const metadata: Metadata = { title: "Goods Receipt" };
export default function Page({
  searchParams,
}: {
  searchParams: Promise<{ deleted?: string }>;
}) {
  return (
    <OperationalListPage kind="goods_receipt" searchParams={searchParams} />
  );
}
