import type { Metadata } from "next";
import { OperationalFormPage } from "@/features/operations/OperationalPages";
export const metadata: Metadata = { title: "Buat Sales Delivery" };
export default function Page() {
  return <OperationalFormPage kind="sales_delivery" />;
}
