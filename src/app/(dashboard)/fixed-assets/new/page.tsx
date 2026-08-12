import type { Metadata } from "next";
import { FixedAssetFormPage } from "@/features/fixed-assets/FixedAssetPages";
export const metadata: Metadata = { title: "Tambah Aset Tetap" };
export default function Page() {
  return <FixedAssetFormPage />;
}
