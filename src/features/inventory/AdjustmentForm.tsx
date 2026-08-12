"use client";

import Link from "next/link";
import { useActionState, useMemo, useState } from "react";

import { formatIDR } from "@/domain/money";
import {
  initialMutationState,
  type MutationState,
} from "@/features/shared/mutation-state";

type Option = { label: string; value: string };
type WarehouseOption = Option & { branchId: string };
export type AdjustmentLineInput = {
  productId: string;
  quantity: string;
  unitCost: string;
};
type Initial = {
  adjustmentDate: string;
  adjustmentType: "decrease" | "increase";
  branchId: string;
  id: string;
  lines: AdjustmentLineInput[];
  offsetAccountId: string;
  reason: string;
  version: string;
  warehouseId: string;
};

const emptyLine = (): AdjustmentLineInput => ({
  productId: "",
  quantity: "1",
  unitCost: "0",
});

export function AdjustmentForm({
  accounts,
  action,
  branches,
  initial,
  products,
  today,
  warehouses,
}: {
  accounts: Option[];
  action: (state: MutationState, formData: FormData) => Promise<MutationState>;
  branches: Option[];
  initial?: Initial;
  products: Option[];
  today: string;
  warehouses: WarehouseOption[];
}) {
  const [state, formAction, pending] = useActionState(
    action,
    initialMutationState,
  );
  const [lines, setLines] = useState<AdjustmentLineInput[]>(
    initial?.lines ?? [emptyLine()],
  );
  const [type, setType] = useState(initial?.adjustmentType ?? "increase");
  const [branchId, setBranchId] = useState(initial?.branchId ?? "");
  const filteredWarehouses = warehouses.filter(
    (warehouse) => !branchId || warehouse.branchId === branchId,
  );
  const total = useMemo(
    () =>
      lines.reduce(
        (sum, line) =>
          sum + Number(line.quantity || 0) * Number(line.unitCost || 0),
        0,
      ),
    [lines],
  );
  const input =
    "h-11 w-full rounded-xl border border-gray-300 bg-white px-3.5 text-sm dark:border-gray-700 dark:bg-gray-900";
  const update = (index: number, patch: Partial<AdjustmentLineInput>) =>
    setLines((current) =>
      current.map((line, position) =>
        position === index ? { ...line, ...patch } : line,
      ),
    );
  return (
    <form action={formAction} className="space-y-6">
      <input name="id" type="hidden" value={initial?.id ?? ""} />
      <input name="version" type="hidden" value={initial?.version ?? ""} />
      <input name="lines" type="hidden" value={JSON.stringify(lines)} />
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        <label className="text-sm font-medium">
          Tanggal adjustment
          <input
            className={`${input} mt-2`}
            defaultValue={initial?.adjustmentDate ?? today}
            name="adjustmentDate"
            required
            type="date"
          />
        </label>
        <label className="text-sm font-medium">
          Jenis
          <select
            className={`${input} mt-2`}
            name="adjustmentType"
            onChange={(event) =>
              setType(event.target.value as "decrease" | "increase")
            }
            value={type}
          >
            <option value="increase">Penambahan stok</option>
            <option value="decrease">Pengurangan stok</option>
          </select>
        </label>
        <label className="text-sm font-medium">
          Cabang
          <select
            className={`${input} mt-2`}
            name="branchId"
            onChange={(event) => setBranchId(event.target.value)}
            required
            value={branchId}
          >
            <option value="">Pilih cabang…</option>
            {branches.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm font-medium">
          Gudang
          <select
            className={`${input} mt-2`}
            defaultValue={initial?.warehouseId ?? ""}
            name="warehouseId"
            required
          >
            <option value="">Pilih gudang…</option>
            {filteredWarehouses.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm font-medium">
          Akun lawan
          <select
            className={`${input} mt-2`}
            defaultValue={initial?.offsetAccountId ?? ""}
            name="offsetAccountId"
            required
          >
            <option value="">Pilih akun…</option>
            {accounts.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm font-medium md:col-span-2 xl:col-span-3">
          Alasan
          <textarea
            className="mt-2 min-h-24 w-full rounded-xl border border-gray-300 px-3.5 py-3 text-sm dark:border-gray-700 dark:bg-gray-900"
            defaultValue={initial?.reason}
            minLength={5}
            name="reason"
            required
          />
        </label>
      </div>
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold">Produk</h2>
          <button
            className="border-brand-300 text-brand-600 rounded-lg border px-3 py-1.5 text-xs font-semibold"
            onClick={() => setLines((current) => [...current, emptyLine()])}
            type="button"
          >
            Tambah baris
          </button>
        </div>
        <div className="space-y-3">
          {lines.map((line, index) => (
            <div
              className="grid gap-3 rounded-xl border border-gray-200 p-3 md:grid-cols-12 dark:border-gray-800"
              key={index}
            >
              <select
                aria-label={`Produk baris ${index + 1}`}
                className={`${input} md:col-span-6`}
                onChange={(event) =>
                  update(index, { productId: event.target.value })
                }
                required
                value={line.productId}
              >
                <option value="">Pilih produk…</option>
                {products.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <input
                aria-label={`Kuantitas baris ${index + 1}`}
                className={`${input} text-right md:col-span-2`}
                min="0.000001"
                onChange={(event) =>
                  update(index, { quantity: event.target.value })
                }
                required
                step="0.000001"
                type="number"
                value={line.quantity}
              />
              <input
                aria-label={`Biaya unit baris ${index + 1}`}
                className={`${input} text-right md:col-span-3`}
                disabled={type === "decrease"}
                min={type === "increase" ? "0.000001" : "0"}
                onChange={(event) =>
                  update(index, { unitCost: event.target.value })
                }
                required={type === "increase"}
                step="0.000001"
                type="number"
                value={line.unitCost}
              />
              <button
                className="text-error-600 text-xs font-semibold disabled:opacity-40"
                disabled={lines.length === 1}
                onClick={() =>
                  setLines((current) =>
                    current.filter((_, position) => position !== index),
                  )
                }
                type="button"
              >
                Hapus
              </button>
            </div>
          ))}
        </div>
        <p className="mt-3 text-right text-sm text-gray-500">
          {type === "increase"
            ? `Estimasi nilai: ${formatIDR(String(total))}`
            : "Biaya pengurangan dihitung dari moving average saat posting."}
        </p>
      </div>
      {state.status === "error" ? (
        <p
          className="bg-error-50 text-error-700 rounded-xl p-3 text-sm"
          role="alert"
        >
          {state.error.message}
        </p>
      ) : null}
      <div className="flex justify-end gap-3 border-t pt-5">
        <Link
          className="rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-semibold"
          href={
            initial
              ? `/inventory/adjustments/${initial.id}`
              : "/inventory/adjustments"
          }
        >
          Batal
        </Link>
        <button
          className="bg-brand-500 rounded-xl px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          disabled={pending}
          type="submit"
        >
          {pending ? "Menyimpan…" : "Simpan draft"}
        </button>
      </div>
    </form>
  );
}
