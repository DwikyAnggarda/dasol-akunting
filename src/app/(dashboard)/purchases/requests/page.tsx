import { OperationalListPage } from "@/features/operations/OperationalPages";
export default function Page({
  searchParams,
}: {
  searchParams: Promise<{ deleted?: string }>;
}) {
  return (
    <OperationalListPage kind="purchase_request" searchParams={searchParams} />
  );
}
