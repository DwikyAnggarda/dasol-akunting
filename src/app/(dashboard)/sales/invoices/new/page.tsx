import type { Metadata } from "next";
import { InvoiceEditorPage } from "@/features/invoices/InvoicePages";
export const metadata: Metadata = { title: "Buat Invoice Penjualan" };
export default async function NewSalesInvoicePage() {
  return <InvoiceEditorPage kind="sales" />;
}
