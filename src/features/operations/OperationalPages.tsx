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
  getOperationalDocument,
  getOperationalDocuments,
  getOperationalOptions,
} from "@/server/queries/operations";
import {
  convertOperationalAction,
  decideOperationalAction,
  deleteOperationalAction,
  postOperationalAction,
  reverseOperationalAction,
  saveOperationalAction,
  submitOperationalAction,
} from "./actions";
import { isFulfillment, isOrder, isPreorder, operationConfig } from "./config";
import { OperationalForm, type OperationalLineInput } from "./OperationalForm";
import type { OperationalKind } from "./schemas";
type LineRecord = {
  description: string;
  fulfilled_quantity: number | string;
  id: string;
  line_number: number;
  product_id: string;
  products: { name: string; sku: string } | null;
  quantity: number | string;
  source_line_id: string | null;
  total: number | string;
  unit_amount: number | string;
  warehouse_id: string;
  warehouses: { name: string } | null;
};
type ApprovalAction = {
  action: string;
  comment: string | null;
  created_at: string;
};
export async function OperationalListPage({
  kind,
  searchParams,
}: {
  kind: OperationalKind;
  searchParams: Promise<{ deleted?: string }>;
}) {
  const params = await searchParams,
    config = operationConfig[kind],
    context = await requireCompanyPermission(`${config.domain}.read`),
    rows = await getOperationalDocuments(context.companyId, kind);
  return (
    <ModulePage
      actions={
        context.permissions.includes(`${config.domain}.create`) ? (
          <Link
            className="bg-brand-500 rounded-xl px-4 py-2.5 text-sm font-semibold text-white"
            href={`${config.base}/new`}
          >
            Buat {config.title}
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
              href={`${config.base}/${row.id}`}
            >
              {String(value)}
            </Link>
          ),
        },
        { key: "document_date", label: "Tanggal" },
        {
          key: "contacts",
          label: config.contact,
          render: (value) =>
            Array.isArray(value)
              ? String(value[0]?.display_name ?? "—")
              : String((value as { display_name: string }).display_name),
        },
        {
          key: "branches",
          label: "Cabang",
          render: (value) =>
            Array.isArray(value)
              ? String(value[0]?.name ?? "—")
              : String((value as { name: string }).name),
        },
        {
          align: "right",
          key: "total",
          label: "Nilai",
          render: (value) => formatIDR(String(value)),
        },
        {
          key: "status",
          label: "Status",
          render: (value) => <StatusBadge value={String(value)} />,
        },
      ]}
      description={
        isOrder(kind) || isPreorder(kind)
          ? "Order dengan ordered, fulfilled, remaining quantity, approval, dan konversi terkendali."
          : "Dokumen fulfillment yang mengubah stok dan membentuk jurnal ketika diposting."
      }
      emptyAction={
        context.permissions.includes(`${config.domain}.create`) ? (
          <Link
            className="text-brand-600 text-sm font-semibold"
            href={`${config.base}/new`}
          >
            Buat dokumen pertama
          </Link>
        ) : undefined
      }
      emptyDescription={`Belum ada ${config.title}.`}
      emptyTitle="Belum ada dokumen"
      rows={rows}
      successMessage={params.deleted ? "Draft berhasil dihapus." : undefined}
      title={config.title}
    />
  );
}
export async function OperationalFormPage({
  id,
  kind,
}: {
  id?: string;
  kind: OperationalKind;
}) {
  const config = operationConfig[kind],
    context = await requireCompanyPermission(
      `${config.domain}.${id ? "update" : "create"}`,
    ),
    [options, record] = await Promise.all([
      getOperationalOptions(context.companyId, kind),
      id
        ? getOperationalDocument(context.companyId, kind, id)
        : Promise.resolve(null),
    ]);
  if (record && !["draft", "rejected"].includes(record.status))
    redirect(`${config.base}/${id}`);
  const initial = record
    ? {
        branchId: record.branch_id,
        contactId: record.contact_id,
        documentDate: record.document_date,
        id: record.id,
        lines: record.lines.map((line: LineRecord): OperationalLineInput => ({
          description: line.description,
          productId: line.product_id,
          quantity: String(line.quantity),
          sourceLineId: line.source_line_id ?? "",
          unitAmount: String(line.unit_amount),
          warehouseId: line.warehouse_id,
        })),
        notes: record.notes ?? "",
        version: String(record.version),
      }
    : undefined;
  return (
    <EntityPage
      description="Total dihitung ulang di database; kuantitas hasil konversi tidak boleh melebihi remaining order."
      title={`${id ? "Edit" : "Buat"} ${config.title}`}
    >
      <FormCard>
        <OperationalForm
          action={saveOperationalAction}
          branches={options.branches.map((row) => ({
            label: `${row.code} — ${row.name}`,
            value: row.id,
          }))}
          contacts={options.contacts.map((row) => ({
            label: `${row.code} — ${row.display_name}`,
            value: row.id,
          }))}
          initial={initial}
          kind={kind}
          products={options.products.map((row) => ({
            label: `${row.sku} — ${row.name}`,
            price: String(
              config.domain === "sales" ? row.sales_price : row.purchase_price,
            ),
            value: row.id,
          }))}
          today={new Date().toISOString().slice(0, 10)}
          warehouses={options.warehouses.map((row) => ({
            branchId: row.branch_id,
            label: `${row.code} — ${row.name}`,
            value: row.id,
          }))}
        />
      </FormCard>
    </EntityPage>
  );
}
export async function OperationalDetailPage({
  id,
  kind,
  searchParams,
}: {
  id: string;
  kind: OperationalKind;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const query = await searchParams,
    config = operationConfig[kind],
    context = await requireCompanyPermission(`${config.domain}.read`),
    record = await getOperationalDocument(context.companyId, kind, id);
  const messages: Record<string, string> = {
      approved: "Dokumen disetujui.",
      converted: "Order berhasil dikonversi menjadi draft fulfillment.",
      posted: "Fulfillment berhasil diposting.",
      rejected: "Dokumen ditolak.",
      reversed: "Fulfillment berhasil direversal.",
      saved: "Draft berhasil disimpan.",
      submitted: "Dokumen diajukan untuk persetujuan.",
    },
    key = Object.keys(messages).find((item) => query[item] === "1");
  const relation = (value: unknown) =>
    Array.isArray(value) ? value[0] : value;
  const contact = relation(record.contacts) as
      { display_name: string } | undefined,
    branch = relation(record.branches) as { name: string } | undefined,
    source = relation(record.source) as { document_number: string } | undefined;
  return (
    <EntityPage
      description="Status, remaining quantity, accounting impact, approval, dan sumber konversi."
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
              { label: config.contact, value: contact?.display_name },
              { label: "Cabang", value: branch?.name },
              { label: "Tanggal", value: record.document_date },
              { label: "Status", value: <StatusBadge value={record.status} /> },
              { label: "Total", value: formatIDR(String(record.total)) },
              { label: "Sumber", value: source?.document_number },
              { label: "Catatan", value: record.notes },
            ]}
          />
          <div className="flex flex-wrap justify-end gap-2">
            {["draft", "rejected"].includes(record.status) &&
            context.permissions.includes(`${config.domain}.update`) ? (
              <Link
                className="rounded-lg border border-gray-300 px-3 py-2 text-xs font-semibold"
                href={`${config.base}/${id}/edit`}
              >
                Edit
              </Link>
            ) : null}
            {record.status === "draft" &&
            context.permissions.includes(`${config.domain}.update`) ? (
              <ConfirmActionForm
                action={deleteOperationalAction}
                confirmMessage="Hapus draft ini?"
                fields={{ id, kind, version: String(record.version) }}
                label="Hapus draft"
                tone="danger"
              />
            ) : null}
            {["draft", "rejected"].includes(record.status) &&
            context.permissions.includes(`${config.domain}.submit`) ? (
              <ConfirmActionForm
                action={submitOperationalAction}
                confirmMessage="Ajukan dokumen untuk persetujuan?"
                fields={{ id, kind }}
                label="Ajukan"
                tone="primary"
              />
            ) : null}
            {record.status === "approved" &&
            (isOrder(kind) || isPreorder(kind)) &&
            context.permissions.includes(`${config.domain}.create`) ? (
              <ConfirmActionForm
                action={convertOperationalAction}
                confirmMessage={`Konversi dokumen ini menjadi ${kind === "sales_quotation" ? "sales order" : kind === "sales_order" ? "delivery" : kind === "purchase_request" ? "purchase order" : "goods receipt"}?`}
                fields={{ id, kind }}
                label={
                  kind === "sales_quotation"
                    ? "Buat Sales Order"
                    : kind === "sales_order"
                      ? "Buat Delivery"
                      : kind === "purchase_request"
                        ? "Buat Purchase Order"
                        : "Buat Goods Receipt"
                }
                tone="primary"
              />
            ) : null}
            {record.status === "approved" &&
            isFulfillment(kind) &&
            context.permissions.includes(`${config.domain}.post`) ? (
              <ConfirmActionForm
                action={postOperationalAction}
                confirmMessage="Posting akan mengubah stok dan membuat jurnal. Lanjutkan?"
                fields={{ id, kind }}
                label="Posting"
                tone="primary"
              />
            ) : null}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-sm">
            <thead>
              <tr className="border-b text-left text-xs text-gray-500 uppercase">
                <th className="py-3">#</th>
                <th>Produk</th>
                <th>Gudang</th>
                <th className="text-right">Ordered</th>
                {isOrder(kind) ? (
                  <>
                    <th className="text-right">Fulfilled</th>
                    <th className="text-right">Remaining</th>
                  </>
                ) : null}
                <th className="text-right">Harga/Biaya</th>
                <th className="text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {record.lines.map((line: LineRecord) => {
                const product = relation(line.products) as
                    { name: string; sku: string } | undefined,
                  warehouse = relation(line.warehouses) as
                    { name: string } | undefined,
                  remaining =
                    Number(line.quantity) - Number(line.fulfilled_quantity);
                return (
                  <tr
                    className="border-b border-gray-100 dark:border-gray-800"
                    key={line.id}
                  >
                    <td className="py-3">{line.line_number}</td>
                    <td>
                      {product ? `${product.sku} — ${product.name}` : "—"}
                    </td>
                    <td>{warehouse?.name}</td>
                    <td className="text-right">
                      {formatDecimal(String(line.quantity), {
                        maximumScale: 6,
                      })}
                    </td>
                    {isOrder(kind) ? (
                      <>
                        <td className="text-right">
                          {formatDecimal(String(line.fulfilled_quantity), {
                            maximumScale: 6,
                          })}
                        </td>
                        <td className="text-right font-semibold">
                          {formatDecimal(String(remaining), {
                            maximumScale: 6,
                          })}
                        </td>
                      </>
                    ) : null}
                    <td className="text-right">
                      {formatIDR(String(line.unit_amount))}
                    </td>
                    <td className="text-right">
                      {formatIDR(String(line.total))}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {record.journal ? (
          <p className="mt-4 rounded-lg bg-gray-50 p-3 text-sm dark:bg-gray-800">
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
      context.permissions.includes(`${config.domain}.approve`) ? (
        <section className={`${detailCardClass} mt-4`}>
          <h2 className="mb-4 font-semibold">Keputusan Persetujuan</h2>
          <div className="grid gap-5 md:grid-cols-2">
            <WorkflowActionForm
              action={decideOperationalAction}
              confirmMessage="Setujui dokumen ini?"
              fields={{ action: "approve", id, kind }}
              label="Setujui"
            />
            <WorkflowActionForm
              action={decideOperationalAction}
              confirmMessage="Tolak dokumen ini?"
              fields={{ action: "reject", id, kind }}
              label="Tolak"
              requireComment
              tone="danger"
            />
          </div>
        </section>
      ) : null}
      {record.status === "posted" &&
      isFulfillment(kind) &&
      context.permissions.includes(`${config.domain}.post`) &&
      context.permissions.includes("journal.reverse") ? (
        <section className={`${detailCardClass} mt-4`}>
          <h2 className="mb-4 font-semibold">Reversal Fulfillment</h2>
          <p className="mb-3 text-sm text-gray-500">
            Reversal diblokir jika ada movement stok berikutnya.
          </p>
          <ReversalForm
            action={reverseOperationalAction}
            fields={{ id, kind }}
            label="Reverse fulfillment"
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
        href={config.base}
      >
        ← Kembali ke daftar
      </Link>
    </EntityPage>
  );
}
