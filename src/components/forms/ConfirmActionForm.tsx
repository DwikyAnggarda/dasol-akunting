"use client";

import { useActionState } from "react";

import {
  initialMutationState,
  type MutationState,
} from "@/features/shared/mutation-state";

type Props = {
  action: (state: MutationState, formData: FormData) => Promise<MutationState>;
  confirmMessage: string;
  fields: Record<string, string>;
  label: string;
  tone?: "danger" | "neutral" | "primary";
};

export function ConfirmActionForm({
  action,
  confirmMessage,
  fields,
  label,
  tone = "neutral",
}: Props) {
  const [state, formAction, pending] = useActionState(
    action,
    initialMutationState,
  );
  const toneClass =
    tone === "danger"
      ? "border-error-200 text-error-700 hover:bg-error-50"
      : tone === "primary"
        ? "border-brand-500 bg-brand-500 text-white hover:bg-brand-600"
        : "border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300";

  return (
    <form
      action={formAction}
      className="inline-flex flex-col items-end gap-1"
      onSubmit={(event) => {
        if (!window.confirm(confirmMessage)) event.preventDefault();
      }}
    >
      {Object.entries(fields).map(([name, value]) => (
        <input key={name} name={name} type="hidden" value={value} />
      ))}
      <button
        className={`rounded-lg border px-3 py-1.5 text-xs font-semibold disabled:opacity-50 ${toneClass}`}
        disabled={pending}
        type="submit"
      >
        {pending ? "Memproses…" : label}
      </button>
      {state.status === "error" ? (
        <span
          className="text-error-600 max-w-56 text-right text-xs"
          role="alert"
        >
          {state.error.message}
        </span>
      ) : null}
    </form>
  );
}
