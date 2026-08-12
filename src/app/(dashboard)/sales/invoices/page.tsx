import type { Metadata } from "next";

import {
  InvoiceListPage,
  type InvoiceSearchParams,
} from "@/features/invoices/InvoicePages";

export const metadata: Metadata = { title: "Invoice Penjualan" };
export default async function SalesInvoicesPage({
  searchParams,
}: {
  searchParams: Promise<InvoiceSearchParams>;
}) {
  return <InvoiceListPage kind="sales" searchParams={searchParams} />;
}
