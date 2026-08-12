import type { Metadata } from "next";
import { InvoiceEditorPage } from "@/features/invoices/InvoicePages";
export const metadata: Metadata = { title: "Buat Invoice Pembelian" };
export default async function NewPurchaseInvoicePage() {
  return <InvoiceEditorPage kind="purchase" />;
}
