import { ReturnDetailPage } from "@/features/returns/ReturnPages";
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  return (
    <ReturnDetailPage
      id={(await params).id}
      kind="sales_return"
      searchParams={searchParams}
    />
  );
}
