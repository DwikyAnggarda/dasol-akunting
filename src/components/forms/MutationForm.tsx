"use client";

import Link from "next/link";
import { useActionState } from "react";

import {
  initialMutationState,
  type MutationState,
} from "@/features/shared/mutation-state";

export type MutationField = {
  autoComplete?: string;
  defaultValue?: boolean | number | string | null;
  description?: string;
  label: string;
  name: string;
  options?: { label: string; value: string }[];
  placeholder?: string;
  required?: boolean;
  step?: string;
  type?:
    "checkbox" | "date" | "email" | "number" | "select" | "textarea" | "text";
};

type MutationFormProps = {
  action: (state: MutationState, formData: FormData) => Promise<MutationState>;
  cancelHref: string;
  fields: MutationField[];
  hidden?: Record<string, string>;
  submitLabel?: string;
};

export function MutationForm({
  action,
  cancelHref,
  fields,
  hidden,
  submitLabel = "Simpan",
}: MutationFormProps) {
  const [state, formAction, pending] = useActionState(
    action,
    initialMutationState,
  );

  return (
    <form action={formAction} className="space-y-6">
      {Object.entries(hidden ?? {}).map(([name, value]) => (
        <input key={name} name={name} type="hidden" value={value} />
      ))}
      <div className="grid gap-5 md:grid-cols-2">
        {fields.map((field) => {
          const error =
            state.status === "error"
              ? state.error.fieldErrors?.[field.name]?.[0]
              : undefined;
          const id = `field-${field.name}`;
          const inputClass =
            "h-11 w-full rounded-xl border border-gray-300 bg-white px-3.5 text-sm text-gray-900 outline-none transition focus:border-brand-500 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white";

          return (
            <div
              className={field.type === "textarea" ? "md:col-span-2" : ""}
              key={field.name}
            >
              {field.type === "checkbox" ? (
                <label className="flex min-h-11 items-center gap-3 rounded-xl border border-gray-200 px-4 dark:border-gray-800">
                  <input
                    className="text-brand-600 size-4 rounded border-gray-300"
                    defaultChecked={Boolean(field.defaultValue)}
                    name={field.name}
                    type="checkbox"
                    value="true"
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {field.label}
                  </span>
                </label>
              ) : (
                <>
                  <label
                    className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                    htmlFor={id}
                  >
                    {field.label}
                    {field.required ? (
                      <span className="text-error-500 ml-1">*</span>
                    ) : null}
                  </label>
                  {field.type === "select" ? (
                    <select
                      className={inputClass}
                      defaultValue={String(field.defaultValue ?? "")}
                      id={id}
                      name={field.name}
                      required={field.required}
                    >
                      <option value="">Pilih…</option>
                      {field.options?.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  ) : field.type === "textarea" ? (
                    <textarea
                      className={`${inputClass} min-h-28 py-3`}
                      defaultValue={String(field.defaultValue ?? "")}
                      id={id}
                      name={field.name}
                      placeholder={field.placeholder}
                      required={field.required}
                    />
                  ) : (
                    <input
                      autoComplete={field.autoComplete}
                      className={inputClass}
                      defaultValue={String(field.defaultValue ?? "")}
                      id={id}
                      name={field.name}
                      placeholder={field.placeholder}
                      required={field.required}
                      step={field.step}
                      type={field.type ?? "text"}
                    />
                  )}
                </>
              )}
              {field.description ? (
                <p className="mt-1.5 text-xs text-gray-500">
                  {field.description}
                </p>
              ) : null}
              {error ? (
                <p className="text-error-600 mt-1.5 text-xs" role="alert">
                  {error}
                </p>
              ) : null}
            </div>
          );
        })}
      </div>

      {state.status === "error" ? (
        <p
          className="border-error-200 bg-error-50 text-error-700 rounded-xl border px-4 py-3 text-sm"
          role="alert"
        >
          {state.error.message}
        </p>
      ) : null}

      <div className="flex flex-wrap justify-end gap-3 border-t border-gray-100 pt-5 dark:border-gray-800">
        <Link
          className="rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300"
          href={cancelHref}
        >
          Batal
        </Link>
        <button
          className="bg-brand-500 hover:bg-brand-600 rounded-xl px-5 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
          disabled={pending}
          type="submit"
        >
          {pending ? "Menyimpan…" : submitLabel}
        </button>
      </div>
    </form>
  );
}
