import type { Metadata } from "next";
import { FixedAssetDetailPage } from "@/features/fixed-assets/FixedAssetPages";
export const metadata: Metadata = { title: "Detail Aset Tetap" };
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { id } = await params;
  return <FixedAssetDetailPage id={id} searchParams={searchParams} />;
}
