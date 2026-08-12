"use client";

import Link from "next/link";
import { useActionState } from "react";

import { initialMutationState } from "@/features/shared/mutation-state";

import { saveRoleAction } from "./access-actions";

type Props = {
  role?: {
    code: string;
    id: string;
    is_system: boolean;
    name: string;
    permissions: string[];
    version: number;
  };
  permissions: { code: string; description: string }[];
};

export function RoleForm({ permissions, role }: Props) {
  const [state, action, pending] = useActionState(
    saveRoleAction,
    initialMutationState,
  );
  const fieldClass =
    "h-11 w-full rounded-xl border border-gray-300 bg-white px-3.5 text-sm text-gray-900 outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white";
  return (
    <form action={action} className="space-y-6">
      <input name="id" type="hidden" value={role?.id ?? ""} />
      <input name="version" type="hidden" value={role?.version ?? ""} />
      <div className="grid gap-5 md:grid-cols-2">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Kode role <span className="text-error-500">*</span>
          <input
            className={`${fieldClass} mt-2`}
            defaultValue={role?.code}
            disabled={role?.is_system}
            name="code"
            pattern="[a-z][a-z0-9_-]+"
            required
          />
        </label>
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Nama role <span className="text-error-500">*</span>
          <input
            className={`${fieldClass} mt-2`}
            defaultValue={role?.name}
            disabled={role?.is_system}
            name="name"
            required
          />
        </label>
      </div>
      <fieldset disabled={role?.is_system}>
        <legend className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">
          Permission matrix
        </legend>
        <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
          {permissions.map((permission) => (
            <label
              className="flex items-start gap-3 rounded-xl border border-gray-200 p-3 dark:border-gray-800"
              key={permission.code}
            >
              <input
                className="text-brand-600 mt-0.5 size-4 rounded border-gray-300"
                defaultChecked={role?.permissions.includes(permission.code)}
                name="permissions"
                type="checkbox"
                value={permission.code}
              />
              <span>
                <span className="block text-sm font-medium text-gray-800 dark:text-gray-200">
                  {permission.code}
                </span>
                <span className="block text-xs text-gray-500">
                  {permission.description}
                </span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>
      {state.status === "error" ? (
        <p
          className="border-error-200 bg-error-50 text-error-700 rounded-xl border p-3 text-sm"
          role="alert"
        >
          {state.error.message}
        </p>
      ) : null}
      <div className="flex justify-end gap-3 border-t border-gray-100 pt-5 dark:border-gray-800">
        <Link
          className="rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-semibold"
          href="/settings/roles"
        >
          Batal
        </Link>
        {!role?.is_system ? (
          <button
            className="bg-brand-500 rounded-xl px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
            disabled={pending}
            type="submit"
          >
            {pending ? "Menyimpan…" : "Simpan role"}
          </button>
        ) : null}
      </div>
    </form>
  );
}
