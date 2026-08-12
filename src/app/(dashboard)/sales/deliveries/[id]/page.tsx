import type { Metadata } from "next";
import { OperationalDetailPage } from "@/features/operations/OperationalPages";
export const metadata: Metadata = { title: "Detail Sales Delivery" };
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { id } = await params;
  return (
    <OperationalDetailPage
      id={id}
      kind="sales_delivery"
      searchParams={searchParams}
    />
  );
}
