import type { Metadata } from "next";

import { AdjustmentDetailPage } from "@/features/inventory/AdjustmentPages";

export const metadata: Metadata = { title: "Detail Stock Adjustment" };
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { id } = await params;
  return <AdjustmentDetailPage id={id} searchParams={searchParams} />;
}
