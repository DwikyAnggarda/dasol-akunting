import Link from "next/link";
import { redirect } from "next/navigation";
import { EntityDetails } from "@/components/common/EntityDetails";
import { EntityPage, FormCard } from "@/components/common/EntityPage";
import { ModulePage, StatusBadge } from "@/components/common/ModulePage";
import { ConfirmActionForm } from "@/components/forms/ConfirmActionForm";
import {
  MutationForm,
  type MutationField,
} from "@/components/forms/MutationForm";
import { ReversalForm } from "@/components/forms/ReversalForm";
import { WorkflowActionForm } from "@/components/forms/WorkflowActionForm";
import { formatIDR } from "@/domain/money";
import { detailCardClass } from "@/features/master/page-ui";
import { requireCompanyPermission } from "@/server/auth/require-permission";
import {
  getCashOptions,
  getCashTransaction,
  getCashTransactions,
} from "@/server/queries/cash";
import {
  decideCashTransactionAction,
  deleteCashTransactionAction,
  postCashTransactionAction,
  reverseCashTransactionAction,
  saveCashTransactionAction,
  submitCashTransactionAction,
} from "./actions";

export async function CashListPage({
  searchParams,
}: {
  searchParams: Promise<{ deleted?: string }>;
}) {
  const params = await searchParams;
  const context = await requireCompanyPermission("cash.read");
  const rows = await getCashTransactions(context.companyId);
  return (
    <ModulePage
      actions={
        context.permissions.includes("cash.create") ? (
          <Link
            className="bg-brand-500 rounded-xl px-4 py-2.5 text-sm font-semibold text-white"
            href="/cash-bank/transactions/new"
          >
            Buat transaksi
          </Link>
        ) : undefined
      }
      columns={[
        {
          key: "document_number",
          label: "Nomor",
          render: (value, row) => (
            <Link
              className="text-brand-600 font-semibold"
              href={`/cash-bank/transactions/${row.id}`}
            >
              {String(value)}
            </Link>
          ),
        },
        { key: "transaction_date", label: "Tanggal" },
        { key: "transaction_type", label: "Tipe" },
        {
          key: "bank_accounts",
          label: "Akun kas/bank",
          render: (value) =>
            Array.isArray(value)
              ? String(value[0]?.name ?? "—")
              : String((value as { name: string }).name),
        },
        {
          align: "right",
          key: "amount",
          label: "Jumlah",
          render: (value) => formatIDR(String(value)),
        },
        {
          key: "status",
          label: "Status",
          render: (value) => <StatusBadge value={String(value)} />,
        },
      ]}
      description="Cash In, Cash Out, dan Bank Transfer dengan approval, jurnal, period lock, serta reversal."
      emptyAction={
        context.permissions.includes("cash.create") ? (
          <Link
            className="text-brand-600 text-sm font-semibold"
            href="/cash-bank/transactions/new"
          >
            Buat transaksi pertama
          </Link>
        ) : undefined
      }
      emptyDescription="Buat draft transaksi kas atau transfer antar rekening."
      emptyTitle="Belum ada transaksi kas"
      rows={rows}
      successMessage={
        params.deleted ? "Draft transaksi kas berhasil dihapus." : undefined
      }
      title="Transaksi Kas & Bank"
    />
  );
}

export async function CashFormPage({ id }: { id?: string }) {
  const context = await requireCompanyPermission("cash.create");
  const [options, record] = await Promise.all([
    getCashOptions(context.companyId),
    id ? getCashTransaction(context.companyId, id) : Promise.resolve(null),
  ]);
  if (record && !["draft", "rejected"].includes(record.status))
    redirect(`/cash-bank/transactions/${id}`);
  const option = (rows: { code: string; id: string; name: string }[]) =>
    rows.map((row) => ({ label: `${row.code} — ${row.name}`, value: row.id }));
  const fields: MutationField[] = [
    {
      defaultValue:
        record?.transaction_date ?? new Date().toISOString().slice(0, 10),
      label: "Tanggal transaksi",
      name: "transactionDate",
      required: true,
      type: "date",
    },
    {
      defaultValue: record?.transaction_type ?? "cash_in",
      label: "Tipe transaksi",
      name: "transactionType",
      required: true,
      type: "select",
      options: [
        { label: "Cash In", value: "cash_in" },
        { label: "Cash Out", value: "cash_out" },
        { label: "Bank Transfer", value: "bank_transfer" },
      ],
    },
    {
      defaultValue: record?.branch_id,
      label: "Cabang",
      name: "branchId",
      required: true,
      type: "select",
      options: option(options.branches),
    },
    {
      defaultValue: record?.bank_account_id,
      label: "Akun sumber / penerima",
      name: "bankAccountId",
      required: true,
      type: "select",
      options: option(options.banks),
    },
    {
      defaultValue: record?.destination_bank_account_id,
      label: "Akun tujuan (khusus transfer)",
      name: "destinationBankAccountId",
      type: "select",
      options: option(options.banks),
      description: "Wajib untuk Bank Transfer; diabaikan untuk Cash In/Out.",
    },
    {
      defaultValue: record?.offset_account_id,
      label: "Akun lawan (Cash In/Out)",
      name: "offsetAccountId",
      type: "select",
      options: option(options.accounts),
      description: "Wajib untuk Cash In/Out; diabaikan untuk transfer.",
    },
    {
      defaultValue: record?.amount ?? 0,
      label: "Jumlah",
      name: "amount",
      required: true,
      step: "0.01",
      type: "number",
    },
    { defaultValue: record?.reference, label: "Referensi", name: "reference" },
    {
      defaultValue: record?.description,
      label: "Keterangan",
      name: "description",
      required: true,
      type: "textarea",
    },
  ];
  return (
    <EntityPage
      description="Database menentukan akun debit/kredit berdasarkan tipe dan memvalidasi rekening yang aktif."
      title={`${id ? "Edit" : "Buat"} Transaksi Kas`}
    >
      <FormCard>
        <MutationForm
          action={saveCashTransactionAction}
          cancelHref={
            id ? `/cash-bank/transactions/${id}` : "/cash-bank/transactions"
          }
          fields={fields}
          hidden={{
            id: record?.id ?? "",
            version: record ? String(record.version) : "",
          }}
          submitLabel="Simpan draft"
        />
      </FormCard>
    </EntityPage>
  );
}

type ApprovalAction = {
  action: string;
  comment: string | null;
  created_at: string;
};
export async function CashDetailPage({
  id,
  searchParams,
}: {
  id: string;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const query = await searchParams;
  const context = await requireCompanyPermission("cash.read");
  const record = await getCashTransaction(context.companyId, id);
  const messages: Record<string, string> = {
    approved: "Transaksi berhasil disetujui.",
    posted: "Transaksi berhasil diposting.",
    rejected: "Transaksi ditolak.",
    reversed: "Transaksi berhasil direversal.",
    saved: "Draft transaksi berhasil disimpan.",
    submitted: "Transaksi diajukan untuk persetujuan.",
  };
  const key = Object.keys(messages).find((item) => query[item] === "1");
  const relation = (value: unknown) =>
    Array.isArray(value)
      ? (value[0] as { code: string; name: string } | undefined)
      : (value as { code: string; name: string } | null);
  const source = relation(record.source),
    destination = relation(record.destination),
    offset = relation(record.offset);
  return (
    <EntityPage
      description="Detail sumber dana, accounting impact, status approval, dan jurnal terkait."
      title={record.document_number}
    >
      {key ? (
        <p
          className="bg-success-50 text-success-700 mb-4 rounded-xl p-3 text-sm"
          role="status"
        >
          {messages[key]}
        </p>
      ) : null}
      <section className={detailCardClass}>
        <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
          <EntityDetails
            items={[
              { label: "Tanggal", value: record.transaction_date },
              { label: "Tipe", value: record.transaction_type },
              { label: "Status", value: <StatusBadge value={record.status} /> },
              { label: "Jumlah", value: formatIDR(String(record.amount)) },
              {
                label: "Akun sumber/penerima",
                value: source ? `${source.code} — ${source.name}` : "—",
              },
              {
                label: "Tujuan transfer",
                value: destination
                  ? `${destination.code} — ${destination.name}`
                  : "—",
              },
              {
                label: "Akun lawan",
                value: offset ? `${offset.code} — ${offset.name}` : "—",
              },
              { label: "Referensi", value: record.reference },
              { label: "Keterangan", value: record.description },
            ]}
          />
          <div className="flex flex-wrap justify-end gap-2">
            {["draft", "rejected"].includes(record.status) &&
            context.permissions.includes("cash.create") ? (
              <Link
                className="rounded-lg border border-gray-300 px-3 py-2 text-xs font-semibold"
                href={`/cash-bank/transactions/${id}/edit`}
              >
                Edit
              </Link>
            ) : null}
            {record.status === "draft" &&
            context.permissions.includes("cash.create") ? (
              <ConfirmActionForm
                action={deleteCashTransactionAction}
                confirmMessage="Hapus draft transaksi ini?"
                fields={{ id, version: String(record.version) }}
                label="Hapus draft"
                tone="danger"
              />
            ) : null}
            {["draft", "rejected"].includes(record.status) &&
            context.permissions.includes("cash.submit") ? (
              <ConfirmActionForm
                action={submitCashTransactionAction}
                confirmMessage="Ajukan transaksi ini untuk persetujuan?"
                fields={{ id }}
                label="Ajukan"
                tone="primary"
              />
            ) : null}
            {record.status === "approved" &&
            context.permissions.includes("cash.post") ? (
              <ConfirmActionForm
                action={postCashTransactionAction}
                confirmMessage="Posting transaksi akan membuat jurnal. Lanjutkan?"
                fields={{ id }}
                label="Posting"
                tone="primary"
              />
            ) : null}
          </div>
        </div>
        {record.journal ? (
          <p className="rounded-lg bg-gray-50 p-3 text-sm dark:bg-gray-800">
            Jurnal:{" "}
            <Link
              className="text-brand-600 font-semibold"
              href={`/accounting/journals/${record.journal.id}`}
            >
              {record.journal.journal_number}
            </Link>
          </p>
        ) : null}
        {record.reversalJournal ? (
          <p className="mt-2 rounded-lg bg-gray-50 p-3 text-sm dark:bg-gray-800">
            Jurnal reversal:{" "}
            <Link
              className="text-brand-600 font-semibold"
              href={`/accounting/journals/${record.reversalJournal.id}`}
            >
              {record.reversalJournal.journal_number}
            </Link>
          </p>
        ) : null}
      </section>
      {record.status === "pending_approval" &&
      context.permissions.includes("cash.approve") ? (
        <section className={`${detailCardClass} mt-4`}>
          <h2 className="mb-4 font-semibold">Keputusan Persetujuan</h2>
          <div className="grid gap-5 md:grid-cols-2">
            <WorkflowActionForm
              action={decideCashTransactionAction}
              confirmMessage="Setujui transaksi kas ini?"
              fields={{ action: "approve", id }}
              label="Setujui"
            />
            <WorkflowActionForm
              action={decideCashTransactionAction}
              confirmMessage="Tolak transaksi kas ini?"
              fields={{ action: "reject", id }}
              label="Tolak"
              requireComment
              tone="danger"
            />
          </div>
        </section>
      ) : null}
      {record.status === "posted" &&
      context.permissions.includes("cash.reverse") &&
      context.permissions.includes("journal.reverse") ? (
        <section className={`${detailCardClass} mt-4`}>
          <h2 className="mb-4 font-semibold">Reversal Transaksi</h2>
          <ReversalForm
            action={reverseCashTransactionAction}
            fields={{ id }}
            label="Reverse transaksi"
            today={new Date().toISOString().slice(0, 10)}
          />
        </section>
      ) : null}
      {record.approval?.approval_actions?.length ? (
        <section className={`${detailCardClass} mt-4`}>
          <h2 className="mb-3 font-semibold">Riwayat Persetujuan</h2>
          <ul className="space-y-2 text-sm">
            {record.approval.approval_actions.map((action: ApprovalAction) => (
              <li key={`${action.action}-${action.created_at}`}>
                <StatusBadge value={action.action} />{" "}
                <span className="ml-2">
                  {new Date(action.created_at).toLocaleString("id-ID")}
                  {action.comment ? ` — ${action.comment}` : ""}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      <Link
        className="text-brand-600 mt-4 inline-block text-sm font-semibold"
        href="/cash-bank/transactions"
      >
        ← Kembali ke daftar
      </Link>
    </EntityPage>
  );
}
