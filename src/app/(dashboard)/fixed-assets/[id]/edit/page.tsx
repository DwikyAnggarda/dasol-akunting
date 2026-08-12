import type { Metadata } from "next";
import { FixedAssetFormPage } from "@/features/fixed-assets/FixedAssetPages";
export const metadata: Metadata = { title: "Edit Aset Tetap" };
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <FixedAssetFormPage id={id} />;
}
