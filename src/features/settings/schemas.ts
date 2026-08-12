import { z } from "zod";

const optionalUuid = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.uuid().optional(),
);

const version = z.coerce.number().int().positive();
export const companyIdentitySchema = z.object({
  legalName: z
    .string()
    .trim()
    .max(160)
    .transform((value) => value || null),
  name: z.string().trim().min(2).max(160),
  taxId: z
    .string()
    .trim()
    .max(40)
    .transform((value) => value || null),
  timezone: z.string().trim().min(3).max(80),
  version: z.coerce.number().int().positive(),
});
export const accountingSettingsSchema = z.object({
  allowNegativeStock: z.string().optional().transform(Boolean),
  allowSelfApproval: z.string().optional().transform(Boolean),
  fiscalYearStartMonth: z.coerce.number().int().min(1).max(12),
  version: z.coerce.number().int().positive(),
});

export const roleSchema = z.object({
  code: z
    .string()
    .trim()
    .min(2, "Kode minimal 2 karakter.")
    .max(40)
    .regex(
      /^[a-z][a-z0-9_-]+$/,
      "Gunakan huruf kecil, angka, garis bawah, atau tanda hubung.",
    ),
  id: optionalUuid,
  name: z.string().trim().min(2, "Nama role minimal 2 karakter.").max(80),
  permissions: z.array(z.string().min(1)).min(1, "Pilih minimal satu izin."),
  version: z.preprocess(
    (value) => (value === "" ? undefined : value),
    version.optional(),
  ),
});

export const roleStatusSchema = z.object({
  activate: z.enum(["true", "false"]).transform((value) => value === "true"),
  id: z.uuid(),
  version,
});

export const inviteMemberSchema = z.object({
  displayName: z.string().trim().min(2).max(100),
  email: z
    .email("Alamat email tidak valid.")
    .transform((value) => value.toLowerCase()),
  roleId: z.uuid("Pilih role."),
});

export const membershipSchema = z.object({
  roleId: z.uuid("Pilih role."),
  status: z.enum(["active", "disabled"]),
  userId: z.uuid(),
  version,
});

export const accountMappingsSchema = z.record(
  z.string(),
  z.uuid("Pilih akun untuk setiap pemetaan."),
);
