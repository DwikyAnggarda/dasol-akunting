import type { Metadata } from "next";
import { ModulePage, StatusBadge } from "@/components/common/ModulePage";
import { getActiveCompanyContext } from "@/server/queries/company-context";
import { getAccounts } from "@/server/queries/modules";
export const metadata: Metadata = { title: "Daftar Akun" };
export default async function AccountsPage() {
  const context = await getActiveCompanyContext();
  const rows = await getAccounts(context.companyId);
  return (
    <ModulePage
      title="Daftar Akun"
      description="Struktur akun perusahaan, saldo normal, dan status pencatatan manual."
      emptyTitle="Belum ada akun"
      emptyDescription="Jalankan seed demo atau tambahkan chart of accounts sebelum memposting transaksi."
      rows={rows}
      columns={[
        { key: "code", label: "Kode" },
        { key: "name", label: "Nama akun" },
        { key: "accountType", label: "Tipe" },
        { key: "normalBalance", label: "Saldo normal" },
        {
          key: "status",
          label: "Status",
          render: (value) => <StatusBadge value={String(value)} />,
        },
      ]}
    />
  );
}
