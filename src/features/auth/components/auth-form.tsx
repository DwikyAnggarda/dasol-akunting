"use client";

import Link from "next/link";
import { useActionState } from "react";

import {
  forgotPasswordAction,
  initialAuthActionState,
  loginAction,
  resetPasswordAction,
  type AuthActionState,
} from "@/features/auth/actions";

type AuthMode = "forgot" | "login" | "reset";

const actions: Record<
  AuthMode,
  (state: AuthActionState, formData: FormData) => Promise<AuthActionState>
> = {
  forgot: forgotPasswordAction,
  login: loginAction,
  reset: resetPasswordAction,
};

const content: Record<
  AuthMode,
  { description: string; submit: string; title: string }
> = {
  forgot: {
    description: "Kami akan mengirim instruksi pemulihan ke email terdaftar.",
    submit: "Kirim instruksi",
    title: "Lupa kata sandi",
  },
  login: {
    description: "Masuk untuk mengelola pembukuan perusahaan Anda.",
    submit: "Masuk ke Dasol",
    title: "Selamat datang kembali",
  },
  reset: {
    description: "Gunakan kata sandi baru yang unik dan sulit ditebak.",
    submit: "Simpan kata sandi",
    title: "Buat kata sandi baru",
  },
};

export function AuthForm({ mode }: { mode: AuthMode }) {
  const [state, formAction, pending] = useActionState(
    actions[mode],
    initialAuthActionState,
  );
  const copy = content[mode];

  return (
    <div className="w-full max-w-md">
      <div className="mb-8">
        <div className="mb-5 inline-flex items-center gap-3">
          <span className="bg-brand-500 shadow-theme-md grid size-11 place-items-center rounded-2xl text-xl font-bold text-white">
            D
          </span>
          <span className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">
            Dasol
          </span>
        </div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          {copy.title}
        </h1>
        <p className="mt-2 text-sm leading-6 text-gray-500 dark:text-gray-400">
          {copy.description}
        </p>
      </div>

      <form action={formAction} className="space-y-5">
        {mode !== "reset" ? (
          <div>
            <label
              className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
              htmlFor="email"
            >
              Email
            </label>
            <input
              autoComplete="email"
              autoFocus
              className="focus:border-brand-500 focus:ring-brand-500/10 h-12 w-full rounded-xl border border-gray-300 bg-transparent px-4 text-sm text-gray-900 transition outline-none focus:ring-3 dark:border-gray-700 dark:text-white"
              id="email"
              name="email"
              placeholder="nama@perusahaan.co.id"
              required
              type="email"
            />
          </div>
        ) : null}

        {mode !== "forgot" ? (
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                htmlFor="password"
              >
                {mode === "reset" ? "Kata sandi baru" : "Kata sandi"}
              </label>
              {mode === "login" ? (
                <Link
                  className="text-brand-600 hover:text-brand-700 text-sm font-medium"
                  href="/forgot-password"
                >
                  Lupa kata sandi?
                </Link>
              ) : null}
            </div>
            <input
              autoComplete={
                mode === "login" ? "current-password" : "new-password"
              }
              className="focus:border-brand-500 focus:ring-brand-500/10 h-12 w-full rounded-xl border border-gray-300 bg-transparent px-4 text-sm text-gray-900 transition outline-none focus:ring-3 dark:border-gray-700 dark:text-white"
              id="password"
              minLength={mode === "login" ? 8 : 12}
              name="password"
              required
              type="password"
            />
          </div>
        ) : null}

        {mode === "reset" ? (
          <div>
            <label
              className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
              htmlFor="confirmPassword"
            >
              Ulangi kata sandi baru
            </label>
            <input
              autoComplete="new-password"
              className="focus:border-brand-500 focus:ring-brand-500/10 h-12 w-full rounded-xl border border-gray-300 bg-transparent px-4 text-sm text-gray-900 transition outline-none focus:ring-3 dark:border-gray-700 dark:text-white"
              id="confirmPassword"
              minLength={12}
              name="confirmPassword"
              required
              type="password"
            />
          </div>
        ) : null}

        {state.status !== "idle" ? (
          <div
            aria-live="polite"
            className={`rounded-xl border px-4 py-3 text-sm ${
              state.status === "success"
                ? "border-success-200 bg-success-50 text-success-700 dark:border-success-900 dark:bg-success-950/30 dark:text-success-300"
                : "border-error-200 bg-error-50 text-error-700 dark:border-error-900 dark:bg-error-950/30 dark:text-error-300"
            }`}
            role="status"
          >
            {state.message}
          </div>
        ) : null}

        <button
          className="bg-brand-500 hover:bg-brand-600 flex h-12 w-full items-center justify-center rounded-xl px-4 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60"
          disabled={pending}
          type="submit"
        >
          {pending ? "Memproses…" : copy.submit}
        </button>
      </form>

      {mode !== "login" ? (
        <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
          <Link
            className="text-brand-600 hover:text-brand-700 font-medium"
            href="/login"
          >
            Kembali ke halaman masuk
          </Link>
        </p>
      ) : null}
    </div>
  );
}
