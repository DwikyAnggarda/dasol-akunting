import { StockOperationFormPage } from "@/features/inventory/StockOperationPages";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <StockOperationFormPage
      id={(await params).id}
      operationType="stock_count"
    />
  );
}
