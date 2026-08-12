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
  getInventoryOperation,
  getInventoryOperations,
  getInventoryOptions,
} from "@/server/queries/inventory";
import {
  decideInventoryOperationAction,
  deleteInventoryOperationAction,
  postInventoryOperationAction,
  reverseInventoryOperationAction,
  saveInventoryOperationAction,
  submitInventoryOperationAction,
} from "./operation-actions";
import type { InventoryOperationType } from "./schemas";
import {
  StockOperationForm,
  type StockOperationLine,
} from "./StockOperationForm";

const config = {
  inventory_transfer: { base: "/inventory/transfers", title: "Stock Transfer" },
  stock_count: { base: "/inventory/opname", title: "Stock Opname" },
} as const;
type Line = {
  counted_quantity: number | string | null;
  expected_quantity: number | string | null;
  id: string;
  line_number: number;
  product_id: string;
  products:
    { name: string; sku: string } | { name: string; sku: string }[] | null;
  quantity: number | string | null;
  total_cost: number | string;
  unit_cost: number | string;
};
const relation = <T,>(value: T | T[] | null): T | undefined =>
  Array.isArray(value) ? value[0] : (value ?? undefined);

export async function StockOperationListPage({
  operationType,
  searchParams,
}: {
  operationType: InventoryOperationType;
  searchParams: Promise<{ deleted?: string }>;
}) {
  const params = await searchParams,
    context = await requireCompanyPermission("inventory.read"),
    rows = await getInventoryOperations(context.companyId, operationType),
    meta = config[operationType];
  return (
    <ModulePage
      actions={
        context.permissions.includes("inventory.write") ? (
          <Link
            className="bg-brand-500 rounded-xl px-4 py-2.5 text-sm font-semibold text-white"
            href={`${meta.base}/new`}
          >
            Buat {meta.title}
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
        { key: "operation_date", label: "Tanggal" },
        {
          key: "source",
          label: operationType === "inventory_transfer" ? "Sumber" : "Gudang",
        },
        {
          key: "destination",
          label:
            operationType === "inventory_transfer" ? "Tujuan" : "Tujuan (N/A)",
        },
        {
          key: "status",
          label: "Status",
          render: (value: unknown) => <StatusBadge value={String(value)} />,
        },
      ]}
      description={
        operationType === "inventory_transfer"
          ? "Pemindahan antar gudang dengan locking saldo dan audit tanpa mengubah nilai persediaan perusahaan."
          : "Snapshot saldo, input hasil hitung, approval, posting variance, jurnal, dan reversal terkendali."
      }
      emptyAction={
        context.permissions.includes("inventory.write") ? (
          <Link
            className="text-brand-600 text-sm font-semibold"
            href={`${meta.base}/new`}
          >
            Buat dokumen pertama
          </Link>
        ) : undefined
      }
      emptyDescription={`Belum ada ${meta.title}.`}
      emptyTitle="Belum ada dokumen"
      rows={rows}
      successMessage={params.deleted ? "Draft berhasil dihapus." : undefined}
      title={meta.title}
    />
  );
}

export async function StockOperationFormPage({
  id,
  operationType,
}: {
  id?: string;
  operationType: InventoryOperationType;
}) {
  const context = await requireCompanyPermission("inventory.write"),
    [options, record] = await Promise.all([
      getInventoryOptions(context.companyId),
      id
        ? getInventoryOperation(context.companyId, operationType, id)
        : Promise.resolve(null),
    ]),
    meta = config[operationType];
  if (record && !["draft", "rejected"].includes(record.status))
    redirect(`${meta.base}/${id}`);
  const initial = record
    ? {
        branchId: record.branch_id,
        destinationWarehouseId: record.destination_warehouse_id ?? "",
        id: record.id,
        lines: record.lines.map((line: Line): StockOperationLine => ({
          countedQuantity: String(line.counted_quantity ?? 0),
          productId: line.product_id,
          quantity: String(line.quantity ?? 1),
        })),
        offsetAccountId: record.offset_account_id ?? "",
        operationDate: record.operation_date,
        reason: record.reason,
        sourceWarehouseId: record.source_warehouse_id,
        version: String(record.version),
      }
    : undefined;
  return (
    <EntityPage
      description={
        operationType === "inventory_transfer"
          ? "Total nilai perusahaan tetap; biaya unit berasal dari moving average gudang sumber."
          : "Saldo expected disnapshot di server dan posting diblokir bila saldo berubah sesudah snapshot."
      }
      title={`${id ? "Edit" : "Buat"} ${meta.title}`}
    >
      <FormCard>
        <StockOperationForm
          accounts={options.accounts.map((row) => ({
            label: `${row.code} — ${row.name}`,
            value: row.id,
          }))}
          action={saveInventoryOperationAction}
          balances={options.balances.map((row) => ({
            productId: row.product_id,
            quantity: String(row.quantity_on_hand),
            warehouseId: row.warehouse_id,
          }))}
          branches={options.branches.map((row) => ({
            label: `${row.code} — ${row.name}`,
            value: row.id,
          }))}
          initial={initial}
          operationType={operationType}
          products={options.products.map((row) => ({
            label: `${row.sku} — ${row.name}`,
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

export async function StockOperationDetailPage({
  id,
  operationType,
  searchParams,
}: {
  id: string;
  operationType: InventoryOperationType;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const query = await searchParams,
    context = await requireCompanyPermission("inventory.read"),
    record = await getInventoryOperation(context.companyId, operationType, id),
    meta = config[operationType];
  const messages: Record<string, string> = {
    approved: "Dokumen disetujui.",
    posted: "Operasi stok berhasil diposting.",
    rejected: "Dokumen ditolak.",
    reversed: "Operasi stok berhasil direversal.",
    saved: "Draft berhasil disimpan.",
    submitted: "Dokumen diajukan untuk persetujuan.",
  };
  const message = Object.keys(messages).find((key) => query[key] === "1");
  return (
    <EntityPage
      description="Perubahan stok hanya dilakukan oleh RPC atomik ketika dokumen approved diposting."
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
              { label: "Tanggal", value: record.operation_date },
              {
                label:
                  operationType === "inventory_transfer"
                    ? "Gudang sumber"
                    : "Gudang",
                value: record.sourceWarehouse?.name,
              },
              {
                label: "Gudang tujuan",
                value: record.destinationWarehouse?.name,
              },
              {
                label: "Akun lawan",
                value: record.account
                  ? `${record.account.code} — ${record.account.name}`
                  : undefined,
              },
              { label: "Status", value: <StatusBadge value={record.status} /> },
              { label: "Alasan", value: record.reason },
            ]}
          />
          <div className="flex flex-wrap justify-end gap-2">
            {["draft", "rejected"].includes(record.status) &&
            context.permissions.includes("inventory.write") ? (
              <Link
                className="rounded-lg border border-gray-300 px-3 py-2 text-xs font-semibold"
                href={`${meta.base}/${id}/edit`}
              >
                Edit
              </Link>
            ) : null}
            {record.status === "draft" &&
            context.permissions.includes("inventory.write") ? (
              <ConfirmActionForm
                action={deleteInventoryOperationAction}
                confirmMessage="Hapus draft operasi stok ini?"
                fields={{ id, operationType, version: String(record.version) }}
                label="Hapus draft"
                tone="danger"
              />
            ) : null}
            {["draft", "rejected"].includes(record.status) &&
            context.permissions.includes("inventory.submit") ? (
              <ConfirmActionForm
                action={submitInventoryOperationAction}
                confirmMessage="Ajukan operasi stok untuk persetujuan?"
                fields={{ id, operationType }}
                label="Ajukan"
                tone="primary"
              />
            ) : null}
            {record.status === "approved" &&
            context.permissions.includes("inventory.post") ? (
              <ConfirmActionForm
                action={postInventoryOperationAction}
                confirmMessage={
                  operationType === "inventory_transfer"
                    ? "Posting akan memindahkan stok antar gudang. Lanjutkan?"
                    : "Posting akan menyesuaikan saldo fisik dan membuat jurnal selisih. Lanjutkan?"
                }
                fields={{ id, operationType }}
                label="Posting"
                tone="primary"
              />
            ) : null}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b text-left text-xs text-gray-500 uppercase">
                <th className="py-3">#</th>
                <th>Produk</th>
                {operationType === "inventory_transfer" ? (
                  <th className="text-right">Kuantitas</th>
                ) : (
                  <>
                    <th className="text-right">Expected</th>
                    <th className="text-right">Counted</th>
                    <th className="text-right">Variance</th>
                  </>
                )}
                <th className="text-right">Biaya</th>
                <th className="text-right">Nilai</th>
              </tr>
            </thead>
            <tbody>
              {record.lines.map((line: Line) => {
                const product = relation(line.products),
                  variance =
                    Number(line.counted_quantity ?? 0) -
                    Number(line.expected_quantity ?? 0);
                return (
                  <tr
                    className="border-b border-gray-100 dark:border-gray-800"
                    key={line.id}
                  >
                    <td className="py-3">{line.line_number}</td>
                    <td>
                      {product ? `${product.sku} — ${product.name}` : "—"}
                    </td>
                    {operationType === "inventory_transfer" ? (
                      <td className="text-right">
                        {formatDecimal(String(line.quantity), {
                          maximumScale: 6,
                        })}
                      </td>
                    ) : (
                      <>
                        <td className="text-right">
                          {formatDecimal(String(line.expected_quantity), {
                            maximumScale: 6,
                          })}
                        </td>
                        <td className="text-right">
                          {formatDecimal(String(line.counted_quantity), {
                            maximumScale: 6,
                          })}
                        </td>
                        <td className="text-right font-semibold">
                          {formatDecimal(String(variance), { maximumScale: 6 })}
                        </td>
                      </>
                    )}
                    <td className="text-right">
                      {formatIDR(String(line.unit_cost))}
                    </td>
                    <td className="text-right">
                      {formatIDR(String(line.total_cost))}
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
        ) : operationType === "stock_count" && record.status === "posted" ? (
          <p className="mt-4 text-sm text-gray-500">
            Tidak ada jurnal karena tidak terdapat selisih.
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
      context.permissions.includes("inventory.approve") ? (
        <section className={`${detailCardClass} mt-4`}>
          <h2 className="mb-4 font-semibold">Keputusan Persetujuan</h2>
          <div className="grid gap-5 md:grid-cols-2">
            <WorkflowActionForm
              action={decideInventoryOperationAction}
              confirmMessage="Setujui dokumen ini?"
              fields={{ action: "approve", id, operationType }}
              label="Setujui"
            />
            <WorkflowActionForm
              action={decideInventoryOperationAction}
              confirmMessage="Tolak dokumen ini?"
              fields={{ action: "reject", id, operationType }}
              label="Tolak"
              requireComment
              tone="danger"
            />
          </div>
        </section>
      ) : null}
      {record.status === "posted" &&
      context.permissions.includes("inventory.reverse") ? (
        <section className={`${detailCardClass} mt-4`}>
          <h2 className="mb-4 font-semibold">Reversal</h2>
          <p className="mb-3 text-sm text-gray-500">
            Reversal diblokir jika ada movement berikutnya pada produk dan
            gudang terkait.
          </p>
          <ReversalForm
            action={reverseInventoryOperationAction}
            fields={{ id, operationType }}
            label="Reverse operasi stok"
            today={new Date().toISOString().slice(0, 10)}
          />
        </section>
      ) : null}
      <Link
        className="text-brand-600 mt-4 inline-block text-sm font-semibold"
        href={meta.base}
      >
        ← Kembali ke daftar
      </Link>
    </EntityPage>
  );
}
