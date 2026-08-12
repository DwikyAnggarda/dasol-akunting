import { ReturnListPage } from "@/features/returns/ReturnPages";
export default function Page({
  searchParams,
}: {
  searchParams: Promise<{ deleted?: string }>;
}) {
  return <ReturnListPage kind="purchase_return" searchParams={searchParams} />;
}
