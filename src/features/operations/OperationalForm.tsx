"use client";
import Link from "next/link";
import { useActionState, useState } from "react";
import {
  initialMutationState,
  type MutationState,
} from "@/features/shared/mutation-state";
import { operationConfig } from "./config";
import type { OperationalKind } from "./schemas";
type Option = { label: string; value: string };
type ProductOption = Option & { price: string };
type WarehouseOption = Option & { branchId: string };
export type OperationalLineInput = {
  description: string;
  productId: string;
  quantity: string;
  sourceLineId: string;
  unitAmount: string;
  warehouseId: string;
};
type Initial = {
  branchId: string;
  contactId: string;
  documentDate: string;
  id: string;
  lines: OperationalLineInput[];
  notes: string;
  version: string;
};
const empty = (): OperationalLineInput => ({
  description: "",
  productId: "",
  quantity: "1",
  sourceLineId: "",
  unitAmount: "0",
  warehouseId: "",
});
export function OperationalForm({
  action,
  branches,
  contacts,
  initial,
  kind,
  products,
  today,
  warehouses,
}: {
  action: (state: MutationState, data: FormData) => Promise<MutationState>;
  branches: Option[];
  contacts: Option[];
  initial?: Initial;
  kind: OperationalKind;
  products: ProductOption[];
  today: string;
  warehouses: WarehouseOption[];
}) {
  const [state, formAction, pending] = useActionState(
      action,
      initialMutationState,
    ),
    [branch, setBranch] = useState(initial?.branchId ?? ""),
    [lines, setLines] = useState(initial?.lines ?? [empty()]);
  const input =
    "h-11 w-full rounded-xl border border-gray-300 bg-white px-3.5 text-sm dark:border-gray-700 dark:bg-gray-900";
  const update = (index: number, patch: Partial<OperationalLineInput>) =>
    setLines((current) =>
      current.map((line, position) =>
        position === index ? { ...line, ...patch } : line,
      ),
    );
  return (
    <form action={formAction} className="space-y-6">
      <input name="id" type="hidden" value={initial?.id ?? ""} />
      <input name="kind" type="hidden" value={kind} />
      <input name="version" type="hidden" value={initial?.version ?? ""} />
      <input name="lines" type="hidden" value={JSON.stringify(lines)} />
      <div className="grid gap-5 md:grid-cols-3">
        <label className="text-sm font-medium">
          Tanggal
          <input
            className={`${input} mt-2`}
            defaultValue={initial?.documentDate ?? today}
            name="documentDate"
            required
            type="date"
          />
        </label>
        <label className="text-sm font-medium">
          Cabang
          <select
            className={`${input} mt-2`}
            name="branchId"
            onChange={(event) => setBranch(event.target.value)}
            required
            value={branch}
          >
            <option value="">Pilih cabang…</option>
            {branches.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm font-medium">
          {operationConfig[kind].contact}
          <select
            className={`${input} mt-2`}
            defaultValue={initial?.contactId ?? ""}
            name="contactId"
            required
          >
            <option value="">Pilih kontak…</option>
            {contacts.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm font-medium md:col-span-3">
          Catatan
          <textarea
            className="mt-2 min-h-20 w-full rounded-xl border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-900"
            defaultValue={initial?.notes}
            name="notes"
          />
        </label>
      </div>
      <div>
        <div className="mb-3 flex justify-between">
          <h2 className="font-semibold">Baris Produk</h2>
          <button
            className="border-brand-300 text-brand-600 rounded-lg border px-3 py-1.5 text-xs font-semibold"
            onClick={() => setLines((current) => [...current, empty()])}
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
                className={`${input} md:col-span-3`}
                onChange={(event) => {
                  const product = products.find(
                    (item) => item.value === event.target.value,
                  );
                  update(index, {
                    description:
                      product?.label.split(" — ").slice(1).join(" — ") ?? "",
                    productId: event.target.value,
                    unitAmount: product?.price ?? line.unitAmount,
                  });
                }}
                required
                value={line.productId}
              >
                <option value="">Pilih produk…</option>
                {products.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
              <select
                aria-label={`Gudang baris ${index + 1}`}
                className={`${input} md:col-span-3`}
                onChange={(event) =>
                  update(index, { warehouseId: event.target.value })
                }
                required
                value={line.warehouseId}
              >
                <option value="">Pilih gudang…</option>
                {warehouses
                  .filter((item) => !branch || item.branchId === branch)
                  .map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
              </select>
              <input
                aria-label={`Deskripsi baris ${index + 1}`}
                className={`${input} md:col-span-2`}
                onChange={(event) =>
                  update(index, { description: event.target.value })
                }
                required
                value={line.description}
              />
              <input
                aria-label={`Kuantitas baris ${index + 1}`}
                className={`${input} text-right md:col-span-1`}
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
                aria-label={`Harga baris ${index + 1}`}
                className={`${input} text-right md:col-span-2`}
                min="0"
                onChange={(event) =>
                  update(index, { unitAmount: event.target.value })
                }
                required
                step="0.000001"
                type="number"
                value={line.unitAmount}
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
              ? `${operationConfig[kind].base}/${initial.id}`
              : operationConfig[kind].base
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
