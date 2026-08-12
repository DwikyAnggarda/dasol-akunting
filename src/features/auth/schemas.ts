import { z } from "zod";

export const loginSchema = z.object({
  email: z.email("Masukkan alamat email yang valid."),
  password: z.string().min(8, "Kata sandi minimal 8 karakter."),
});

export const forgotPasswordSchema = z.object({
  email: z.email("Masukkan alamat email yang valid."),
});

export const resetPasswordSchema = z
  .object({
    confirmPassword: z.string(),
    password: z.string().min(12, "Kata sandi minimal 12 karakter."),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Konfirmasi kata sandi tidak sama.",
    path: ["confirmPassword"],
  });
