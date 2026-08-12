import { StockOperationListPage } from "@/features/inventory/StockOperationPages";
export default function Page({
  searchParams,
}: {
  searchParams: Promise<{ deleted?: string }>;
}) {
  return (
    <StockOperationListPage
      operationType="inventory_transfer"
      searchParams={searchParams}
    />
  );
}
