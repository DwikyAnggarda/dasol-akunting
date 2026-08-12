import Link from "next/link";
import type { Metadata } from "next";
import { EntityDetails } from "@/components/common/EntityDetails";
import { EntityPage } from "@/components/common/EntityPage";
import { StatusBadge } from "@/components/common/ModulePage";
import { ReversalForm } from "@/components/forms/ReversalForm";
import { formatIDR } from "@/domain/money";
import { reverseJournalAction } from "@/features/accounting/actions";
import { detailCardClass } from "@/features/master/page-ui";
import { requireCompanyPermission } from "@/server/auth/require-permission";
import { getJournalRecord } from "@/server/queries/accounting";
export const metadata: Metadata = { title: "Detail Jurnal" };
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ posted?: string; reversed?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const context = await requireCompanyPermission("journal.read");
  const record = await getJournalRecord(context.companyId, id);
  const message =
    query.posted === "1"
      ? "Jurnal berhasil diposting."
      : query.reversed === "1"
        ? "Jurnal pembalik berhasil diposting."
        : undefined;
  return (
    <EntityPage
      description="Header, baris debit/kredit, sumber, dan status reversal jurnal."
      title={record.journal_number}
    >
      {message ? (
        <p
          className="bg-success-50 text-success-700 mb-4 rounded-xl p-3 text-sm"
          role="status"
        >
          {message}
        </p>
      ) : null}
      <section className={detailCardClass}>
        <EntityDetails
          items={[
            { label: "Tanggal posting", value: record.posting_date },
            { label: "Keterangan", value: record.description },
            { label: "Sumber", value: record.source_type },
            { label: "Cabang", value: record.branches?.name },
            { label: "Status", value: <StatusBadge value={record.status} /> },
            { label: "Total", value: formatIDR(String(record.total_debit)) },
          ]}
        />
        <div className="mt-5 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs text-gray-500 uppercase">
                <th className="py-3">#</th>
                <th>Akun</th>
                <th>Deskripsi</th>
                <th className="text-right">Debit</th>
                <th className="text-right">Kredit</th>
              </tr>
            </thead>
            <tbody>
              {record.lines.map(
                (line: {
                  chart_of_accounts: { code: string; name: string } | null;
                  credit: number;
                  debit: number;
                  description: string;
                  id: string;
                  line_number: number;
                }) => (
                  <tr
                    className="border-b border-gray-100 dark:border-gray-800"
                    key={line.id}
                  >
                    <td className="py-3">{line.line_number}</td>
                    <td>
                      {line.chart_of_accounts
                        ? `${line.chart_of_accounts.code} — ${line.chart_of_accounts.name}`
                        : "—"}
                    </td>
                    <td>{line.description}</td>
                    <td className="text-right">
                      {formatIDR(String(line.debit))}
                    </td>
                    <td className="text-right">
                      {formatIDR(String(line.credit))}
                    </td>
                  </tr>
                ),
              )}
            </tbody>
          </table>
        </div>
        {record.reversal ? (
          <p className="bg-warning-50 text-warning-700 mt-4 rounded-lg p-3 text-sm">
            Sudah direversal oleh jurnal{" "}
            {Array.isArray(record.reversal.journal_entries)
              ? record.reversal.journal_entries[0]?.journal_number
              : record.reversal.journal_entries?.journal_number}
            .
          </p>
        ) : null}
      </section>
      {record.source_type === "manual_journal" &&
      record.status === "posted" &&
      !record.reversal &&
      context.permissions.includes("journal.reverse") ? (
        <section className={`${detailCardClass} mt-4`}>
          <h2 className="mb-4 font-semibold">Reversal Jurnal</h2>
          <ReversalForm
            action={reverseJournalAction}
            fields={{ id }}
            label="Reverse jurnal"
            today={new Date().toISOString().slice(0, 10)}
          />
        </section>
      ) : null}
      <Link
        className="text-brand-600 mt-4 inline-block text-sm font-semibold"
        href="/accounting/journals"
      >
        ← Kembali ke daftar
      </Link>
    </EntityPage>
  );
}
