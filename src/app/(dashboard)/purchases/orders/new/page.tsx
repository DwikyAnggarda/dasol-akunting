import type { Metadata } from "next";
import { OperationalFormPage } from "@/features/operations/OperationalPages";
export const metadata: Metadata = { title: "Buat Purchase Order" };
export default function Page() {
  return <OperationalFormPage kind="purchase_order" />;
}
