"use client";
import { useActionState } from "react";
import {
  initialMutationState,
  type MutationState,
} from "@/features/shared/mutation-state";
export function ReversalForm({
  action,
  fields,
  label = "Reverse pembayaran",
  today,
}: {
  action: (state: MutationState, formData: FormData) => Promise<MutationState>;
  fields: Record<string, string>;
  label?: string;
  today: string;
}) {
  const [state, formAction, pending] = useActionState(
    action,
    initialMutationState,
  );
  return (
    <form
      action={formAction}
      className="space-y-3"
      onSubmit={(event) => {
        if (
          !window.confirm(
            "Reversal akan membuat jurnal pembalik dan mengembalikan saldo subledger. Lanjutkan?",
          )
        )
          event.preventDefault();
      }}
    >
      {Object.entries(fields).map(([name, value]) => (
        <input key={name} name={name} type="hidden" value={value} />
      ))}
      <label className="block text-sm font-medium">
        Tanggal reversal
        <input
          className="mt-2 h-10 w-full rounded-lg border border-gray-300 px-3 dark:border-gray-700 dark:bg-gray-900"
          defaultValue={today}
          name="reversalDate"
          required
          type="date"
        />
      </label>
      <label className="block text-sm font-medium">
        Alasan
        <textarea
          className="mt-2 min-h-20 w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-900"
          minLength={5}
          name="reason"
          required
        />
      </label>
      <button
        className="bg-error-600 rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        disabled={pending}
        type="submit"
      >
        {pending ? "Memproses…" : label}
      </button>
      {state.status === "error" ? (
        <p className="text-error-600 text-xs" role="alert">
          {state.error.message}
        </p>
      ) : null}
    </form>
  );
}
