import Link from "next/link";

import { ConfirmActionForm } from "@/components/forms/ConfirmActionForm";
import type { MutationState } from "@/features/shared/mutation-state";

export type ListSearchParams = {
  active?: string;
  deleted?: string;
  page?: string;
  q?: string;
  saved?: string;
  statusChanged?: string;
  type?: string;
};

export function parseListParams(params: ListSearchParams) {
  const parsedPage = Number(params.page ?? "1");
  return {
    active: params.active,
    page: Number.isInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1,
    q: params.q?.trim() || undefined,
    type: params.type,
  };
}

export function mutationMessage(params: ListSearchParams, noun: string) {
  if (params.saved === "1") return `${noun} berhasil disimpan.`;
  if (params.statusChanged === "1")
    return `Status ${noun.toLowerCase()} berhasil diubah.`;
  return undefined;
}

export function PageActions({
  canCreate,
  canExport,
  createHref,
  exportResource,
}: {
  canCreate: boolean;
  canExport: boolean;
  createHref: string;
  exportResource: string;
}) {
  const secondary =
    "rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300";
  return (
    <div className="flex gap-2">
      {canExport ? (
        <Link className={secondary} href={`/api/export/${exportResource}`}>
          Ekspor CSV
        </Link>
      ) : null}
      {canCreate ? (
        <Link
          className="bg-brand-500 hover:bg-brand-600 rounded-xl px-4 py-2.5 text-sm font-semibold text-white"
          href={createHref}
        >
          Tambah baru
        </Link>
      ) : null}
    </div>
  );
}

export function MasterRowActions({
  action,
  basePath,
  canManage,
  row,
}: {
  action: (state: MutationState, formData: FormData) => Promise<MutationState>;
  basePath: string;
  canManage: boolean;
  row: { id: string; is_active: boolean; version: number };
}) {
  return (
    <div className="flex items-center justify-end gap-2">
      <Link
        className="text-brand-600 hover:text-brand-700 text-xs font-semibold"
        href={`${basePath}/${row.id}`}
      >
        Detail
      </Link>
      {canManage ? (
        <>
          <Link
            className="text-xs font-semibold text-gray-600 hover:text-gray-900 dark:text-gray-300"
            href={`${basePath}/${row.id}/edit`}
          >
            Edit
          </Link>
          <ConfirmActionForm
            action={action}
            confirmMessage={`${row.is_active ? "Nonaktifkan" : "Aktifkan"} data ini?`}
            fields={{
              activate: String(!row.is_active),
              id: row.id,
              version: String(row.version),
            }}
            label={row.is_active ? "Nonaktifkan" : "Aktifkan"}
            tone={row.is_active ? "danger" : "primary"}
          />
        </>
      ) : null}
    </div>
  );
}

export const detailCardClass =
  "rounded-2xl border border-gray-200 bg-white p-6 shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.03]";
