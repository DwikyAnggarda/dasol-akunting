import type { Metadata } from "next";
import { InvoiceEditorPage } from "@/features/invoices/InvoicePages";
export const metadata: Metadata = { title: "Edit Invoice Pembelian" };
export default async function EditPurchaseInvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <InvoiceEditorPage id={id} kind="purchase" />;
}
