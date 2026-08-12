import type { Metadata } from "next";
import { CategoryFormPage } from "@/features/fixed-assets/FixedAssetPages";
export const metadata: Metadata = { title: "Tambah Kategori Aset" };
export default function Page() {
  return <CategoryFormPage />;
}
