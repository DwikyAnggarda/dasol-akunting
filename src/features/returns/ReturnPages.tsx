import Link from "next/link";
import { redirect } from "next/navigation";
import { EntityDetails } from "@/components/common/EntityDetails";
import { EntityPage, FormCard } from "@/components/common/EntityPage";
import { ModulePage, StatusBadge } from "@/components/common/ModulePage";
import { ConfirmActionForm } from "@/components/forms/ConfirmActionForm";
import { ReversalForm } from "@/components/forms/ReversalForm";
import { WorkflowActionForm } from "@/components/forms/WorkflowActionForm";
import { formatDecimal, formatIDR } from "@/domain/money";
import { detailCardClass } from "@/features/master/page-ui";
import { requireCompanyPermission } from "@/server/auth/require-permission";
import {
  getReturnDocument,
  getReturnDocuments,
  getReturnOptions,
} from "@/server/queries/returns";
import {
  decideReturnAction,
  deleteReturnAction,
  postReturnAction,
  reverseReturnAction,
  saveReturnAction,
  submitReturnAction,
} from "./actions";
import { ReturnForm } from "./ReturnForm";
import type { ReturnKind } from "./schemas";
const cfg = (kind: ReturnKind) =>
  kind === "sales_return"
    ? {
        base: "/sales/returns",
        domain: "sales",
        title: "Sales Return / Credit Note",
      }
    : {
        base: "/purchases/returns",
        domain: "purchase",
        title: "Purchase Return / Debit Note",
      };
type RawLine = {
  id: string;
  description: string;
  product_id: string;
  quantity: number | string;
  warehouse_id: string | null;
  [key: string]: unknown;
};
type DetailLine = RawLine & {
  line_number: number;
  net_amount: number | string;
  tax_amount: number | string;
  total: number | string;
  products: { name: string; sku: string; product_type: string } | null;
  warehouses: { name: string } | null;
};
export async function ReturnListPage({
  kind,
  searchParams,
}: {
  kind: ReturnKind;
  searchParams: Promise<{ deleted?: string }>;
}) {
  const params = await searchParams,
    meta = cfg(kind),
    context = await requireCompanyPermission(`${meta.domain}.read`),
    rows = await getReturnDocuments(context.companyId, kind);
  return (
    <ModulePage
      actions={
        context.permissions.includes(`${meta.domain}.create`) ? (
          <Link
            className="bg-brand-500 rounded-xl px-4 py-2.5 text-sm font-semibold text-white"
            href={`${meta.base}/new`}
          >
            Buat retur
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
              href={`${meta.base}/${row.id}`}
            >
              {String(value)}
            </Link>
          ),
        },
        { key: "return_date", label: "Tanggal" },
        {
          key: "contacts",
          label: kind === "sales_return" ? "Pelanggan" : "Pemasok",
          render: (value) => {
            const contact = Array.isArray(value)
              ? value[0]
              : (value as { display_name: string });
            return contact?.display_name ?? "—";
          },
        },
        {
          key: "total",
          label: "Total",
          align: "right",
          render: (value) => formatIDR(String(value)),
        },
        {
          key: "status",
          label: "Status",
          render: (value) => <StatusBadge value={String(value)} />,
        },
      ]}
      description="Retur dari invoice posted dengan batas kuantitas, approval, jurnal, saldo kontak, inventory movement, dan reversal."
      emptyAction={
        <Link
          className="text-brand-600 text-sm font-semibold"
          href={`${meta.base}/new`}
        >
          Buat retur pertama
        </Link>
      }
      emptyDescription="Belum ada retur."
      emptyTitle="Belum ada retur"
      rows={rows}
      successMessage={params.deleted ? "Draft retur dihapus." : undefined}
      title={meta.title}
    />
  );
}
export async function ReturnFormPage({
  id,
  kind,
  sourceInvoiceId,
}: {
  id?: string;
  kind: ReturnKind;
  sourceInvoiceId?: string;
}) {
  const meta = cfg(kind),
    context = await requireCompanyPermission(
      `${meta.domain}.${id ? "update" : "create"}`,
    ),
    [options, record] = await Promise.all([
      getReturnOptions(context.companyId, kind),
      id
        ? getReturnDocument(context.companyId, kind, id)
        : Promise.resolve(null),
    ]);
  if (record && !["draft", "rejected"].includes(record.status))
    redirect(`${meta.base}/${id}`);
  const rawInvoices = options.invoices as unknown as Array<
      Record<string, unknown>
    >,
    invoices = rawInvoices.map((invoice) => {
      const rawLines = (
          kind === "sales_return"
            ? invoice.sales_invoice_lines
            : invoice.purchase_invoice_lines
        ) as RawLine[],
        contact = Array.isArray(invoice.contacts)
          ? invoice.contacts[0]
          : (invoice.contacts as { display_name: string });
      return {
        id: String(invoice.id),
        label: `${invoice.document_number} — ${contact?.display_name ?? ""}`,
        contact: contact?.display_name ?? "",
        lines: (rawLines ?? []).map((line) => {
          const product = Array.isArray(line.products)
            ? line.products[0]
            : (line.products as {
                name: string;
                sku: string;
                product_type: string;
              });
          return {
            id: line.id,
            description: line.description,
            product: `${product.sku} — ${product.name}`,
            productType: product.product_type,
            quantity: String(line.quantity),
            warehouseId: line.warehouse_id ?? "",
          };
        }),
      };
    });
  const initial = record
    ? {
        id: record.id,
        lines: (record.lines as unknown as DetailLine[]).map((line) => ({
          quantity: String(line.quantity),
          sourceLineId: line.source_line_id as string,
          warehouseId: line.warehouse_id ?? "",
        })),
        reason: record.reason,
        returnDate: record.return_date,
        sourceInvoiceId: record.source_invoice_id,
        version: String(record.version),
      }
    : undefined;
  if (
    !id &&
    sourceInvoiceId &&
    !invoices.some((invoice) => invoice.id === sourceInvoiceId)
  )
    redirect(meta.base);
  return (
    <EntityPage
      description="Nilai dan pajak dihitung proporsional dari invoice sumber di database."
      title={`${id ? "Edit" : "Buat"} ${meta.title}`}
    >
      <FormCard>
        <ReturnForm
          action={saveReturnAction}
          initial={
            initial ??
            (sourceInvoiceId
              ? {
                  id: "",
                  lines: [],
                  reason: "",
                  returnDate: new Date().toISOString().slice(0, 10),
                  sourceInvoiceId,
                  version: "",
                }
              : undefined)
          }
          invoices={invoices}
          kind={kind}
          today={new Date().toISOString().slice(0, 10)}
          warehouses={options.warehouses.map((row) => ({
            label: `${row.code} — ${row.name}`,
            value: row.id,
          }))}
        />
      </FormCard>
    </EntityPage>
  );
}
export async function ReturnDetailPage({
  id,
  kind,
  searchParams,
}: {
  id: string;
  kind: ReturnKind;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const query = await searchParams,
    meta = cfg(kind),
    context = await requireCompanyPermission(`${meta.domain}.read`),
    record = await getReturnDocument(context.companyId, kind, id),
    messages: Record<string, string> = {
      approved: "Retur disetujui.",
      posted: "Retur diposting.",
      rejected: "Retur ditolak.",
      reversed: "Retur direversal.",
      saved: "Draft retur disimpan.",
      submitted: "Retur diajukan.",
    },
    message = Object.keys(messages).find((key) => query[key] === "1"),
    contact = Array.isArray(record.contacts)
      ? record.contacts[0]
      : record.contacts,
    branch = Array.isArray(record.branches)
      ? record.branches[0]
      : record.branches;
  return (
    <EntityPage
      description="Jurnal, stok, kredit kontak, dan approval berasal dari transaksi database atomik."
      title={record.document_number}
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
                label: kind === "sales_return" ? "Pelanggan" : "Pemasok",
                value: contact?.display_name,
              },
              { label: "Cabang", value: branch?.name },
              { label: "Tanggal", value: record.return_date },
              { label: "Status", value: <StatusBadge value={record.status} /> },
              { label: "Subtotal", value: formatIDR(String(record.subtotal)) },
              { label: "Pajak", value: formatIDR(String(record.tax_total)) },
              { label: "Total", value: formatIDR(String(record.total)) },
              { label: "Alasan", value: record.reason },
            ]}
          />
          <div className="flex flex-wrap gap-2">
            {["draft", "rejected"].includes(record.status) &&
            context.permissions.includes(`${meta.domain}.update`) ? (
              <Link
                className="rounded-lg border px-3 py-2 text-xs font-semibold"
                href={`${meta.base}/${id}/edit`}
              >
                Edit
              </Link>
            ) : null}
            {record.status === "draft" ? (
              <ConfirmActionForm
                action={deleteReturnAction}
                confirmMessage="Hapus draft retur?"
                fields={{ id, kind, version: String(record.version) }}
                label="Hapus draft"
                tone="danger"
              />
            ) : null}
            {["draft", "rejected"].includes(record.status) ? (
              <ConfirmActionForm
                action={submitReturnAction}
                confirmMessage="Ajukan retur untuk persetujuan?"
                fields={{ id, kind }}
                label="Ajukan"
                tone="primary"
              />
            ) : null}
            {record.status === "approved" &&
            context.permissions.includes(`${meta.domain}.post`) ? (
              <ConfirmActionForm
                action={postReturnAction}
                confirmMessage="Posting retur akan mengubah jurnal, saldo, dan stok. Lanjutkan?"
                fields={{ id, kind }}
                label="Posting"
                tone="primary"
              />
            ) : null}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="py-2">#</th>
                <th>Produk</th>
                <th>Gudang</th>
                <th className="text-right">Qty</th>
                <th className="text-right">Net</th>
                <th className="text-right">Pajak</th>
                <th className="text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {(record.lines as unknown as DetailLine[]).map((line) => (
                <tr className="border-b" key={line.id}>
                  <td className="py-2">{line.line_number}</td>
                  <td>
                    {line.products
                      ? `${line.products.sku} — ${line.products.name}`
                      : "—"}
                  </td>
                  <td>{line.warehouses?.name ?? "N/A"}</td>
                  <td className="text-right">
                    {formatDecimal(String(line.quantity), { maximumScale: 6 })}
                  </td>
                  <td className="text-right">
                    {formatIDR(String(line.net_amount))}
                  </td>
                  <td className="text-right">
                    {formatIDR(String(line.tax_amount))}
                  </td>
                  <td className="text-right">
                    {formatIDR(String(line.total))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {record.journal ? (
          <p className="mt-4 text-sm">
            Jurnal:{" "}
            <Link
              className="text-brand-600 font-semibold"
              href={`/accounting/journals/${record.journal.id}`}
            >
              {record.journal.journal_number}
            </Link>
          </p>
        ) : null}
      </section>
      {record.status === "pending_approval" &&
      context.permissions.includes(`${meta.domain}.approve`) ? (
        <section className={`${detailCardClass} mt-4`}>
          <h2 className="mb-4 font-semibold">Keputusan Persetujuan</h2>
          <div className="grid gap-5 md:grid-cols-2">
            <WorkflowActionForm
              action={decideReturnAction}
              confirmMessage="Setujui retur?"
              fields={{ action: "approve", id, kind }}
              label="Setujui"
            />
            <WorkflowActionForm
              action={decideReturnAction}
              confirmMessage="Tolak retur?"
              fields={{ action: "reject", id, kind }}
              label="Tolak"
              requireComment
              tone="danger"
            />
          </div>
        </section>
      ) : null}
      {record.status === "posted" &&
      context.permissions.includes("journal.reverse") ? (
        <section className={`${detailCardClass} mt-4`}>
          <h2 className="mb-4 font-semibold">Reversal Retur</h2>
          <ReversalForm
            action={reverseReturnAction}
            fields={{ id, kind }}
            label="Reverse retur"
            today={new Date().toISOString().slice(0, 10)}
          />
        </section>
      ) : null}
      <Link
        className="text-brand-600 mt-4 inline-block text-sm font-semibold"
        href={meta.base}
      >
        ← Kembali
      </Link>
    </EntityPage>
  );
}
