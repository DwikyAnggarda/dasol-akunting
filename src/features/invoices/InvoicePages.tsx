import Link from "next/link";
import { redirect } from "next/navigation";

import { DocumentFilters } from "@/components/common/DocumentFilters";
import { EntityDetails } from "@/components/common/EntityDetails";
import { EntityPage, FormCard } from "@/components/common/EntityPage";
import { ModulePage, StatusBadge } from "@/components/common/ModulePage";
import { Pagination } from "@/components/common/Pagination";
import { ConfirmActionForm } from "@/components/forms/ConfirmActionForm";
import { WorkflowActionForm } from "@/components/forms/WorkflowActionForm";
import { ReversalForm } from "@/components/forms/ReversalForm";
import { formatIDR } from "@/domain/money";
import { detailCardClass } from "@/features/master/page-ui";
import { requireCompanyPermission } from "@/server/auth/require-permission";
import {
  getInvoiceOptions,
  getInvoiceRecord,
  getInvoiceRecords,
  INVOICE_PAGE_SIZE,
  type InvoiceKind,
} from "@/server/queries/invoices";

import {
  approveInvoiceAction,
  deleteInvoiceDraftAction,
  postInvoiceAction,
  rejectInvoiceAction,
  reverseInvoiceAction,
  saveInvoiceAction,
  submitInvoiceAction,
} from "./actions";
import { InvoiceForm, type InvoiceLineInput } from "./InvoiceForm";

export type InvoiceSearchParams = {
  deleted?: string;
  page?: string;
  q?: string;
  status?: string;
};

const basePath = (kind: InvoiceKind) =>
  kind === "sales" ? "/sales/invoices" : "/purchases/invoices";
const title = (kind: InvoiceKind) =>
  kind === "sales" ? "Invoice Penjualan" : "Invoice Pembelian";

export async function InvoiceListPage({
  kind,
  searchParams,
}: {
  kind: InvoiceKind;
  searchParams: Promise<InvoiceSearchParams>;
}) {
  const params = await searchParams;
  const pageNumber = Math.max(1, Number(params.page ?? "1") || 1);
  const context = await requireCompanyPermission(`${kind}.read`);
  const records = await getInvoiceRecords(context.companyId, kind, {
    page: pageNumber,
    q: params.q?.trim(),
    status: params.status,
  });
  const rows = records.slice(0, INVOICE_PAGE_SIZE);
  const base = basePath(kind);
  return (
    <ModulePage
      actions={
        context.permissions.includes(`${kind}.create`) ? (
          <Link
            className="bg-brand-500 rounded-xl px-4 py-2.5 text-sm font-semibold text-white"
            href={`${base}/new`}
          >
            Buat invoice
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
              href={`${base}/${row.id}`}
            >
              {String(value)}
            </Link>
          ),
        },
        { key: "document_date", label: "Tanggal" },
        {
          key: "contacts",
          label: kind === "sales" ? "Pelanggan" : "Pemasok",
          render: (value) =>
            (value as { display_name?: string } | null)?.display_name ?? "—",
        },
        { key: "due_date", label: "Jatuh tempo" },
        {
          key: "status",
          label: "Status",
          render: (value) => <StatusBadge value={String(value)} />,
        },
        {
          align: "right",
          key: "total",
          label: "Total",
          render: (value) => formatIDR(String(value)),
        },
        {
          align: "right",
          key: "outstanding_balance",
          label: "Sisa",
          render: (value) => formatIDR(String(value)),
        },
      ]}
      description={
        kind === "sales"
          ? "Draft, persetujuan, posting jurnal, dan saldo piutang pelanggan."
          : "Draft, persetujuan, posting jurnal, dan saldo utang pemasok."
      }
      emptyDescription="Buat draft invoice pertama untuk memulai alur persetujuan."
      emptyTitle={`Belum ada ${title(kind).toLowerCase()}`}
      filters={<DocumentFilters q={params.q} status={params.status} />}
      rows={rows}
      successMessage={
        params.deleted === "1" ? "Draft invoice berhasil dihapus." : undefined
      }
      title={title(kind)}
      trailing={
        <Pagination
          hasNext={records.length > INVOICE_PAGE_SIZE}
          page={pageNumber}
          searchParams={params}
        />
      }
    />
  );
}

export async function InvoiceEditorPage({
  id,
  kind,
}: {
  id?: string;
  kind: InvoiceKind;
}) {
  const context = await requireCompanyPermission(
    `${kind}.${id ? "update" : "create"}`,
  );
  const base = basePath(kind);
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const dueDate = new Date(now.getTime() + 30 * 86400000)
    .toISOString()
    .slice(0, 10);
  const [options, record] = await Promise.all([
    getInvoiceOptions(context.companyId, kind),
    id ? getInvoiceRecord(context.companyId, kind, id) : Promise.resolve(null),
  ]);
  if (record && !["draft", "rejected"].includes(record.status))
    redirect(`${base}/${id}`);
  const initial = record
    ? {
        branchId: record.branch_id,
        contactId: kind === "sales" ? record.customer_id : record.supplier_id,
        currencyCode: kind === "sales" ? record.currency_code : "IDR",
        documentDate: record.document_date,
        dueDate: record.due_date,
        exchangeRate: kind === "sales" ? String(record.exchange_rate) : "1",
        id: record.id,
        lines: record.lines.map(
          (line: Record<string, unknown>): InvoiceLineInput => ({
            description: String(line.description),
            discountAmount: String(line.discount_amount),
            productId: String(line.product_id),
            quantity: String(line.quantity),
            taxRateVersionId: String(line.tax_rate_version_id ?? ""),
            unitPrice: String(
              kind === "sales" ? line.unit_price : line.unit_cost,
            ),
            warehouseId: String(line.warehouse_id ?? ""),
          }),
        ),
        notes: record.notes,
        postingDate: record.posting_date,
        supplierReference:
          kind === "purchase" ? record.supplier_reference : null,
        version: String(record.version),
      }
    : undefined;
  return (
    <EntityPage
      description="Nilai dan pajak dihitung ulang di database. Nomor final baru diberikan saat dokumen diajukan."
      title={`${id ? "Edit" : "Buat"} ${title(kind)}`}
    >
      <FormCard>
        <InvoiceForm
          action={saveInvoiceAction}
          branches={options.branches}
          cancelHref={id ? `${base}/${id}` : base}
          contacts={options.contacts}
          defaultDates={{ documentDate: today, dueDate, postingDate: today }}
          initial={initial}
          kind={kind}
          products={options.products}
          taxRates={options.taxRates}
          warehouses={options.warehouses}
        />
      </FormCard>
    </EntityPage>
  );
}

export async function InvoiceDetailPage({
  id,
  kind,
  searchParams,
}: {
  id: string;
  kind: InvoiceKind;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const query = await searchParams;
  const context = await requireCompanyPermission(`${kind}.read`);
  const record = await getInvoiceRecord(context.companyId, kind, id);
  const base = basePath(kind);
  const documentType = `${kind}_invoice`;
  const messages: Record<string, string> = {
    approved: "Invoice berhasil disetujui.",
    posted: "Invoice berhasil diposting ke buku besar.",
    rejected: "Invoice berhasil ditolak.",
    reversed: "Invoice berhasil direversal.",
    saved: "Draft invoice berhasil disimpan.",
    submitted: "Invoice berhasil diajukan untuk persetujuan.",
  };
  const messageKey = Object.keys(messages).find((key) => query[key] === "1");
  return (
    <EntityPage
      description="Dokumen sumber, baris transaksi, status workflow, dan jurnal terkait."
      title={`${record.document_number}`}
    >
      {messageKey ? (
        <p
          className="border-success-200 bg-success-50 text-success-700 mb-4 rounded-xl border px-4 py-3 text-sm"
          role="status"
        >
          {messages[messageKey]}
        </p>
      ) : null}
      <section className={detailCardClass}>
        <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
          <EntityDetails
            items={[
              {
                label: kind === "sales" ? "Pelanggan" : "Pemasok",
                value: record.contacts?.display_name,
              },
              { label: "Cabang", value: record.branches?.name },
              { label: "Tanggal dokumen", value: record.document_date },
              { label: "Tanggal posting", value: record.posting_date },
              { label: "Jatuh tempo", value: record.due_date },
              { label: "Status", value: <StatusBadge value={record.status} /> },
              { label: "Subtotal", value: formatIDR(String(record.subtotal)) },
              { label: "Pajak", value: formatIDR(String(record.tax_total)) },
              { label: "Total", value: formatIDR(String(record.total)) },
              {
                label: "Sisa",
                value: formatIDR(String(record.outstanding_balance)),
              },
            ]}
          />
          <div className="flex flex-wrap justify-end gap-2">
            {["draft", "rejected"].includes(record.status) &&
            context.permissions.includes(`${kind}.update`) ? (
              <Link
                className="rounded-lg border border-gray-300 px-3 py-2 text-xs font-semibold"
                href={`${base}/${id}/edit`}
              >
                Edit
              </Link>
            ) : null}
            {record.status === "draft" &&
            context.permissions.includes(`${kind}.update`) ? (
              <ConfirmActionForm
                action={deleteInvoiceDraftAction}
                confirmMessage="Hapus draft invoice ini? Tindakan ini tidak dapat dibatalkan."
                fields={{ id, kind, version: String(record.version) }}
                label="Hapus draft"
                tone="danger"
              />
            ) : null}
            {["draft", "rejected"].includes(record.status) &&
            context.permissions.includes(`${kind}.submit`) ? (
              <ConfirmActionForm
                action={submitInvoiceAction}
                confirmMessage="Ajukan invoice untuk persetujuan? Setelah diajukan draft tidak dapat diedit."
                fields={{ id, kind }}
                label="Ajukan"
                tone="primary"
              />
            ) : null}
            {record.status === "approved" &&
            context.permissions.includes(`${kind}.post`) ? (
              <ConfirmActionForm
                action={postInvoiceAction}
                confirmMessage="Posting invoice ke buku besar? Dokumen posted bersifat immutable."
                fields={{ id, kind }}
                label="Posting"
                tone="primary"
              />
            ) : null}
            {["posted", "partially_paid", "paid"].includes(record.status) &&
            context.permissions.includes(`${kind}.create`) ? (
              <Link
                className="rounded-lg border border-gray-300 px-3 py-2 text-xs font-semibold"
                href={`${kind === "sales" ? "/sales/returns" : "/purchases/returns"}/new?invoice=${id}`}
              >
                Buat retur
              </Link>
            ) : null}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b text-left text-xs text-gray-500 uppercase">
                <th className="py-3">#</th>
                <th>Produk</th>
                <th>Deskripsi</th>
                <th className="text-right">Qty</th>
                <th className="text-right">Harga</th>
                <th className="text-right">Diskon</th>
                <th>Pajak</th>
                <th className="text-right">Jumlah</th>
              </tr>
            </thead>
            <tbody>
              {record.lines.map((line: Record<string, unknown>) => {
                const quantity = Number(line.quantity);
                const price = Number(
                  kind === "sales" ? line.unit_price : line.unit_cost,
                );
                const discount = Number(line.discount_amount);
                const product = line.products as {
                  sku: string;
                  name: string;
                } | null;
                const rate = line.tax_rate_versions as {
                  rate: number;
                  tax_codes: { code: string } | null;
                } | null;
                return (
                  <tr
                    className="border-b border-gray-100 dark:border-gray-800"
                    key={String(line.id)}
                  >
                    <td className="py-3">{String(line.line_number)}</td>
                    <td>
                      {product ? `${product.sku} — ${product.name}` : "—"}
                    </td>
                    <td>{String(line.description)}</td>
                    <td className="text-right">{quantity}</td>
                    <td className="text-right">{formatIDR(String(price))}</td>
                    <td className="text-right">
                      {formatIDR(String(discount))}
                    </td>
                    <td>
                      {rate
                        ? `${rate.tax_codes?.code ?? "Pajak"} ${rate.rate}%`
                        : "—"}
                    </td>
                    <td className="text-right font-semibold">
                      {formatIDR(String(quantity * price - discount))}
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
      {record.status === "pending_approval" &&
      record.approval &&
      context.permissions.includes(`${kind}.approve`) ? (
        <section className={`${detailCardClass} mt-4`}>
          <h2 className="mb-4 font-semibold text-gray-900 dark:text-white">
            Keputusan Persetujuan
          </h2>
          <div className="grid gap-5 md:grid-cols-2">
            <WorkflowActionForm
              action={approveInvoiceAction}
              confirmMessage="Setujui invoice ini?"
              fields={{
                documentId: id,
                documentType,
                requestId: record.approval.id,
              }}
              label="Setujui"
            />
            <WorkflowActionForm
              action={rejectInvoiceAction}
              confirmMessage="Tolak invoice ini?"
              fields={{
                documentId: id,
                documentType,
                requestId: record.approval.id,
              }}
              label="Tolak"
              requireComment
              tone="danger"
            />
          </div>
        </section>
      ) : null}
      {record.status === "posted" &&
      Number(record.outstanding_balance) === Number(record.total) &&
      context.permissions.includes("journal.reverse") &&
      context.permissions.includes(`${kind}.post`) ? (
        <section className={`${detailCardClass} mt-4`}>
          <h2 className="mb-4 font-semibold text-gray-900 dark:text-white">
            Reversal Invoice
          </h2>
          <ReversalForm
            action={reverseInvoiceAction}
            fields={{ id, kind }}
            label="Reverse invoice"
            today={new Date().toISOString().slice(0, 10)}
          />
        </section>
      ) : null}
      {record.approval?.approval_actions?.length ? (
        <section className={`${detailCardClass} mt-4`}>
          <h2 className="mb-3 font-semibold text-gray-900 dark:text-white">
            Riwayat Persetujuan
          </h2>
          <ul className="space-y-2 text-sm">
            {record.approval.approval_actions.map(
              (action: {
                action: string;
                comment: string | null;
                created_at: string;
              }) => (
                <li key={`${action.action}-${action.created_at}`}>
                  <StatusBadge value={action.action} />{" "}
                  <span className="ml-2">
                    {new Date(action.created_at).toLocaleString("id-ID")}
                    {action.comment ? ` — ${action.comment}` : ""}
                  </span>
                </li>
              ),
            )}
          </ul>
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
