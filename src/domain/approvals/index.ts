export type DocumentStatus =
  | "approved"
  | "draft"
  | "paid"
  | "partially_paid"
  | "pending_approval"
  | "posted"
  | "rejected"
  | "reversed"
  | "submitted"
  | "voided";

const transitions: Record<DocumentStatus, readonly DocumentStatus[]> = {
  approved: ["posted"],
  draft: ["submitted", "voided"],
  paid: ["reversed"],
  partially_paid: ["paid", "reversed"],
  pending_approval: ["approved", "rejected"],
  posted: ["partially_paid", "paid", "reversed"],
  rejected: ["draft"],
  reversed: [],
  submitted: ["pending_approval"],
  voided: [],
};

export function canTransition(
  from: DocumentStatus,
  to: DocumentStatus,
): boolean {
  return transitions[from].includes(to);
}

export function assertTransition(
  from: DocumentStatus,
  to: DocumentStatus,
): void {
  if (!canTransition(from, to))
    throw new Error(`Transisi ${from} ke ${to} tidak diizinkan.`);
}

export function assertCanApprove(input: {
  allowSelfApproval: boolean;
  approverId: string;
  createdBy: string;
  permissions: readonly string[];
  requiredPermission: string;
}): void {
  if (!input.permissions.includes(input.requiredPermission)) {
    throw new Error("Pengguna tidak memiliki izin persetujuan.");
  }
  if (!input.allowSelfApproval && input.approverId === input.createdBy) {
    throw new Error(
      "Pembuat dokumen tidak boleh menyetujui dokumennya sendiri.",
    );
  }
}
