import { OperationalFormPage } from "@/features/operations/OperationalPages";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return <OperationalFormPage id={(await params).id} kind="purchase_request" />;
}
