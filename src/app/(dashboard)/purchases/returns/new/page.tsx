import { ReturnFormPage } from "@/features/returns/ReturnPages";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ invoice?: string }>;
}) {
  return (
    <ReturnFormPage
      kind="purchase_return"
      sourceInvoiceId={(await searchParams).invoice}
    />
  );
}
