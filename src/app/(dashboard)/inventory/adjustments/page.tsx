import type { Metadata } from "next";

import {
  AdjustmentListPage,
  type InventorySearchParams,
} from "@/features/inventory/AdjustmentPages";

export const metadata: Metadata = { title: "Stock Adjustment" };
export default function Page({
  searchParams,
}: {
  searchParams: Promise<InventorySearchParams>;
}) {
  return <AdjustmentListPage searchParams={searchParams} />;
}
