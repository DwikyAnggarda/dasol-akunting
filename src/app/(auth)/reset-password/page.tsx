import type { Metadata } from "next";

import { AuthForm } from "@/features/auth/components/auth-form";

export const metadata: Metadata = { title: "Atur ulang kata sandi" };

export default function ResetPasswordPage() {
  return <AuthForm mode="reset" />;
}
