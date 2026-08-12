import { OperationalDetailPage } from "@/features/operations/OperationalPages";
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
      kind="purchase_request"
      searchParams={searchParams}
    />
  );
}
