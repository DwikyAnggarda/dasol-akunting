import type { Metadata } from "next";
import { CategoryFormPage } from "@/features/fixed-assets/FixedAssetPages";
export const metadata: Metadata = { title: "Edit Kategori Aset" };
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <CategoryFormPage id={id} />;
}
