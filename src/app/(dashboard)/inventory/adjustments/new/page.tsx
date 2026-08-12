import type { Metadata } from "next";

import { AdjustmentFormPage } from "@/features/inventory/AdjustmentPages";

export const metadata: Metadata = { title: "Buat Stock Adjustment" };
export default function Page() {
  return <AdjustmentFormPage />;
}
