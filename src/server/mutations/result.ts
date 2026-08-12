import type { PostgrestError } from "@supabase/supabase-js";
import type { ZodError } from "zod";

import type { MutationState } from "@/features/shared/mutation-state";

export function validationFailure(error: ZodError): MutationState {
  const fieldErrors: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const field = issue.path[0]?.toString() ?? "form";
    fieldErrors[field] = [...(fieldErrors[field] ?? []), issue.message];
  }
  return {
    error: {
      code: "VALIDATION_ERROR",
      fieldErrors,
      message: "Periksa kembali field yang ditandai.",
    },
    status: "error",
  };
}

export function databaseFailure(
  error: PostgrestError,
  fallback: string,
): MutationState {
  const messages: Record<string, string> = {
    "23505": "Kode atau nilai unik tersebut sudah digunakan.",
    "23514": error.message,
    "42501": "Anda tidak memiliki izin untuk melakukan perubahan ini.",
    PGRST116: "Data berubah atau tidak lagi tersedia. Muat ulang halaman.",
  };
  console.error("Database mutation failed", {
    code: error.code,
    details: error.details,
    hint: error.hint,
    message: error.message,
  });
  return {
    error: {
      code: error.code || "DATABASE_ERROR",
      message: messages[error.code] ?? fallback,
    },
    status: "error",
  };
}

export function conflictFailure(): MutationState {
  return {
    error: {
      code: "STALE_VERSION",
      message: "Data telah berubah. Muat ulang halaman sebelum menyimpan lagi.",
    },
    status: "error",
  };
}
