import type { Metadata } from "next";
import { FixedAssetListPage } from "@/features/fixed-assets/FixedAssetPages";
export const metadata: Metadata = { title: "Aset Tetap" };
export default function Page({
  searchParams,
}: {
  searchParams: Promise<{ deleted?: string }>;
}) {
  return <FixedAssetListPage searchParams={searchParams} />;
}
