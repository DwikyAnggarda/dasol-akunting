"use client";
import { useActionState } from "react";
import { initialMutationState } from "@/features/shared/mutation-state";
import {
  adjustStatementAction,
  matchStatementAction,
  unmatchStatementAction,
} from "./actions";
type Option = { label: string; value: string };
const selectClass =
  "h-9 rounded-lg border border-gray-300 bg-white px-2 text-xs dark:border-gray-700 dark:bg-gray-900";
export function MatchLineForm({
  candidates,
  lineId,
  reconciliationId,
}: {
  candidates: Option[];
  lineId: string;
  reconciliationId: string;
}) {
  const [state, action, pending] = useActionState(
    matchStatementAction,
    initialMutationState,
  );
  return (
    <form action={action} className="space-y-2">
      <input name="lineId" type="hidden" value={lineId} />
      <input name="reconciliationId" type="hidden" value={reconciliationId} />
      <div className="flex gap-2">
        <select
          aria-label="Transaksi cocok"
          className={`${selectClass} max-w-56`}
          name="candidate"
          required
        >
          <option value="">Pilih transaksi…</option>
          {candidates.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
        <button
          className="bg-brand-500 rounded-lg px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
          disabled={pending}
          type="submit"
        >
          Match
        </button>
      </div>
      {state.status === "error" ? (
        <p className="text-error-600 max-w-72 text-xs">{state.error.message}</p>
      ) : null}
    </form>
  );
}
export function AdjustmentLineForm({
  accounts,
  lineId,
  reconciliationId,
}: {
  accounts: Option[];
  lineId: string;
  reconciliationId: string;
}) {
  const [state, action, pending] = useActionState(
    adjustStatementAction,
    initialMutationState,
  );
  return (
    <details>
      <summary className="text-brand-600 cursor-pointer text-xs font-semibold">
        Buat adjustment
      </summary>
      <form action={action} className="mt-2 grid gap-2">
        <input name="lineId" type="hidden" value={lineId} />
        <input name="reconciliationId" type="hidden" value={reconciliationId} />
        <select
          aria-label="Akun adjustment"
          className={selectClass}
          name="offsetAccountId"
          required
        >
          <option value="">Pilih akun lawan…</option>
          {accounts.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
        <input
          aria-label="Keterangan adjustment"
          className={selectClass}
          minLength={5}
          name="description"
          placeholder="Keterangan adjustment"
          required
        />
        <button
          className="rounded-lg border border-gray-300 px-3 py-2 text-xs font-semibold disabled:opacity-50"
          disabled={pending}
          type="submit"
        >
          Posting adjustment
        </button>
        {state.status === "error" ? (
          <p className="text-error-600 max-w-72 text-xs">
            {state.error.message}
          </p>
        ) : null}
      </form>
    </details>
  );
}
export function UnmatchLineForm({
  lineId,
  reconciliationId,
}: {
  lineId: string;
  reconciliationId: string;
}) {
  const [, action, pending] = useActionState(
    unmatchStatementAction,
    initialMutationState,
  );
  return (
    <form action={action}>
      <input name="lineId" type="hidden" value={lineId} />
      <input name="reconciliationId" type="hidden" value={reconciliationId} />
      <button
        className="text-error-600 text-xs font-semibold disabled:opacity-50"
        disabled={pending}
        type="submit"
      >
        Unmatch
      </button>
    </form>
  );
}
