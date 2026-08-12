import type { Metadata } from "next";
import { OperationalListPage } from "@/features/operations/OperationalPages";
export const metadata: Metadata = { title: "Sales Order" };
export default function Page({
  searchParams,
}: {
  searchParams: Promise<{ deleted?: string }>;
}) {
  return <OperationalListPage kind="sales_order" searchParams={searchParams} />;
}
