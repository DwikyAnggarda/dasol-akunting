import type { Metadata } from "next";
import { OperationalFormPage } from "@/features/operations/OperationalPages";
export const metadata: Metadata = { title: "Edit Sales Order" };
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <OperationalFormPage id={id} kind="sales_order" />;
}
