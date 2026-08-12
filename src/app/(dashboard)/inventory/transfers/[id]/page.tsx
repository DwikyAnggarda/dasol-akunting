import { StockOperationDetailPage } from "@/features/inventory/StockOperationPages";
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  return (
    <StockOperationDetailPage
      id={(await params).id}
      operationType="inventory_transfer"
      searchParams={searchParams}
    />
  );
}
