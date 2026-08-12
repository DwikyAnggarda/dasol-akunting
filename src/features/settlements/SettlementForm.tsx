"use client";

import Link from "next/link";
import { useActionState, useMemo, useState } from "react";

import { formatIDR } from "@/domain/money";
import {
  initialMutationState,
  type MutationState,
} from "@/features/shared/mutation-state";

type Option = { label: string; value: string };
type OpenItem = Option & {
  contactId: string;
  documentDate: string;
  documentNumber: string;
  dueDate: string;
  outstanding: string;
};
type Props = {
  action: (state: MutationState, formData: FormData) => Promise<MutationState>;
  banks: Option[];
  branches: Option[];
  cancelHref: string;
  contacts: Option[];
  defaultDate: string;
  initial?: {
    allocations: { amount: string; itemId: string }[];
    bankAccountId: string;
    branchId: string;
    contactId: string;
    id: string;
    notes?: string | null;
    settlementDate: string;
    version: string;
  };
  items: OpenItem[];
  kind: "customer" | "supplier";
};

export function SettlementForm({
  action,
  banks,
  branches,
  cancelHref,
  contacts,
  defaultDate,
  initial,
  items,
  kind,
}: Props) {
  const [state, formAction, pending] = useActionState(
    action,
    initialMutationState,
  );
  const [contactId, setContactId] = useState(initial?.contactId ?? "");
  const [amounts, setAmounts] = useState<Record<string, string>>(
    Object.fromEntries(
      (initial?.allocations ?? []).map((item) => [item.itemId, item.amount]),
    ),
  );
  const visibleItems = items.filter((item) => item.contactId === contactId);
  const allocations = Object.entries(amounts)
    .filter(([, amount]) => Number(amount) > 0)
    .map(([itemId, amount]) => ({ amount, itemId }));
  const total = useMemo(
    () => allocations.reduce((sum, item) => sum + Number(item.amount), 0),
    [allocations],
  );
  const inputClass =
    "h-11 w-full rounded-xl border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white";
  return (
    <form action={formAction} className="space-y-6">
      <input name="kind" type="hidden" value={kind} />
      <input
        name="allocations"
        type="hidden"
        value={JSON.stringify(allocations)}
      />
      {initial ? (
        <>
          <input name="id" type="hidden" value={initial.id} />
          <input name="version" type="hidden" value={initial.version} />
        </>
      ) : null}
      <div className="grid gap-5 md:grid-cols-2">
        <Field label="Cabang">
          <select
            className={inputClass}
            defaultValue={initial?.branchId}
            name="branchId"
            required
          >
            <option value="">Pilih…</option>
            {branches.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label={kind === "customer" ? "Pelanggan" : "Pemasok"}>
          <select
            className={inputClass}
            name="contactId"
            onChange={(event) => {
              setContactId(event.target.value);
              setAmounts({});
            }}
            required
            value={contactId}
          >
            <option value="">Pilih…</option>
            {contacts.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Akun bank/kas">
          <select
            className={inputClass}
            defaultValue={initial?.bankAccountId}
            name="bankAccountId"
            required
          >
            <option value="">Pilih…</option>
            {banks.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </Field>
        <Field
          label={
            kind === "customer" ? "Tanggal penerimaan" : "Tanggal pembayaran"
          }
        >
          <input
            className={inputClass}
            defaultValue={initial?.settlementDate ?? defaultDate}
            name="settlementDate"
            required
            type="date"
          />
        </Field>
      </div>
      <section>
        <h2 className="mb-3 font-semibold text-gray-900 dark:text-white">
          Alokasi {kind === "customer" ? "Piutang" : "Utang"}
        </h2>
        {!contactId ? (
          <p className="rounded-xl bg-gray-50 p-4 text-sm text-gray-500 dark:bg-gray-800">
            Pilih kontak untuk menampilkan dokumen terbuka.
          </p>
        ) : visibleItems.length === 0 ? (
          <p className="rounded-xl bg-gray-50 p-4 text-sm text-gray-500 dark:bg-gray-800">
            Tidak ada saldo terbuka untuk kontak ini.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-gray-500 uppercase">
                  <th className="py-3">Dokumen</th>
                  <th>Tanggal</th>
                  <th>Jatuh tempo</th>
                  <th className="text-right">Sisa</th>
                  <th className="w-48 text-right">Alokasi</th>
                </tr>
              </thead>
              <tbody>
                {visibleItems.map((item) => (
                  <tr
                    className="border-b border-gray-100 dark:border-gray-800"
                    key={item.value}
                  >
                    <td className="py-3 font-medium">{item.documentNumber}</td>
                    <td>{item.documentDate}</td>
                    <td>{item.dueDate}</td>
                    <td className="text-right">
                      {formatIDR(item.outstanding)}
                    </td>
                    <td>
                      <input
                        aria-label={`Alokasi ${item.documentNumber}`}
                        className={`${inputClass} text-right`}
                        max={item.outstanding}
                        min="0"
                        onChange={(event) =>
                          setAmounts((current) => ({
                            ...current,
                            [item.value]: event.target.value,
                          }))
                        }
                        step="0.0001"
                        type="number"
                        value={amounts[item.value] ?? "0"}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      <Field label="Catatan">
        <textarea
          className={`${inputClass} min-h-24 py-3`}
          defaultValue={initial?.notes ?? ""}
          name="notes"
        />
      </Field>
      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-gray-100 pt-5 dark:border-gray-800">
        <p className="text-sm text-gray-500">
          Total alokasi:{" "}
          <strong className="text-gray-900 dark:text-white">
            {formatIDR(String(total))}
          </strong>
        </p>
        <div className="flex gap-3">
          <Link
            className="rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 dark:border-gray-700 dark:text-gray-300"
            href={cancelHref}
          >
            Batal
          </Link>
          <button
            className="bg-brand-500 rounded-xl px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
            disabled={pending || allocations.length === 0}
            type="submit"
          >
            {pending ? "Menyimpan…" : "Simpan draft"}
          </button>
        </div>
      </div>
      {state.status === "error" ? (
        <p
          className="border-error-200 bg-error-50 text-error-700 rounded-xl border px-4 py-3 text-sm"
          role="alert"
        >
          {state.error.message}
        </p>
      ) : null}
    </form>
  );
}
function Field({
  children,
  label,
}: {
  children: React.ReactNode;
  label: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
      </span>
      {children}
    </label>
  );
}
