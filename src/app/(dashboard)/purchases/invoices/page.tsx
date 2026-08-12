import type { Metadata } from "next";

import {
  InvoiceListPage,
  type InvoiceSearchParams,
} from "@/features/invoices/InvoicePages";

export const metadata: Metadata = { title: "Invoice Pembelian" };
export default async function PurchaseInvoicesPage({
  searchParams,
}: {
  searchParams: Promise<InvoiceSearchParams>;
}) {
  return <InvoiceListPage kind="purchase" searchParams={searchParams} />;
}
