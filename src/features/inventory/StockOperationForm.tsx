"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import {
  initialMutationState,
  type MutationState,
} from "@/features/shared/mutation-state";
import type { InventoryOperationType } from "./schemas";

type Option = { label: string; value: string };
type Warehouse = Option & { branchId: string };
type Balance = { productId: string; quantity: string; warehouseId: string };
export type StockOperationLine = {
  countedQuantity: string;
  productId: string;
  quantity: string;
};
type Initial = {
  branchId: string;
  destinationWarehouseId: string;
  id: string;
  lines: StockOperationLine[];
  offsetAccountId: string;
  operationDate: string;
  reason: string;
  sourceWarehouseId: string;
  version: string;
};

const emptyLine = (): StockOperationLine => ({
  countedQuantity: "0",
  productId: "",
  quantity: "1",
});

export function StockOperationForm({
  accounts,
  action,
  balances,
  branches,
  initial,
  operationType,
  products,
  today,
  warehouses,
}: {
  accounts: Option[];
  action: (state: MutationState, formData: FormData) => Promise<MutationState>;
  balances: Balance[];
  branches: Option[];
  initial?: Initial;
  operationType: InventoryOperationType;
  products: Option[];
  today: string;
  warehouses: Warehouse[];
}) {
  const [state, formAction, pending] = useActionState(
    action,
    initialMutationState,
  );
  const [branchId, setBranchId] = useState(initial?.branchId ?? "");
  const [sourceId, setSourceId] = useState(initial?.sourceWarehouseId ?? "");
  const [lines, setLines] = useState<StockOperationLine[]>(
    initial?.lines ?? [emptyLine()],
  );
  const input =
    "h-11 w-full rounded-xl border border-gray-300 bg-white px-3.5 text-sm dark:border-gray-700 dark:bg-gray-900";
  const isTransfer = operationType === "inventory_transfer";
  const update = (index: number, patch: Partial<StockOperationLine>) =>
    setLines((current) =>
      current.map((line, position) =>
        position === index ? { ...line, ...patch } : line,
      ),
    );
  const expected = (productId: string) =>
    balances.find(
      (row) => row.productId === productId && row.warehouseId === sourceId,
    )?.quantity ?? "0";
  return (
    <form action={formAction} className="space-y-6">
      <input name="id" type="hidden" value={initial?.id ?? ""} />
      <input name="version" type="hidden" value={initial?.version ?? ""} />
      <input name="operationType" type="hidden" value={operationType} />
      <input name="lines" type="hidden" value={JSON.stringify(lines)} />
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        <label className="text-sm font-medium">
          Tanggal
          <input
            className={`${input} mt-2`}
            defaultValue={initial?.operationDate ?? today}
            name="operationDate"
            required
            type="date"
          />
        </label>
        <label className="text-sm font-medium">
          Cabang
          <select
            className={`${input} mt-2`}
            name="branchId"
            onChange={(event) => {
              setBranchId(event.target.value);
              setSourceId("");
            }}
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
          {isTransfer ? "Gudang sumber" : "Gudang opname"}
          <select
            className={`${input} mt-2`}
            name="sourceWarehouseId"
            onChange={(event) => setSourceId(event.target.value)}
            required
            value={sourceId}
          >
            <option value="">Pilih gudang…</option>
            {warehouses
              .filter((row) => !branchId || row.branchId === branchId)
              .map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
          </select>
        </label>
        {isTransfer ? (
          <label className="text-sm font-medium">
            Gudang tujuan
            <select
              className={`${input} mt-2`}
              defaultValue={initial?.destinationWarehouseId ?? ""}
              name="destinationWarehouseId"
              required
            >
              <option value="">Pilih gudang…</option>
              {warehouses
                .filter((row) => row.value !== sourceId)
                .map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
            </select>
          </label>
        ) : (
          <label className="text-sm font-medium">
            Akun lawan selisih
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
        )}
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
              {isTransfer ? (
                <input
                  aria-label={`Kuantitas baris ${index + 1}`}
                  className={`${input} text-right md:col-span-4`}
                  min="0.000001"
                  onChange={(event) =>
                    update(index, { quantity: event.target.value })
                  }
                  required
                  step="0.000001"
                  type="number"
                  value={line.quantity}
                />
              ) : (
                <>
                  <output className="flex h-11 items-center rounded-xl bg-gray-50 px-3 text-sm md:col-span-2 dark:bg-gray-800">
                    Expected: {expected(line.productId)}
                  </output>
                  <input
                    aria-label={`Hasil hitung baris ${index + 1}`}
                    className={`${input} text-right md:col-span-2`}
                    min="0"
                    onChange={(event) =>
                      update(index, { countedQuantity: event.target.value })
                    }
                    required
                    step="0.000001"
                    type="number"
                    value={line.countedQuantity}
                  />
                </>
              )}
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
        {!isTransfer ? (
          <p className="mt-3 text-sm text-gray-500">
            Expected quantity ditampilkan untuk panduan dan disnapshot ulang
            secara atomik ketika draft disimpan.
          </p>
        ) : null}
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
            operationType === "inventory_transfer"
              ? "/inventory/transfers"
              : "/inventory/opname"
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
