"use client";
import Link from "next/link";
import { useActionState, useState } from "react";
import {
  initialMutationState,
  type MutationState,
} from "@/features/shared/mutation-state";
import type { ReturnKind } from "./schemas";
type Line = {
  id: string;
  description: string;
  product: string;
  productType: string;
  quantity: string;
  warehouseId: string;
};
type Invoice = { contact: string; id: string; label: string; lines: Line[] };
type Initial = {
  id: string;
  lines: { quantity: string; sourceLineId: string; warehouseId: string }[];
  reason: string;
  returnDate: string;
  sourceInvoiceId: string;
  version: string;
};
export function ReturnForm({
  action,
  initial,
  invoices,
  kind,
  today,
  warehouses,
}: {
  action: (s: MutationState, d: FormData) => Promise<MutationState>;
  initial?: Initial;
  invoices: Invoice[];
  kind: ReturnKind;
  today: string;
  warehouses: { label: string; value: string }[];
}) {
  const [state, formAction, pending] = useActionState(
      action,
      initialMutationState,
    ),
    [invoiceId, setInvoiceId] = useState(
      initial?.sourceInvoiceId ?? invoices[0]?.id ?? "",
    ),
    invoice = invoices.find((row) => row.id === invoiceId),
    [selected, setSelected] = useState<
      Record<string, { quantity: string; warehouseId: string }>
    >(() =>
      Object.fromEntries(
        (initial?.lines ?? []).map((line) => [
          line.sourceLineId,
          { quantity: line.quantity, warehouseId: line.warehouseId },
        ]),
      ),
    ),
    lines = Object.entries(selected)
      .filter(([, line]) => Number(line.quantity) > 0)
      .map(([sourceLineId, line]) => ({ sourceLineId, ...line })),
    input =
      "h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm dark:border-gray-700 dark:bg-gray-900";
  return (
    <form action={formAction} className="space-y-6">
      <input name="id" type="hidden" value={initial?.id ?? ""} />
      <input name="kind" type="hidden" value={kind} />
      <input name="version" type="hidden" value={initial?.version ?? ""} />
      <input name="lines" type="hidden" value={JSON.stringify(lines)} />
      <div className="grid gap-5 md:grid-cols-2">
        <label className="text-sm font-medium">
          Invoice sumber
          <select
            className={`${input} mt-2`}
            disabled={Boolean(initial)}
            name="sourceInvoiceId"
            onChange={(e) => {
              setInvoiceId(e.target.value);
              setSelected({});
            }}
            required
            value={invoiceId}
          >
            <option value="">Pilih invoice…</option>
            {invoices.map((row) => (
              <option key={row.id} value={row.id}>
                {row.label}
              </option>
            ))}
          </select>
          {initial ? (
            <input name="sourceInvoiceId" type="hidden" value={invoiceId} />
          ) : null}
        </label>
        <label className="text-sm font-medium">
          Tanggal retur
          <input
            className={`${input} mt-2`}
            defaultValue={initial?.returnDate ?? today}
            name="returnDate"
            required
            type="date"
          />
        </label>
        <label className="text-sm font-medium md:col-span-2">
          Alasan
          <textarea
            className="mt-2 min-h-20 w-full rounded-lg border border-gray-300 p-3"
            defaultValue={initial?.reason}
            minLength={5}
            name="reason"
            required
          />
        </label>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className="py-2">Produk</th>
              <th>Deskripsi</th>
              <th className="text-right">Maks</th>
              <th className="text-right">Qty retur</th>
              <th>Gudang</th>
            </tr>
          </thead>
          <tbody>
            {invoice?.lines.map((line) => {
              const current = selected[line.id] ?? {
                quantity: "0",
                warehouseId: line.warehouseId,
              };
              return (
                <tr className="border-b" key={line.id}>
                  <td className="py-2">{line.product}</td>
                  <td>{line.description}</td>
                  <td className="text-right">{line.quantity}</td>
                  <td>
                    <input
                      aria-label={`Kuantitas ${line.product}`}
                      className={`${input} text-right`}
                      max={line.quantity}
                      min="0"
                      onChange={(e) =>
                        setSelected((old) => ({
                          ...old,
                          [line.id]: { ...current, quantity: e.target.value },
                        }))
                      }
                      step="0.000001"
                      type="number"
                      value={current.quantity}
                    />
                  </td>
                  <td>
                    {line.productType === "inventory" ? (
                      <select
                        aria-label={`Gudang ${line.product}`}
                        className={input}
                        onChange={(e) =>
                          setSelected((old) => ({
                            ...old,
                            [line.id]: {
                              ...current,
                              warehouseId: e.target.value,
                            },
                          }))
                        }
                        required={Number(current.quantity) > 0}
                        value={current.warehouseId}
                      >
                        <option value="">Pilih gudang…</option>
                        {warehouses.map((row) => (
                          <option key={row.value} value={row.value}>
                            {row.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      "N/A"
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {state.status === "error" ? (
        <p
          className="bg-error-50 text-error-700 rounded-xl p-3 text-sm"
          role="alert"
        >
          {state.error.message}
        </p>
      ) : null}
      <div className="flex justify-end gap-3">
        <Link
          className="rounded-xl border px-4 py-2.5 text-sm font-semibold"
          href={
            kind === "sales_return" ? "/sales/returns" : "/purchases/returns"
          }
        >
          Batal
        </Link>
        <button
          className="bg-brand-500 rounded-xl px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          disabled={pending || lines.length === 0}
          type="submit"
        >
          {pending ? "Menyimpan…" : "Simpan draft"}
        </button>
      </div>
    </form>
  );
}
