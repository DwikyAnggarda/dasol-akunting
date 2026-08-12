import type { Metadata } from "next";
import { FinancialReportPage } from "@/features/reports/FinancialReportPage";
export const metadata: Metadata = { title: "Laporan Keuangan" };
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ report: string }>;
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const { report } = await params;
  return <FinancialReportPage report={report} searchParams={searchParams} />;
}
