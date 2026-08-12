import type { Metadata } from "next";

import { AdjustmentFormPage } from "@/features/inventory/AdjustmentPages";

export const metadata: Metadata = { title: "Edit Stock Adjustment" };
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <AdjustmentFormPage id={id} />;
}
