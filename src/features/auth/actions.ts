"use server";

import { redirect } from "next/navigation";

import { publicEnvironment } from "@/config/env";
import { createClient } from "@/lib/supabase/server";

import {
  forgotPasswordSchema,
  loginSchema,
  resetPasswordSchema,
} from "./schemas";
import type { AuthActionState } from "./state";

function invalidInput(message: string): AuthActionState {
  return { message, status: "error" };
}

export async function loginAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return invalidInput(
      parsed.error.issues[0]?.message ?? "Data login tidak valid.",
    );
  }

  let supabase;
  try {
    supabase = await createClient();
  } catch {
    return invalidInput("Supabase belum dikonfigurasi untuk lingkungan ini.");
  }

  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    return invalidInput("Email atau kata sandi tidak sesuai.");
  }

  redirect("/select-company");
}

export async function forgotPasswordAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = forgotPasswordSchema.safeParse({
    email: formData.get("email"),
  });
  if (!parsed.success) {
    return invalidInput(
      parsed.error.issues[0]?.message ?? "Email tidak valid.",
    );
  }

  let supabase;
  try {
    supabase = await createClient();
  } catch {
    return invalidInput("Supabase belum dikonfigurasi untuk lingkungan ini.");
  }

  const appUrl = publicEnvironment.NEXT_PUBLIC_APP_URL;
  const { error } = await supabase.auth.resetPasswordForEmail(
    parsed.data.email,
    {
      redirectTo: appUrl
        ? `${appUrl}/auth/callback?next=/reset-password`
        : undefined,
    },
  );

  if (error) {
    return invalidInput(
      "Permintaan belum dapat diproses. Coba lagi beberapa saat.",
    );
  }

  return {
    message:
      "Jika email terdaftar, instruksi penggantian kata sandi telah dikirim.",
    status: "success",
  };
}

export async function resetPasswordAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = resetPasswordSchema.safeParse({
    confirmPassword: formData.get("confirmPassword"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return invalidInput(
      parsed.error.issues[0]?.message ?? "Kata sandi baru tidak valid.",
    );
  }

  let supabase;
  try {
    supabase = await createClient();
  } catch {
    return invalidInput("Supabase belum dikonfigurasi untuk lingkungan ini.");
  }

  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });
  if (error) {
    return invalidInput("Tautan pemulihan tidak valid atau sudah kedaluwarsa.");
  }

  return {
    message: "Kata sandi berhasil diperbarui. Anda dapat kembali ke Dasbor.",
    status: "success",
  };
}
