import { ReturnFormPage } from "@/features/returns/ReturnPages";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ invoice?: string }>;
}) {
  return (
    <ReturnFormPage
      kind="sales_return"
      sourceInvoiceId={(await searchParams).invoice}
    />
  );
}
