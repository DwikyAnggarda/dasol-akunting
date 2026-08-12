"use client";

import { useActionState } from "react";

import { initialMutationState } from "@/features/shared/mutation-state";

import { saveAccountMappingsAction } from "./access-actions";
import { ACCOUNT_MAPPING_DEFINITIONS } from "./constants";

export function AccountMappingForm({
  accounts,
  mappings,
}: {
  accounts: { code: string; id: string; name: string }[];
  mappings: Record<string, string>;
}) {
  const [state, action, pending] = useActionState(
    saveAccountMappingsAction,
    initialMutationState,
  );
  return (
    <form action={action} className="space-y-6">
      <div className="grid gap-5 md:grid-cols-2">
        {ACCOUNT_MAPPING_DEFINITIONS.map(([code, label]) => (
          <label
            className="text-sm font-medium text-gray-700 dark:text-gray-300"
            key={code}
          >
            {label} <span className="text-error-500">*</span>
            <select
              className="mt-2 h-11 w-full rounded-xl border border-gray-300 bg-white px-3.5 text-sm dark:border-gray-700 dark:bg-gray-900"
              defaultValue={mappings[code] ?? ""}
              name={`mapping:${code}`}
              required
            >
              <option value="">Pilih akun…</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.code} — {account.name}
                </option>
              ))}
            </select>
          </label>
        ))}
      </div>
      {state.status === "error" ? (
        <p
          className="border-error-200 bg-error-50 text-error-700 rounded-xl border p-3 text-sm"
          role="alert"
        >
          {state.error.message}
        </p>
      ) : null}
      <div className="flex justify-end border-t border-gray-100 pt-5 dark:border-gray-800">
        <button
          className="bg-brand-500 rounded-xl px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          disabled={pending}
          type="submit"
        >
          {pending ? "Menyimpan…" : "Simpan pemetaan"}
        </button>
      </div>
    </form>
  );
}
