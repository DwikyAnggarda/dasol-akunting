import Link from "next/link";
import { redirect } from "next/navigation";

import { DocumentFilters } from "@/components/common/DocumentFilters";
import { EntityDetails } from "@/components/common/EntityDetails";
import { EntityPage, FormCard } from "@/components/common/EntityPage";
import { ModulePage, StatusBadge } from "@/components/common/ModulePage";
import { Pagination } from "@/components/common/Pagination";
import { ConfirmActionForm } from "@/components/forms/ConfirmActionForm";
import { ReversalForm } from "@/components/forms/ReversalForm";
import { formatIDR } from "@/domain/money";
import { detailCardClass } from "@/features/master/page-ui";
import { requireCompanyPermission } from "@/server/auth/require-permission";
import {
  getSettlementOptions,
  getSettlementRecord,
  getSettlementRecords,
  SETTLEMENT_PAGE_SIZE,
  type SettlementKind,
} from "@/server/queries/settlements";

import {
  deleteSettlementAction,
  postSettlementAction,
  reverseSettlementAction,
  saveSettlementAction,
} from "./actions";
import { SettlementForm } from "./SettlementForm";

export type SettlementSearchParams = {
  deleted?: string;
  page?: string;
  q?: string;
  status?: string;
};
const scope = (kind: SettlementKind) =>
  kind === "customer" ? "sales" : "purchase";
const basePath = (kind: SettlementKind) =>
  kind === "customer" ? "/sales/receipts" : "/purchases/payments";
const title = (kind: SettlementKind) =>
  kind === "customer" ? "Penerimaan Pelanggan" : "Pembayaran Pemasok";

export async function SettlementListPage({
  kind,
  searchParams,
}: {
  kind: SettlementKind;
  searchParams: Promise<SettlementSearchParams>;
}) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page ?? "1") || 1);
  const context = await requireCompanyPermission(`${scope(kind)}.read`);
  const records = await getSettlementRecords(context.companyId, kind, {
    page,
    q: params.q?.trim(),
    status: params.status,
  });
  const rows = records.slice(0, SETTLEMENT_PAGE_SIZE).map((record) => {
    const contact = Array.isArray(record.contacts)
      ? record.contacts[0]
      : record.contacts;
    return {
      amount: record.amount,
      contact: contact?.display_name ?? "—",
      date:
        kind === "customer"
          ? "receipt_date" in record
            ? record.receipt_date
            : ""
          : "payment_date" in record
            ? record.payment_date
            : "",
      documentNumber: record.document_number,
      id: record.id,
      status: record.status,
    };
  });
  const base = basePath(kind);
  return (
    <ModulePage
      actions={
        context.permissions.includes(`${scope(kind)}.create`) ? (
          <Link
            className="bg-brand-500 rounded-xl px-4 py-2.5 text-sm font-semibold text-white"
            href={`${base}/new`}
          >
            Buat {kind === "customer" ? "penerimaan" : "pembayaran"}
          </Link>
        ) : undefined
      }
      columns={[
        {
          key: "documentNumber",
          label: "Nomor",
          render: (value, row) => (
            <Link
              className="text-brand-600 font-semibold"
              href={`${base}/${row.id}`}
            >
              {String(value)}
            </Link>
          ),
        },
        { key: "date", label: "Tanggal" },
        {
          key: "contact",
          label: kind === "customer" ? "Pelanggan" : "Pemasok",
        },
        {
          key: "status",
          label: "Status",
          render: (value) => <StatusBadge value={String(value)} />,
        },
        {
          align: "right",
          key: "amount",
          label: "Jumlah",
          render: (value) => formatIDR(String(value)),
        },
      ]}
      description={
        kind === "customer"
          ? "Alokasi kas masuk ke piutang terbuka dan posting jurnal penerimaan."
          : "Alokasi kas keluar ke utang terbuka dan posting jurnal pembayaran."
      }
      emptyDescription="Belum ada dokumen pembayaran."
      emptyTitle={`Belum ada ${title(kind).toLowerCase()}`}
      filters={<DocumentFilters q={params.q} status={params.status} />}
      rows={rows}
      successMessage={
        params.deleted === "1"
          ? "Draft pembayaran berhasil dihapus."
          : undefined
      }
      title={title(kind)}
      trailing={
        <Pagination
          hasNext={records.length > SETTLEMENT_PAGE_SIZE}
          page={page}
          searchParams={params}
        />
      }
    />
  );
}

export async function SettlementEditorPage({
  id,
  kind,
}: {
  id?: string;
  kind: SettlementKind;
}) {
  const context = await requireCompanyPermission(`${scope(kind)}.create`);
  const base = basePath(kind);
  const [options, record] = await Promise.all([
    getSettlementOptions(context.companyId, kind),
    id
      ? getSettlementRecord(context.companyId, kind, id)
      : Promise.resolve(null),
  ]);
  if (record && record.status !== "draft") redirect(`${base}/${id}`);
  const initial = record
    ? {
        allocations: record.allocations.map(
          (allocation: Record<string, unknown>) => ({
            amount: String(allocation.allocated_amount),
            itemId: String(
              kind === "customer"
                ? allocation.receivable_id
                : allocation.payable_id,
            ),
          }),
        ),
        bankAccountId: record.bank_account_id,
        branchId: record.branch_id,
        contactId:
          kind === "customer" ? record.customer_id : record.supplier_id,
        id: record.id,
        notes: record.notes,
        settlementDate:
          kind === "customer" ? record.receipt_date : record.payment_date,
        version: String(record.version),
      }
    : undefined;
  return (
    <EntityPage
      description="Jumlah dokumen diturunkan dari alokasi yang dipilih dan divalidasi terhadap saldo terbaru di database."
      title={`${id ? "Edit" : "Buat"} ${title(kind)}`}
    >
      <FormCard>
        <SettlementForm
          action={saveSettlementAction}
          banks={options.banks}
          branches={options.branches}
          cancelHref={id ? `${base}/${id}` : base}
          contacts={options.contacts}
          defaultDate={new Date().toISOString().slice(0, 10)}
          initial={initial}
          items={options.items}
          kind={kind}
        />
      </FormCard>
    </EntityPage>
  );
}

export async function SettlementDetailPage({
  id,
  kind,
  searchParams,
}: {
  id: string;
  kind: SettlementKind;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const query = await searchParams;
  const context = await requireCompanyPermission(`${scope(kind)}.read`);
  const record = await getSettlementRecord(context.companyId, kind, id);
  const base = basePath(kind);
  const message =
    query.saved === "1"
      ? "Draft pembayaran berhasil disimpan."
      : query.posted === "1"
        ? "Pembayaran berhasil diposting."
        : query.reversed === "1"
          ? "Pembayaran berhasil direversal."
          : undefined;
  const date = kind === "customer" ? record.receipt_date : record.payment_date;
  return (
    <EntityPage
      description="Detail pembayaran, alokasi subledger, dan jurnal terkait."
      title={record.document_number}
    >
      {message ? (
        <p
          className="border-success-200 bg-success-50 text-success-700 mb-4 rounded-xl border px-4 py-3 text-sm"
          role="status"
        >
          {message}
        </p>
      ) : null}
      <section className={detailCardClass}>
        <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
          <EntityDetails
            items={[
              {
                label: kind === "customer" ? "Pelanggan" : "Pemasok",
                value: record.contacts?.display_name,
              },
              { label: "Cabang", value: record.branches?.name },
              { label: "Bank/Kas", value: record.bank_accounts?.name },
              { label: "Tanggal", value: date },
              { label: "Jumlah", value: formatIDR(String(record.amount)) },
              { label: "Status", value: <StatusBadge value={record.status} /> },
            ]}
          />
          <div className="flex gap-2">
            {record.status === "draft" &&
            context.permissions.includes(`${scope(kind)}.create`) ? (
              <>
                <Link
                  className="rounded-lg border border-gray-300 px-3 py-2 text-xs font-semibold"
                  href={`${base}/${id}/edit`}
                >
                  Edit
                </Link>
                <ConfirmActionForm
                  action={deleteSettlementAction}
                  confirmMessage="Hapus draft pembayaran ini?"
                  fields={{ id, kind, version: String(record.version) }}
                  label="Hapus draft"
                  tone="danger"
                />
              </>
            ) : null}
            {record.status === "draft" &&
            context.permissions.includes(`${scope(kind)}.post`) ? (
              <ConfirmActionForm
                action={postSettlementAction}
                confirmMessage="Posting pembayaran dan alokasi ini?"
                fields={{ id, kind }}
                label="Posting"
                tone="primary"
              />
            ) : null}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs text-gray-500 uppercase">
                <th className="py-3">Dokumen</th>
                <th>Jatuh tempo</th>
                <th className="text-right">Alokasi</th>
              </tr>
            </thead>
            <tbody>
              {record.allocations.map((allocation: Record<string, unknown>) => {
                const item = (
                  kind === "customer"
                    ? allocation.accounts_receivable
                    : allocation.accounts_payable
                ) as { document_number: string; due_date: string } | null;
                return (
                  <tr
                    className="border-b border-gray-100 dark:border-gray-800"
                    key={String(allocation.id)}
                  >
                    <td className="py-3">{item?.document_number ?? "—"}</td>
                    <td>{item?.due_date ?? "—"}</td>
                    <td className="text-right font-semibold">
                      {formatIDR(String(allocation.allocated_amount))}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {record.notes ? (
          <p className="mt-4 text-sm text-gray-500">Catatan: {record.notes}</p>
        ) : null}
        {record.journal ? (
          <p className="mt-4 rounded-lg bg-gray-50 px-3 py-2 text-sm dark:bg-gray-800">
            Jurnal: <strong>{record.journal.journal_number}</strong> ·{" "}
            {record.journal.status}
          </p>
        ) : null}
      </section>
      {record.status === "posted" &&
      context.permissions.includes("journal.reverse") ? (
        <section className={`${detailCardClass} mt-4`}>
          <h2 className="mb-4 font-semibold text-gray-900 dark:text-white">
            Reversal
          </h2>
          <ReversalForm
            action={reverseSettlementAction}
            fields={{ id, kind }}
            today={new Date().toISOString().slice(0, 10)}
          />
        </section>
      ) : null}
      <Link
        className="text-brand-600 mt-4 inline-block text-sm font-semibold"
        href={base}
      >
        ← Kembali ke daftar
      </Link>
    </EntityPage>
  );
}
