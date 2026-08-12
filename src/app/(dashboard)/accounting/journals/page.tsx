import Link from "next/link";
import type { Metadata } from "next";
import { DocumentFilters } from "@/components/common/DocumentFilters";
import { ModulePage, StatusBadge } from "@/components/common/ModulePage";
import { Pagination } from "@/components/common/Pagination";
import { formatIDR } from "@/domain/money";
import { requireCompanyPermission } from "@/server/auth/require-permission";
import { getJournalRecords } from "@/server/queries/accounting";
export const metadata: Metadata = { title: "Jurnal Umum" };
export default async function JournalsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string; status?: string }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page ?? "1") || 1);
  const context = await requireCompanyPermission("journal.read");
  const records = await getJournalRecords(context.companyId, {
    page,
    q: params.q?.trim(),
    status: params.status,
  });
  const rows = records.slice(0, 50);
  return (
    <ModulePage
      actions={
        context.permissions.includes("journal.post") ? (
          <Link
            className="bg-brand-500 rounded-xl px-4 py-2.5 text-sm font-semibold text-white"
            href="/accounting/journals/new"
          >
            Jurnal manual
          </Link>
        ) : undefined
      }
      columns={[
        {
          key: "journal_number",
          label: "Nomor",
          render: (value, row) => (
            <Link
              className="text-brand-600 font-semibold"
              href={`/accounting/journals/${row.id}`}
            >
              {String(value)}
            </Link>
          ),
        },
        { key: "posting_date", label: "Tanggal posting" },
        { key: "description", label: "Keterangan" },
        { key: "source_type", label: "Sumber" },
        {
          key: "status",
          label: "Status",
          render: (value) => <StatusBadge value={String(value)} />,
        },
        {
          align: "right",
          key: "total_debit",
          label: "Debit = Kredit",
          render: (value) => formatIDR(String(value)),
        },
      ]}
      description="Jurnal posted bersifat immutable; koreksi dilakukan dengan reversal yang menghasilkan jurnal pembalik."
      emptyDescription="Jurnal akan terbentuk saat transaksi diposting atau jurnal manual dibuat."
      emptyTitle="Belum ada jurnal"
      filters={<DocumentFilters q={params.q} status={params.status} />}
      rows={rows}
      title="Jurnal Umum"
      trailing={
        <Pagination
          hasNext={records.length > 50}
          page={page}
          searchParams={params}
        />
      }
    />
  );
}
