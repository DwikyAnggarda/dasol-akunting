import type { Metadata } from "next";
import { OperationalFormPage } from "@/features/operations/OperationalPages";
export const metadata: Metadata = { title: "Buat Sales Order" };
export default function Page() {
  return <OperationalFormPage kind="sales_order" />;
}
