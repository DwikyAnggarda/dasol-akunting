import type { Metadata } from "next";
import { CashFormPage } from "@/features/cash/CashPages";
export const metadata: Metadata = { title: "Buat Transaksi Kas" };
export default function Page() {
  return <CashFormPage />;
}
