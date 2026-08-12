import Link from "next/link";
import { redirect } from "next/navigation";

import { DocumentFilters } from "@/components/common/DocumentFilters";
import { EntityDetails } from "@/components/common/EntityDetails";
import { EntityPage, FormCard } from "@/components/common/EntityPage";
import { ModulePage, StatusBadge } from "@/components/common/ModulePage";
import { Pagination } from "@/components/common/Pagination";
import { ConfirmActionForm } from "@/components/forms/ConfirmActionForm";
import { ReversalForm } from "@/components/forms/ReversalForm";
import { WorkflowActionForm } from "@/components/forms/WorkflowActionForm";
import { formatDecimal, formatIDR } from "@/domain/money";
import { detailCardClass } from "@/features/master/page-ui";
import { requireCompanyPermission } from "@/server/auth/require-permission";
import {
  getInventoryAdjustment,
  getInventoryAdjustments,
  getInventoryOptions,
  INVENTORY_PAGE_SIZE,
} from "@/server/queries/inventory";

import {
  decideAdjustmentAction,
  deleteAdjustmentAction,
  postAdjustmentAction,
  reverseAdjustmentAction,
  saveAdjustmentAction,
  submitAdjustmentAction,
} from "./actions";
import { AdjustmentForm, type AdjustmentLineInput } from "./AdjustmentForm";

export type InventorySearchParams = {
  deleted?: string;
  page?: string;
  q?: string;
  status?: string;
};

type AdjustmentRecordLine = {
  id: string;
  line_number: number;
  product_id: string;
  products: { name: string; sku: string } | null;
  quantity: number | string;
  total_cost: number | string;
  unit_cost: number | string;
};

type ApprovalActionRecord = {
  action: string;
  comment: string | null;
  created_at: string;
};

export async function AdjustmentListPage({
  searchParams,
}: {
  searchParams: Promise<InventorySearchParams>;
}) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page ?? 1) || 1);
  const context = await requireCompanyPermission("inventory.read");
  const records = await getInventoryAdjustments(context.companyId, {
    page,
    q: params.q,
    status: params.status,
  });
  const rows = records.slice(0, INVENTORY_PAGE_SIZE);
  return (
    <ModulePage
      actions={
        context.permissions.includes("inventory.write") ? (
          <Link
            className="bg-brand-500 rounded-xl px-4 py-2.5 text-sm font-semibold text-white"
            href="/inventory/adjustments/new"
          >
            Buat adjustment
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
              href={`/inventory/adjustments/${row.id}`}
            >
              {String(value)}
            </Link>
          ),
        },
        { key: "adjustment_date", label: "Tanggal" },
        { key: "warehouse", label: "Gudang" },
        { key: "adjustment_type", label: "Jenis" },
        {
          align: "right",
          key: "total_cost",
          label: "Nilai",
          render: (value) => formatIDR(String(value)),
        },
        {
          key: "status",
          label: "Status",
          render: (value) => <StatusBadge value={String(value)} />,
        },
      ]}
      description="Penyesuaian stok melalui approval, locking saldo, moving average, jurnal seimbang, dan audit trail."
      emptyAction={
        context.permissions.includes("inventory.write") ? (
          <Link
            className="text-brand-600 text-sm font-semibold"
            href="/inventory/adjustments/new"
          >
            Buat adjustment pertama
          </Link>
        ) : undefined
      }
      emptyDescription="Buat adjustment untuk saldo awal, koreksi selisih, atau kerusakan barang."
      emptyTitle="Belum ada adjustment"
      filters={<DocumentFilters q={params.q} status={params.status} />}
      rows={rows}
      successMessage={
        params.deleted ? "Draft adjustment berhasil dihapus." : undefined
      }
      title="Stock Adjustment"
      trailing={
        <Pagination
          hasNext={records.length > INVENTORY_PAGE_SIZE}
          page={page}
          searchParams={params}
        />
      }
    />
  );
}

export async function AdjustmentFormPage({ id }: { id?: string }) {
  const context = await requireCompanyPermission("inventory.write");
  const [options, record] = await Promise.all([
    getInventoryOptions(context.companyId),
    id ? getInventoryAdjustment(context.companyId, id) : Promise.resolve(null),
  ]);
  if (record && !["draft", "rejected"].includes(record.status))
    redirect(`/inventory/adjustments/${id}`);
  const initial = record
    ? {
        adjustmentDate: record.adjustment_date,
        adjustmentType: record.adjustment_type as "decrease" | "increase",
        branchId: record.branch_id,
        id: record.id,
        lines: record.lines.map(
          (line: AdjustmentRecordLine): AdjustmentLineInput => ({
            productId: line.product_id,
            quantity: String(line.quantity),
            unitCost: String(line.unit_cost),
          }),
        ),
        offsetAccountId: record.offset_account_id,
        reason: record.reason,
        version: String(record.version),
        warehouseId: record.warehouse_id,
      }
    : undefined;
  return (
    <EntityPage
      description="Nilai final pengurangan selalu dihitung ulang memakai moving average terkunci di database."
      title={`${id ? "Edit" : "Buat"} Stock Adjustment`}
    >
      <FormCard>
        <AdjustmentForm
          accounts={options.accounts.map((row) => ({
            label: `${row.code} — ${row.name}`,
            value: row.id,
          }))}
          action={saveAdjustmentAction}
          branches={options.branches.map((row) => ({
            label: `${row.code} — ${row.name}`,
            value: row.id,
          }))}
          initial={initial}
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

export async function AdjustmentDetailPage({
  id,
  searchParams,
}: {
  id: string;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const query = await searchParams;
  const context = await requireCompanyPermission("inventory.read");
  const record = await getInventoryAdjustment(context.companyId, id);
  const messages: Record<string, string> = {
    approved: "Adjustment berhasil disetujui.",
    posted: "Adjustment berhasil diposting.",
    rejected: "Adjustment ditolak.",
    reversed: "Adjustment berhasil direversal.",
    saved: "Draft adjustment berhasil disimpan.",
    submitted: "Adjustment diajukan untuk persetujuan.",
  };
  const message = Object.keys(messages).find((key) => query[key] === "1");
  return (
    <EntityPage
      description="Dampak persediaan dan jurnal hanya terjadi ketika dokumen approved diposting."
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
              { label: "Tanggal", value: record.adjustment_date },
              { label: "Jenis", value: record.adjustment_type },
              { label: "Cabang", value: record.branches?.name },
              { label: "Gudang", value: record.warehouses?.name },
              {
                label: "Akun lawan",
                value: `${record.chart_of_accounts?.code} — ${record.chart_of_accounts?.name}`,
              },
              { label: "Nilai", value: formatIDR(String(record.total_cost)) },
              { label: "Status", value: <StatusBadge value={record.status} /> },
              { label: "Alasan", value: record.reason },
            ]}
          />
          <div className="flex flex-wrap justify-end gap-2">
            {["draft", "rejected"].includes(record.status) &&
            context.permissions.includes("inventory.write") ? (
              <Link
                className="rounded-lg border border-gray-300 px-3 py-2 text-xs font-semibold"
                href={`/inventory/adjustments/${id}/edit`}
              >
                Edit
              </Link>
            ) : null}
            {record.status === "draft" &&
            context.permissions.includes("inventory.write") ? (
              <ConfirmActionForm
                action={deleteAdjustmentAction}
                confirmMessage="Hapus draft adjustment ini?"
                fields={{ id, version: String(record.version) }}
                label="Hapus draft"
                tone="danger"
              />
            ) : null}
            {["draft", "rejected"].includes(record.status) &&
            context.permissions.includes("inventory.submit") ? (
              <ConfirmActionForm
                action={submitAdjustmentAction}
                confirmMessage="Ajukan adjustment untuk persetujuan?"
                fields={{ id }}
                label="Ajukan"
                tone="primary"
              />
            ) : null}
            {record.status === "approved" &&
            context.permissions.includes("inventory.post") ? (
              <ConfirmActionForm
                action={postAdjustmentAction}
                confirmMessage="Posting adjustment akan mengubah saldo stok dan membuat jurnal. Lanjutkan?"
                fields={{ id }}
                label="Posting"
                tone="primary"
              />
            ) : null}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-sm">
            <thead>
              <tr className="border-b text-left text-xs text-gray-500 uppercase">
                <th className="py-3">#</th>
                <th>Produk</th>
                <th className="text-right">Qty</th>
                <th className="text-right">Biaya</th>
                <th className="text-right">Nilai</th>
              </tr>
            </thead>
            <tbody>
              {record.lines.map((line: AdjustmentRecordLine) => (
                <tr
                  className="border-b border-gray-100 dark:border-gray-800"
                  key={line.id}
                >
                  <td className="py-3">{line.line_number}</td>
                  <td>
                    {line.products
                      ? `${line.products.sku} — ${line.products.name}`
                      : "—"}
                  </td>
                  <td className="text-right">
                    {formatDecimal(String(line.quantity), { maximumScale: 6 })}
                  </td>
                  <td className="text-right">
                    {formatIDR(String(line.unit_cost))}
                  </td>
                  <td className="text-right font-semibold">
                    {formatIDR(String(line.total_cost))}
                  </td>
                </tr>
              ))}
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
      context.permissions.includes("inventory.approve") ? (
        <section className={`${detailCardClass} mt-4`}>
          <h2 className="mb-4 font-semibold">Keputusan Persetujuan</h2>
          <div className="grid gap-5 md:grid-cols-2">
            <WorkflowActionForm
              action={decideAdjustmentAction}
              confirmMessage="Setujui adjustment ini?"
              fields={{ action: "approve", id }}
              label="Setujui"
            />
            <WorkflowActionForm
              action={decideAdjustmentAction}
              confirmMessage="Tolak adjustment ini?"
              fields={{ action: "reject", id }}
              label="Tolak"
              requireComment
              tone="danger"
            />
          </div>
        </section>
      ) : null}
      {record.status === "posted" &&
      context.permissions.includes("inventory.reverse") &&
      context.permissions.includes("journal.reverse") ? (
        <section className={`${detailCardClass} mt-4`}>
          <h2 className="mb-4 font-semibold">Reversal Adjustment</h2>
          <p className="mb-3 text-sm text-gray-500">
            Reversal diblokir jika produk sudah memiliki movement berikutnya
            agar moving average tetap dapat ditelusuri.
          </p>
          <ReversalForm
            action={reverseAdjustmentAction}
            fields={{ id }}
            label="Reverse adjustment"
            today={new Date().toISOString().slice(0, 10)}
          />
        </section>
      ) : null}
      {record.approval?.approval_actions?.length ? (
        <section className={`${detailCardClass} mt-4`}>
          <h2 className="mb-3 font-semibold">Riwayat Persetujuan</h2>
          <ul className="space-y-2 text-sm">
            {record.approval.approval_actions.map(
              (action: ApprovalActionRecord) => (
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
        href="/inventory/adjustments"
      >
        ← Kembali ke daftar
      </Link>
    </EntityPage>
  );
}
