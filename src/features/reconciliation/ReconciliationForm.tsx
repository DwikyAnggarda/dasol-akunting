"use client";
import Link from "next/link";
import { useActionState, useState } from "react";
import {
  initialMutationState,
  type MutationState,
} from "@/features/shared/mutation-state";
type Line = {
  amount: number;
  description: string;
  reference?: string;
  transactionDate: string;
};
function parseRow(row: string) {
  const cells: string[] = [];
  let value = "",
    quoted = false;
  for (let i = 0; i < row.length; i += 1) {
    const char = row[i];
    if (char === '"' && row[i + 1] === '"' && quoted) {
      value += '"';
      i += 1;
    } else if (char === '"') quoted = !quoted;
    else if (char === "," && !quoted) {
      cells.push(value.trim());
      value = "";
    } else value += char;
  }
  cells.push(value.trim());
  return cells;
}
function parseCsv(text: string): Line[] {
  const rows = text
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .filter(Boolean);
  if (rows.length < 2)
    throw new Error("CSV harus memiliki header dan minimal satu baris.");
  const header = parseRow(rows[0]).map((cell) => cell.toLowerCase());
  const indexes = {
    date: header.indexOf("date"),
    description: header.indexOf("description"),
    reference: header.indexOf("reference"),
    amount: header.indexOf("amount"),
  };
  if (indexes.date < 0 || indexes.description < 0 || indexes.amount < 0)
    throw new Error("Header wajib: date,description,reference,amount.");
  return rows.slice(1).map((row, index) => {
    const cells = parseRow(row),
      amount = Number(cells[indexes.amount]);
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(cells[indexes.date]) ||
      !Number.isFinite(amount) ||
      amount === 0 ||
      cells[indexes.description].length < 2
    )
      throw new Error(`Baris ${index + 2} tidak valid.`);
    return {
      amount,
      description: cells[indexes.description],
      reference: indexes.reference >= 0 ? cells[indexes.reference] : "",
      transactionDate: cells[indexes.date],
    };
  });
}
export function ReconciliationForm({
  action,
  banks,
  today,
}: {
  action: (state: MutationState, data: FormData) => Promise<MutationState>;
  banks: { label: string; value: string }[];
  today: string;
}) {
  const [state, formAction, pending] = useActionState(
      action,
      initialMutationState,
    ),
    [lines, setLines] = useState<Line[]>([]),
    [parseError, setParseError] = useState("");
  const input =
    "h-11 w-full rounded-xl border border-gray-300 bg-white px-3.5 text-sm dark:border-gray-700 dark:bg-gray-900";
  return (
    <form action={formAction} className="space-y-6">
      <input name="lines" type="hidden" value={JSON.stringify(lines)} />
      <div className="grid gap-5 md:grid-cols-2">
        <label className="text-sm font-medium">
          Akun bank
          <select className={`${input} mt-2`} name="bankAccountId" required>
            <option value="">Pilih akun…</option>
            {banks.map((bank) => (
              <option key={bank.value} value={bank.value}>
                {bank.label}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm font-medium">
          Tanggal statement
          <input
            className={`${input} mt-2`}
            defaultValue={today}
            name="statementDate"
            required
            type="date"
          />
        </label>
        <label className="text-sm font-medium">
          Saldo pembukaan
          <input
            className={`${input} mt-2 text-right`}
            name="openingBalance"
            required
            step="0.0001"
            type="number"
          />
        </label>
        <label className="text-sm font-medium">
          Saldo penutupan
          <input
            className={`${input} mt-2 text-right`}
            name="closingBalance"
            required
            step="0.0001"
            type="number"
          />
        </label>
        <label className="text-sm font-medium md:col-span-2">
          CSV statement
          <input
            accept=".csv,text/csv"
            className={`${input} mt-2 pt-2`}
            onChange={async (event) => {
              try {
                const file = event.target.files?.[0];
                if (!file) return;
                const parsed = parseCsv(await file.text());
                setLines(parsed);
                setParseError("");
              } catch (error) {
                setLines([]);
                setParseError(
                  error instanceof Error ? error.message : "CSV tidak valid.",
                );
              }
            }}
            required
            type="file"
          />
          <span className="mt-1 block text-xs text-gray-500">
            Format: date,description,reference,amount. Kredit masuk positif,
            debit keluar negatif.
          </span>
        </label>
      </div>
      {parseError ? (
        <p className="text-error-600 text-sm" role="alert">
          {parseError}
        </p>
      ) : null}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[600px] text-sm">
          <thead>
            <tr className="border-b">
              <th className="py-2 text-left">Tanggal</th>
              <th className="text-left">Deskripsi</th>
              <th>Referensi</th>
              <th className="text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {lines.slice(0, 100).map((line, index) => (
              <tr className="border-b" key={`${line.transactionDate}-${index}`}>
                <td className="py-2">{line.transactionDate}</td>
                <td>{line.description}</td>
                <td>{line.reference}</td>
                <td className="text-right">{line.amount}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {lines.length > 100 ? (
          <p className="mt-2 text-xs text-gray-500">
            Preview 100 dari {lines.length} baris.
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
      <div className="flex justify-end gap-3">
        <Link
          className="rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-semibold"
          href="/cash-bank/reconciliations"
        >
          Batal
        </Link>
        <button
          className="bg-brand-500 rounded-xl px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          disabled={pending || lines.length === 0}
          type="submit"
        >
          {pending ? "Mengimpor…" : "Import statement"}
        </button>
      </div>
    </form>
  );
}
