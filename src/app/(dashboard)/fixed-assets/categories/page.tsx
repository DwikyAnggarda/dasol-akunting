import type { Metadata } from "next";
import { CategoryListPage } from "@/features/fixed-assets/FixedAssetPages";
export const metadata: Metadata = { title: "Kategori Aset Tetap" };
export default function Page() {
  return <CategoryListPage />;
}
