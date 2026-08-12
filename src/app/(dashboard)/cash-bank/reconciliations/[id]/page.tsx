import Link from "next/link";
import { EntityDetails } from "@/components/common/EntityDetails";
import { EntityPage } from "@/components/common/EntityPage";
import { StatusBadge } from "@/components/common/ModulePage";
import { ConfirmActionForm } from "@/components/forms/ConfirmActionForm";
import { formatIDR } from "@/domain/money";
import { detailCardClass } from "@/features/master/page-ui";
import { finalizeReconciliationAction } from "@/features/reconciliation/actions";
import {
  AdjustmentLineForm,
  MatchLineForm,
  UnmatchLineForm,
} from "@/features/reconciliation/LineActions";
import { requireCompanyPermission } from "@/server/auth/require-permission";
import { getReconciliation } from "@/server/queries/reconciliation";
type StatementLine = {
  adjustment_journal_id: string | null;
  amount: number | string;
  description: string;
  id: string;
  line_number: number;
  reference: string | null;
  status: string;
  transaction_date: string;
};
type Candidate = {
  amount: number;
  date: string;
  id: string;
  label: string;
  type: string;
};
type Account = { code: string; id: string; name: string };
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { id } = await params,
    query = await searchParams,
    context = await requireCompanyPermission("report.financial.read"),
    record = await getReconciliation(context.companyId, id),
    lines = record.lines as StatementLine[],
    candidates = record.candidates as Candidate[],
    accounts = record.accounts as Account[],
    bank = Array.isArray(record.bank_accounts)
      ? record.bank_accounts[0]
      : record.bank_accounts,
    messages: Record<string, string> = {
      adjusted: "Adjustment berhasil diposting.",
      finalized: "Rekonsiliasi berhasil difinalisasi.",
      matched: "Transaksi berhasil dicocokkan.",
      saved: "Statement berhasil diimpor.",
      unmatched: "Match berhasil dibatalkan.",
    },
    message = Object.keys(messages).find((key) => query[key] === "1"),
    canManage =
      record.status === "draft" &&
      context.permissions.includes("settings.manage"),
    unmatched = lines.filter(
      (line: StatementLine) => line.status === "unmatched",
    ).length;
  return (
    <EntityPage
      description="Setiap baris harus matched atau adjusted sebelum saldo dapat difinalisasi."
      title={`Rekonsiliasi ${bank?.code ?? "Bank"}`}
    >
      {message ? (
        <p
          className="bg-success-50 text-success-700 mb-4 rounded-xl p-3 text-sm"
          role="status"
        >
          {messages[message]}
        </p>
      ) : null}
      <section className={detailCardClass}>
        <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
          <EntityDetails
            items={[
              {
                label: "Akun",
                value: bank ? `${bank.code} — ${bank.name}` : "—",
              },
              { label: "Tanggal", value: record.statement_date },
              {
                label: "Saldo pembukaan",
                value: formatIDR(String(record.opening_balance)),
              },
              {
                label: "Saldo penutupan",
                value: formatIDR(String(record.closing_balance)),
              },
              { label: "Belum matched", value: String(unmatched) },
              { label: "Status", value: <StatusBadge value={record.status} /> },
            ]}
          />
          {canManage ? (
            <ConfirmActionForm
              action={finalizeReconciliationAction}
              confirmMessage="Finalisasi akan mengunci rekonsiliasi ini. Semua baris dan saldo harus valid. Lanjutkan?"
              fields={{ id }}
              label="Finalisasi"
              tone="primary"
            />
          ) : null}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-sm">
            <thead>
              <tr className="border-b text-left text-xs text-gray-500 uppercase">
                <th className="py-3">#</th>
                <th>Tanggal</th>
                <th>Deskripsi</th>
                <th>Referensi</th>
                <th className="text-right">Amount</th>
                <th>Status / Aksi</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((line: StatementLine) => {
                const matching = candidates
                  .filter(
                    (candidate: Candidate) =>
                      Math.abs(candidate.amount - Number(line.amount)) < 0.0001,
                  )
                  .map((candidate: Candidate) => ({
                    label: candidate.label,
                    value: `${candidate.type}:${candidate.id}`,
                  }));
                return (
                  <tr
                    className="border-b border-gray-100 align-top dark:border-gray-800"
                    key={line.id}
                  >
                    <td className="py-3">{line.line_number}</td>
                    <td>{line.transaction_date}</td>
                    <td>{line.description}</td>
                    <td>{line.reference ?? "—"}</td>
                    <td className="text-right font-semibold">
                      {formatIDR(String(line.amount))}
                    </td>
                    <td className="space-y-2">
                      <StatusBadge value={line.status} />
                      {canManage && line.status === "unmatched" ? (
                        <>
                          <MatchLineForm
                            candidates={matching}
                            lineId={line.id}
                            reconciliationId={id}
                          />
                          <AdjustmentLineForm
                            accounts={accounts.map((account: Account) => ({
                              label: `${account.code} — ${account.name}`,
                              value: account.id,
                            }))}
                            lineId={line.id}
                            reconciliationId={id}
                          />
                        </>
                      ) : null}
                      {canManage && line.status === "matched" ? (
                        <UnmatchLineForm
                          lineId={line.id}
                          reconciliationId={id}
                        />
                      ) : null}
                      {line.adjustment_journal_id ? (
                        <Link
                          className="text-brand-600 block text-xs font-semibold"
                          href={`/accounting/journals/${line.adjustment_journal_id}`}
                        >
                          Lihat jurnal
                        </Link>
                      ) : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
      <Link
        className="text-brand-600 mt-4 inline-block text-sm font-semibold"
        href="/cash-bank/reconciliations"
      >
        ← Kembali ke daftar
      </Link>
    </EntityPage>
  );
}
