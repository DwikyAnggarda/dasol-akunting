import type { Metadata } from "next";
import { OperationalListPage } from "@/features/operations/OperationalPages";
export const metadata: Metadata = { title: "Purchase Order" };
export default function Page({
  searchParams,
}: {
  searchParams: Promise<{ deleted?: string }>;
}) {
  return (
    <OperationalListPage kind="purchase_order" searchParams={searchParams} />
  );
}
