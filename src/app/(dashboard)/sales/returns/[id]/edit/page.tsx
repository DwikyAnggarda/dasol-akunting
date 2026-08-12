import { ReturnFormPage } from "@/features/returns/ReturnPages";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return <ReturnFormPage id={(await params).id} kind="sales_return" />;
}
