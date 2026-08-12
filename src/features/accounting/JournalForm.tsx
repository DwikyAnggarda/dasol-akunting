"use client";
import Link from "next/link";
import { useActionState, useState } from "react";
import { formatIDR } from "@/domain/money";
import {
  initialMutationState,
  type MutationState,
} from "@/features/shared/mutation-state";
type Option = { label: string; value: string };
type Line = {
  accountId: string;
  credit: string;
  debit: string;
  description: string;
};
const empty = (): Line => ({
  accountId: "",
  credit: "0",
  debit: "0",
  description: "",
});
export function JournalForm({
  accounts,
  action,
  branches,
  today,
}: {
  accounts: Option[];
  action: (state: MutationState, formData: FormData) => Promise<MutationState>;
  branches: Option[];
  today: string;
}) {
  const [state, formAction, pending] = useActionState(
    action,
    initialMutationState,
  );
  const [lines, setLines] = useState<Line[]>([empty(), empty()]);
  const update = (index: number, patch: Partial<Line>) =>
    setLines((current) =>
      current.map((line, i) => (i === index ? { ...line, ...patch } : line)),
    );
  const debit = lines.reduce((sum, line) => sum + Number(line.debit || 0), 0),
    credit = lines.reduce((sum, line) => sum + Number(line.credit || 0), 0);
  const input =
    "h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm dark:border-gray-700 dark:bg-gray-900";
  return (
    <form action={formAction} className="space-y-6">
      <input name="lines" type="hidden" value={JSON.stringify(lines)} />
      <div className="grid gap-5 md:grid-cols-3">
        <label className="text-sm font-medium">
          Tanggal posting
          <input
            className={`${input} mt-2`}
            defaultValue={today}
            name="postingDate"
            required
            type="date"
          />
        </label>
        <label className="text-sm font-medium">
          Cabang
          <select className={`${input} mt-2`} name="branchId">
            <option value="">Tanpa cabang</option>
            {branches.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm font-medium md:col-span-3">
          Keterangan
          <input className={`${input} mt-2`} name="description" required />
        </label>
      </div>
      <div>
        <div className="mb-3 flex justify-between">
          <h2 className="font-semibold">Baris Jurnal</h2>
          <button
            className="border-brand-300 text-brand-600 rounded-lg border px-3 py-1 text-xs font-semibold"
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
                aria-label={`Akun baris ${index + 1}`}
                className={`${input} md:col-span-4`}
                onChange={(event) =>
                  update(index, { accountId: event.target.value })
                }
                required
                value={line.accountId}
              >
                <option value="">Pilih akun…</option>
                {accounts.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
              <input
                aria-label={`Deskripsi baris ${index + 1}`}
                className={`${input} md:col-span-3`}
                onChange={(event) =>
                  update(index, { description: event.target.value })
                }
                placeholder="Deskripsi"
                value={line.description}
              />
              <input
                aria-label={`Debit baris ${index + 1}`}
                className={`${input} text-right md:col-span-2`}
                min="0"
                onChange={(event) =>
                  update(index, {
                    debit: event.target.value,
                    credit: Number(event.target.value) > 0 ? "0" : line.credit,
                  })
                }
                step="0.0001"
                type="number"
                value={line.debit}
              />
              <input
                aria-label={`Kredit baris ${index + 1}`}
                className={`${input} text-right md:col-span-2`}
                min="0"
                onChange={(event) =>
                  update(index, {
                    credit: event.target.value,
                    debit: Number(event.target.value) > 0 ? "0" : line.debit,
                  })
                }
                step="0.0001"
                type="number"
                value={line.credit}
              />
              <button
                className="text-error-600 text-xs font-semibold disabled:opacity-40"
                disabled={lines.length === 2}
                onClick={() =>
                  setLines((current) => current.filter((_, i) => i !== index))
                }
                type="button"
              >
                Hapus
              </button>
            </div>
          ))}
        </div>
      </div>
      <div className="flex flex-wrap justify-between gap-4 border-t pt-5">
        <p
          className={
            Math.abs(debit - credit) < 0.0001 && debit > 0
              ? "text-success-600"
              : "text-error-600"
          }
        >
          Debit {formatIDR(String(debit))} · Kredit {formatIDR(String(credit))}
        </p>
        <div className="flex gap-3">
          <Link
            className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold"
            href="/accounting/journals"
          >
            Batal
          </Link>
          <button
            className="bg-brand-500 rounded-xl px-5 py-2 text-sm font-semibold text-white disabled:opacity-50"
            disabled={
              pending || debit <= 0 || Math.abs(debit - credit) > 0.0001
            }
            type="submit"
          >
            {pending ? "Memposting…" : "Posting jurnal"}
          </button>
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
    </form>
  );
}
