import type { Metadata } from "next";
import { OperationalFormPage } from "@/features/operations/OperationalPages";
export const metadata: Metadata = { title: "Buat Goods Receipt" };
export default function Page() {
  return <OperationalFormPage kind="goods_receipt" />;
}
