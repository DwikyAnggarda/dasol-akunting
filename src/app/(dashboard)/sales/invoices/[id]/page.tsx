import type { Metadata } from "next";
import { InvoiceDetailPage } from "@/features/invoices/InvoicePages";
export const metadata: Metadata = { title: "Detail Invoice Penjualan" };
export default async function SalesInvoiceDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { id } = await params;
  return <InvoiceDetailPage id={id} kind="sales" searchParams={searchParams} />;
}
