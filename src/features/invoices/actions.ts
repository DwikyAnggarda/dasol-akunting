"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import type { MutationState } from "@/features/shared/mutation-state";
import { requireMutationPermission } from "@/server/mutations/context";
import { databaseFailure, validationFailure } from "@/server/mutations/result";

import {
  approvalCommandSchema,
  invoiceCommandSchema,
  invoiceFormSchema,
  invoiceReversalSchema,
} from "./schemas";

function value(formData: FormData, name: string) {
  return formData.get(name);
}

function path(kind: "purchase" | "sales") {
  return kind === "sales" ? "/sales/invoices" : "/purchases/invoices";
}

export async function saveInvoiceAction(
  _state: MutationState,
  formData: FormData,
): Promise<MutationState> {
  const parsed = invoiceFormSchema.safeParse({
    branchId: value(formData, "branchId"),
    contactId: value(formData, "contactId"),
    currencyCode: value(formData, "currencyCode") || "IDR",
    documentDate: value(formData, "documentDate"),
    dueDate: value(formData, "dueDate"),
    exchangeRate: value(formData, "exchangeRate") || "1",
    id: value(formData, "id") || "",
    kind: value(formData, "kind"),
    lines: value(formData, "lines"),
    notes: value(formData, "notes") || "",
    postingDate: value(formData, "postingDate"),
    supplierReference: value(formData, "supplierReference") || "",
    version: value(formData, "version") || null,
  });
  if (!parsed.success) return validationFailure(parsed.error);
  const permission = parsed.data.id
    ? `${parsed.data.kind}.update`
    : `${parsed.data.kind}.create`;
  const { company, supabase } = await requireMutationPermission(permission);
  const { data, error } = await supabase.rpc("save_invoice_draft", {
    p_company_id: company.companyId,
    p_document_type: `${parsed.data.kind}_invoice`,
    p_header: {
      branch_id: parsed.data.branchId,
      contact_id: parsed.data.contactId,
      currency_code: parsed.data.currencyCode,
      document_date: parsed.data.documentDate,
      due_date: parsed.data.dueDate,
      exchange_rate: parsed.data.exchangeRate,
      notes: parsed.data.notes,
      posting_date: parsed.data.postingDate,
      supplier_reference: parsed.data.supplierReference,
    },
    p_invoice_id: parsed.data.id,
    p_lines: parsed.data.lines.map((line) => ({
      description: line.description,
      discount_amount: line.discountAmount,
      product_id: line.productId,
      quantity: line.quantity,
      tax_rate_version_id: line.taxRateVersionId,
      unit_price: line.unitPrice,
      warehouse_id: line.warehouseId,
    })),
    p_version: parsed.data.version,
  });
  if (error)
    return databaseFailure(error, "Draft invoice tidak dapat disimpan.");
  revalidatePath(path(parsed.data.kind));
  redirect(`${path(parsed.data.kind)}/${data}?saved=1`);
}

export async function submitInvoiceAction(
  _state: MutationState,
  formData: FormData,
): Promise<MutationState> {
  const parsed = invoiceCommandSchema.safeParse({
    id: value(formData, "id"),
    kind: value(formData, "kind"),
  });
  if (!parsed.success) return validationFailure(parsed.error);
  const { company, supabase } = await requireMutationPermission(
    `${parsed.data.kind}.submit`,
  );
  const { error } = await supabase.rpc("submit_document", {
    p_company_id: company.companyId,
    p_document_id: parsed.data.id,
    p_document_type: `${parsed.data.kind}_invoice`,
  });
  if (error) return databaseFailure(error, "Invoice tidak dapat diajukan.");
  revalidatePath(path(parsed.data.kind));
  redirect(`${path(parsed.data.kind)}/${parsed.data.id}?submitted=1`);
}

export async function deleteInvoiceDraftAction(
  _state: MutationState,
  formData: FormData,
): Promise<MutationState> {
  const parsed = invoiceCommandSchema.safeParse({
    id: value(formData, "id"),
    kind: value(formData, "kind"),
    version: value(formData, "version"),
  });
  if (!parsed.success) return validationFailure(parsed.error);
  const { company, supabase } = await requireMutationPermission(
    `${parsed.data.kind}.update`,
  );
  const { error } = await supabase.rpc("delete_invoice_draft", {
    p_company_id: company.companyId,
    p_document_type: `${parsed.data.kind}_invoice`,
    p_invoice_id: parsed.data.id,
    p_version: parsed.data.version!,
  });
  if (error)
    return databaseFailure(error, "Draft invoice tidak dapat dihapus.");
  revalidatePath(path(parsed.data.kind));
  redirect(`${path(parsed.data.kind)}?deleted=1`);
}

export async function approveInvoiceAction(
  _state: MutationState,
  formData: FormData,
): Promise<MutationState> {
  const parsed = approvalCommandSchema.safeParse({
    comment: value(formData, "comment") || "",
    documentId: value(formData, "documentId"),
    documentType: value(formData, "documentType"),
    requestId: value(formData, "requestId"),
  });
  if (!parsed.success) return validationFailure(parsed.error);
  const kind =
    parsed.data.documentType === "sales_invoice" ? "sales" : "purchase";
  const { company, supabase } = await requireMutationPermission(
    `${kind}.approve`,
  );
  const { error } = await supabase.rpc("approve_document", {
    p_comment: parsed.data.comment,
    p_company_id: company.companyId,
    p_request_id: parsed.data.requestId,
  });
  if (error) return databaseFailure(error, "Invoice tidak dapat disetujui.");
  revalidatePath("/approvals");
  revalidatePath(path(kind));
  redirect(`${path(kind)}/${parsed.data.documentId}?approved=1`);
}

export async function rejectInvoiceAction(
  _state: MutationState,
  formData: FormData,
): Promise<MutationState> {
  const parsed = approvalCommandSchema.safeParse({
    comment: value(formData, "comment") || "",
    documentId: value(formData, "documentId"),
    documentType: value(formData, "documentType"),
    requestId: value(formData, "requestId"),
  });
  if (!parsed.success) return validationFailure(parsed.error);
  if (parsed.data.comment.length < 3) {
    return {
      status: "error",
      error: {
        code: "VALIDATION",
        fieldErrors: { comment: ["Alasan minimal 3 karakter."] },
        message: "Alasan penolakan wajib diisi.",
      },
    };
  }
  const kind =
    parsed.data.documentType === "sales_invoice" ? "sales" : "purchase";
  const { company, supabase } = await requireMutationPermission(
    `${kind}.approve`,
  );
  const { error } = await supabase.rpc("reject_document", {
    p_comment: parsed.data.comment,
    p_company_id: company.companyId,
    p_request_id: parsed.data.requestId,
  });
  if (error) return databaseFailure(error, "Invoice tidak dapat ditolak.");
  revalidatePath("/approvals");
  revalidatePath(path(kind));
  redirect(`${path(kind)}/${parsed.data.documentId}?rejected=1`);
}

export async function postInvoiceAction(
  _state: MutationState,
  formData: FormData,
): Promise<MutationState> {
  const parsed = invoiceCommandSchema.safeParse({
    id: value(formData, "id"),
    kind: value(formData, "kind"),
  });
  if (!parsed.success) return validationFailure(parsed.error);
  const { company, supabase } = await requireMutationPermission(
    `${parsed.data.kind}.post`,
  );
  const rpc =
    parsed.data.kind === "sales"
      ? "post_sales_invoice"
      : "post_purchase_invoice";
  const args =
    parsed.data.kind === "sales"
      ? {
          p_company_id: company.companyId,
          p_idempotency_key: `sales-invoice:${parsed.data.id}`,
          p_invoice_id: parsed.data.id,
        }
      : {
          p_company_id: company.companyId,
          p_idempotency_key: `purchase-invoice:${parsed.data.id}`,
          p_invoice_id: parsed.data.id,
        };
  const { error } = await supabase.rpc(rpc, args);
  if (error) return databaseFailure(error, "Invoice tidak dapat diposting.");
  revalidatePath(path(parsed.data.kind));
  revalidatePath("/dashboard");
  revalidatePath("/reports");
  redirect(`${path(parsed.data.kind)}/${parsed.data.id}?posted=1`);
}

export async function reverseInvoiceAction(
  _state: MutationState,
  formData: FormData,
): Promise<MutationState> {
  const parsed = invoiceReversalSchema.safeParse({
    id: value(formData, "id"),
    kind: value(formData, "kind"),
    reason: value(formData, "reason"),
    reversalDate: value(formData, "reversalDate"),
  });
  if (!parsed.success) return validationFailure(parsed.error);
  const { company, supabase } =
    await requireMutationPermission("journal.reverse");
  const { error } = await supabase.rpc("reverse_invoice", {
    p_company_id: company.companyId,
    p_document_type: `${parsed.data.kind}_invoice`,
    p_idempotency_key: `reverse:${parsed.data.kind}-invoice:${parsed.data.id}`,
    p_invoice_id: parsed.data.id,
    p_reason: parsed.data.reason,
    p_reversal_date: parsed.data.reversalDate,
  });
  if (error) return databaseFailure(error, "Invoice tidak dapat direversal.");
  revalidatePath(path(parsed.data.kind));
  revalidatePath("/reports");
  revalidatePath("/dashboard");
  redirect(`${path(parsed.data.kind)}/${parsed.data.id}?reversed=1`);
}
