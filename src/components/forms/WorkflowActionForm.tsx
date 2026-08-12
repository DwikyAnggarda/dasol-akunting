"use client";

import { useActionState } from "react";

import {
  initialMutationState,
  type MutationState,
} from "@/features/shared/mutation-state";

export function WorkflowActionForm({
  action,
  confirmMessage,
  fields,
  label,
  requireComment = false,
  tone = "primary",
}: {
  action: (state: MutationState, formData: FormData) => Promise<MutationState>;
  confirmMessage: string;
  fields: Record<string, string>;
  label: string;
  requireComment?: boolean;
  tone?: "danger" | "primary";
}) {
  const [state, formAction, pending] = useActionState(
    action,
    initialMutationState,
  );
  return (
    <form
      action={formAction}
      className="space-y-2"
      onSubmit={(event) => {
        if (!window.confirm(confirmMessage)) event.preventDefault();
      }}
    >
      {Object.entries(fields).map(([name, value]) => (
        <input key={name} name={name} type="hidden" value={value} />
      ))}
      <textarea
        className="min-h-20 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
        name="comment"
        placeholder={
          requireComment ? "Alasan wajib diisi…" : "Komentar (opsional)…"
        }
        required={requireComment}
      />
      <button
        className={`rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 ${tone === "danger" ? "bg-error-600 hover:bg-error-700" : "bg-brand-500 hover:bg-brand-600"}`}
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
