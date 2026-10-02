"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import type { MutationState } from "@/features/shared/mutation-state";
import { requireMutationPermission } from "@/server/mutations/context";
import {
  conflictFailure,
  databaseFailure,
  validationFailure,
} from "@/server/mutations/result";

import {
  accountFormSchema,
  archiveFormSchema,
  bankAccountFormSchema,
  contactFormSchema,
  productFormSchema,
  taxCodeFormSchema,
  taxRateFormSchema,
  warehouseFormSchema,
} from "./schemas";

function value(formData: FormData, name: string): FormDataEntryValue | null {
  return formData.get(name);
}

export async function saveAccountAction(
  _state: MutationState,
  formData: FormData,
): Promise<MutationState> {
  const parsed = accountFormSchema.safeParse({
    accountType: value(formData, "accountType"),
    allowManualEntry: value(formData, "allowManualEntry") ?? undefined,
    cashFlowCategory: value(formData, "cashFlowCategory"),
    code: value(formData, "code"),
    id: value(formData, "id") || "",
    isControlAccount: value(formData, "isControlAccount") ?? undefined,
    name: value(formData, "name"),
    normalBalance: value(formData, "normalBalance"),
    parentId: value(formData, "parentId"),
    version: value(formData, "version") || null,
  });
  if (!parsed.success) return validationFailure(parsed.error);

  const { company, supabase, user } =
    await requireMutationPermission("coa.write");
  const payload = {
    account_type: parsed.data.accountType,
    allow_manual_entry: parsed.data.allowManualEntry,
    cash_flow_category: parsed.data.cashFlowCategory,
    code: parsed.data.code,
    is_control_account: parsed.data.isControlAccount,
    name: parsed.data.name,
    normal_balance: parsed.data.normalBalance,
    parent_id: parsed.data.parentId,
    updated_by: user.id,
  };

  if (parsed.data.id) {
    const { data, error } = await supabase
      .from("chart_of_accounts")
      .update(payload)
      .eq("company_id", company.companyId)
      .eq("id", parsed.data.id)
      .eq("version", parsed.data.version)
      .select("id")
      .maybeSingle();
    if (error) return databaseFailure(error, "Akun tidak dapat diperbarui.");
    if (!data) return conflictFailure();
  } else {
    const { error } = await supabase.from("chart_of_accounts").insert({
      ...payload,
      company_id: company.companyId,
      created_by: user.id,
    });
    if (error) return databaseFailure(error, "Akun tidak dapat dibuat.");
  }

  revalidatePath("/master/accounts");
  redirect("/master/accounts?saved=1");
}

export async function toggleAccountAction(
  _state: MutationState,
  formData: FormData,
): Promise<MutationState> {
  return toggleMaster(
    formData,
    "chart_of_accounts",
    "coa.write",
    "/master/accounts",
  );
}

export async function saveContactAction(
  _state: MutationState,
  formData: FormData,
): Promise<MutationState> {
  const parsed = contactFormSchema.safeParse({
    addressLine: value(formData, "addressLine"),
    city: value(formData, "city"),
    code: value(formData, "code"),
    contactType: value(formData, "contactType"),
    creditLimit: value(formData, "creditLimit"),
    defaultTaxCodeId: value(formData, "defaultTaxCodeId"),
    displayName: value(formData, "displayName"),
    email: value(formData, "email"),
    id: value(formData, "id") || "",
    isTaxableEntrepreneur:
      value(formData, "isTaxableEntrepreneur") ?? undefined,
    legalName: value(formData, "legalName"),
    nationalId: value(formData, "nationalId"),
    notes: value(formData, "notes"),
    payableAccountId: value(formData, "payableAccountId"),
    paymentTermId: value(formData, "paymentTermId"),
    phone: value(formData, "phone"),
    postalCode: value(formData, "postalCode"),
    province: value(formData, "province"),
    receivableAccountId: value(formData, "receivableAccountId"),
    taxBranchId: value(formData, "taxBranchId"),
    taxId: value(formData, "taxId"),
    version: value(formData, "version") || null,
  });
  if (!parsed.success) return validationFailure(parsed.error);
  const { company, supabase } =
    await requireMutationPermission("contact.write");
  const { data, error } = await supabase.rpc("save_contact", {
    p_address: {
      address_line: parsed.data.addressLine ?? "",
      city: parsed.data.city ?? "",
      postal_code: parsed.data.postalCode ?? "",
      province: parsed.data.province ?? "",
    },
    p_company_id: company.companyId,
    p_contact: {
      code: parsed.data.code,
      contact_type: parsed.data.contactType,
      credit_limit: parsed.data.creditLimit,
      default_tax_code_id: parsed.data.defaultTaxCodeId ?? "",
      display_name: parsed.data.displayName,
      email: parsed.data.email ?? "",
      is_taxable_entrepreneur: parsed.data.isTaxableEntrepreneur,
      legal_name: parsed.data.legalName ?? "",
      national_id: parsed.data.nationalId ?? "",
      notes: parsed.data.notes ?? "",
      payable_account_id: parsed.data.payableAccountId ?? "",
      payment_term_id: parsed.data.paymentTermId ?? "",
      phone: parsed.data.phone ?? "",
      receivable_account_id: parsed.data.receivableAccountId ?? "",
      tax_branch_id: parsed.data.taxBranchId ?? "",
      tax_id: parsed.data.taxId ?? "",
    },
    p_contact_id: parsed.data.id,
    p_version: parsed.data.version,
  });
  if (error) return databaseFailure(error, "Kontak tidak dapat disimpan.");
  if (!data) return conflictFailure();
  revalidatePath("/master/contacts");
  redirect(`/master/contacts/${data}?saved=1`);
}

export async function toggleContactAction(
  _state: MutationState,
  formData: FormData,
): Promise<MutationState> {
  return toggleMaster(
    formData,
    "contacts",
    "contact.write",
    "/master/contacts",
  );
}

export async function saveProductAction(
  _state: MutationState,
  formData: FormData,
): Promise<MutationState> {
  const parsed = productFormSchema.safeParse({
    barcode: value(formData, "barcode"),
    baseUnitId: value(formData, "baseUnitId"),
    cogsAccountId: value(formData, "cogsAccountId"),
    defaultPurchaseTaxCodeId: value(formData, "defaultPurchaseTaxCodeId"),
    defaultSalesTaxCodeId: value(formData, "defaultSalesTaxCodeId"),
    id: value(formData, "id") || "",
    inventoryAccountId: value(formData, "inventoryAccountId"),
    minimumStock: value(formData, "minimumStock"),
    name: value(formData, "name"),
    productType: value(formData, "productType"),
    purchaseAccountId: value(formData, "purchaseAccountId"),
    purchasePrice: value(formData, "purchasePrice"),
    salesAccountId: value(formData, "salesAccountId"),
    salesPrice: value(formData, "salesPrice"),
    sku: value(formData, "sku"),
    version: value(formData, "version") || null,
  });
  if (!parsed.success) return validationFailure(parsed.error);
  const { company, supabase, user } =
    await requireMutationPermission("item.write");
  const payload = {
    barcode: parsed.data.barcode,
    base_unit_id: parsed.data.baseUnitId,
    cogs_account_id: parsed.data.cogsAccountId,
    default_purchase_tax_code_id: parsed.data.defaultPurchaseTaxCodeId,
    default_sales_tax_code_id: parsed.data.defaultSalesTaxCodeId,
    inventory_account_id: parsed.data.inventoryAccountId,
    minimum_stock: parsed.data.minimumStock,
    name: parsed.data.name,
    product_type: parsed.data.productType,
    purchase_account_id: parsed.data.purchaseAccountId,
    purchase_price: parsed.data.purchasePrice,
    sales_account_id: parsed.data.salesAccountId,
    sales_price: parsed.data.salesPrice,
    sku: parsed.data.sku,
    updated_by: user.id,
  };
  if (parsed.data.id) {
    const { data, error } = await supabase
      .from("products")
      .update(payload)
      .eq("company_id", company.companyId)
      .eq("id", parsed.data.id)
      .eq("version", parsed.data.version)
      .select("id")
      .maybeSingle();
    if (error) return databaseFailure(error, "Produk tidak dapat diperbarui.");
    if (!data) return conflictFailure();
  } else {
    const { error } = await supabase.from("products").insert({
      ...payload,
      company_id: company.companyId,
      created_by: user.id,
    });
    if (error) return databaseFailure(error, "Produk tidak dapat dibuat.");
  }
  revalidatePath("/master/products");
  redirect("/master/products?saved=1");
}

export async function toggleProductAction(
  _state: MutationState,
  formData: FormData,
): Promise<MutationState> {
  return toggleMaster(formData, "products", "item.write", "/master/products");
}

export async function deleteProductAction(
  _state: MutationState,
  formData: FormData,
): Promise<MutationState> {
  const parsed = archiveFormSchema.safeParse({
    id: value(formData, "id"),
    version: value(formData, "version"),
  });
  if (!parsed.success) return validationFailure(parsed.error);
  const { company, supabase } =
    await requireMutationPermission("item.write");
  const { data, error } = await supabase.rpc("delete_unused_product", {
    p_company_id: company.companyId,
    p_product_id: parsed.data.id,
    p_version: parsed.data.version,
  });
  if (error) return databaseFailure(error, "Produk tidak dapat dihapus.");
  if (!data) return conflictFailure();
  revalidatePath("/master/products");
  redirect("/master/products?deleted=1");
}

export async function saveWarehouseAction(
  _state: MutationState,
  formData: FormData,
): Promise<MutationState> {
  const parsed = warehouseFormSchema.safeParse({
    addressLine: value(formData, "addressLine"),
    branchId: value(formData, "branchId"),
    city: value(formData, "city"),
    code: value(formData, "code"),
    id: value(formData, "id") || "",
    name: value(formData, "name"),
    postalCode: value(formData, "postalCode"),
    province: value(formData, "province"),
    version: value(formData, "version") || null,
  });
  if (!parsed.success) return validationFailure(parsed.error);
  const { company, supabase, user } =
    await requireMutationPermission("settings.manage");
  const payload = {
    address_line: parsed.data.addressLine,
    branch_id: parsed.data.branchId,
    city: parsed.data.city,
    code: parsed.data.code,
    name: parsed.data.name,
    postal_code: parsed.data.postalCode,
    province: parsed.data.province,
    updated_by: user.id,
  };
  if (parsed.data.id) {
    const { data, error } = await supabase
      .from("warehouses")
      .update(payload)
      .eq("company_id", company.companyId)
      .eq("id", parsed.data.id)
      .eq("version", parsed.data.version)
      .select("id")
      .maybeSingle();
    if (error) return databaseFailure(error, "Gudang tidak dapat diperbarui.");
    if (!data) return conflictFailure();
  } else {
    const { error } = await supabase.from("warehouses").insert({
      ...payload,
      company_id: company.companyId,
      created_by: user.id,
    });
    if (error) return databaseFailure(error, "Gudang tidak dapat dibuat.");
  }
  revalidatePath("/master/warehouses");
  redirect("/master/warehouses?saved=1");
}

export async function toggleWarehouseAction(
  _state: MutationState,
  formData: FormData,
): Promise<MutationState> {
  return toggleMaster(
    formData,
    "warehouses",
    "settings.manage",
    "/master/warehouses",
  );
}

export async function saveTaxCodeAction(
  _state: MutationState,
  formData: FormData,
): Promise<MutationState> {
  const parsed = taxCodeFormSchema.safeParse({
    category: value(formData, "category"),
    code: value(formData, "code"),
    id: value(formData, "id") || "",
    inputAccountId: value(formData, "inputAccountId"),
    name: value(formData, "name"),
    outputAccountId: value(formData, "outputAccountId"),
    version: value(formData, "version") || null,
  });
  if (!parsed.success) return validationFailure(parsed.error);
  const { company, supabase, user } =
    await requireMutationPermission("settings.manage");
  const payload = {
    category: parsed.data.category,
    code: parsed.data.code,
    input_account_id: parsed.data.inputAccountId,
    name: parsed.data.name,
    output_account_id: parsed.data.outputAccountId,
    updated_by: user.id,
  };
  let taxCodeId = parsed.data.id;
  if (taxCodeId) {
    const { data, error } = await supabase
      .from("tax_codes")
      .update(payload)
      .eq("company_id", company.companyId)
      .eq("id", taxCodeId)
      .eq("version", parsed.data.version)
      .select("id")
      .maybeSingle();
    if (error)
      return databaseFailure(error, "Kode pajak tidak dapat diperbarui.");
    if (!data) return conflictFailure();
  } else {
    const { data, error } = await supabase
      .from("tax_codes")
      .insert({
        ...payload,
        company_id: company.companyId,
        created_by: user.id,
      })
      .select("id")
      .single();
    if (error) return databaseFailure(error, "Kode pajak tidak dapat dibuat.");
    taxCodeId = data.id;
  }
  revalidatePath("/master/taxes");
  redirect(`/master/taxes/${taxCodeId}?saved=1`);
}

export async function addTaxRateAction(
  _state: MutationState,
  formData: FormData,
): Promise<MutationState> {
  const parsed = taxRateFormSchema.safeParse({
    effectiveFrom: value(formData, "effectiveFrom"),
    effectiveTo: value(formData, "effectiveTo"),
    notes: value(formData, "notes"),
    priceIncludesTax: value(formData, "priceIncludesTax") ?? undefined,
    rate: value(formData, "rate"),
    roundingMethod: value(formData, "roundingMethod"),
    sourceReference: value(formData, "sourceReference"),
    taxCodeId: value(formData, "taxCodeId"),
  });
  if (!parsed.success) return validationFailure(parsed.error);
  const { company, supabase, user } =
    await requireMutationPermission("settings.manage");
  const { error } = await supabase.from("tax_rate_versions").insert({
    company_id: company.companyId,
    created_by: user.id,
    effective_from: parsed.data.effectiveFrom,
    effective_to: parsed.data.effectiveTo,
    notes: parsed.data.notes,
    price_includes_tax: parsed.data.priceIncludesTax,
    rate: parsed.data.rate,
    rounding_method: parsed.data.roundingMethod,
    source_reference: parsed.data.sourceReference,
    tax_code_id: parsed.data.taxCodeId,
  });
  if (error)
    return databaseFailure(
      error,
      "Versi tarif tidak dapat ditambahkan. Pastikan periode tidak tumpang tindih.",
    );
  revalidatePath(`/master/taxes/${parsed.data.taxCodeId}`);
  redirect(`/master/taxes/${parsed.data.taxCodeId}?rateAdded=1`);
}

export async function toggleTaxCodeAction(
  _state: MutationState,
  formData: FormData,
): Promise<MutationState> {
  return toggleMaster(
    formData,
    "tax_codes",
    "settings.manage",
    "/master/taxes",
  );
}

export async function saveBankAccountAction(
  _state: MutationState,
  formData: FormData,
): Promise<MutationState> {
  const parsed = bankAccountFormSchema.safeParse({
    accountType: value(formData, "accountType"),
    bankName: value(formData, "bankName"),
    code: value(formData, "code"),
    currencyCode: value(formData, "currencyCode"),
    glAccountId: value(formData, "glAccountId"),
    id: value(formData, "id") || "",
    maskedAccountNumber: value(formData, "maskedAccountNumber"),
    name: value(formData, "name"),
    version: value(formData, "version") || null,
  });
  if (!parsed.success) return validationFailure(parsed.error);
  const { company, supabase, user } =
    await requireMutationPermission("settings.manage");
  const payload = {
    account_type: parsed.data.accountType,
    bank_name: parsed.data.bankName,
    code: parsed.data.code,
    currency_code: parsed.data.currencyCode,
    gl_account_id: parsed.data.glAccountId,
    masked_account_number: parsed.data.maskedAccountNumber,
    name: parsed.data.name,
    updated_by: user.id,
  };
  if (parsed.data.id) {
    const { data, error } = await supabase
      .from("bank_accounts")
      .update(payload)
      .eq("company_id", company.companyId)
      .eq("id", parsed.data.id)
      .eq("version", parsed.data.version)
      .select("id")
      .maybeSingle();
    if (error)
      return databaseFailure(error, "Akun bank/kas tidak dapat diperbarui.");
    if (!data) return conflictFailure();
  } else {
    const { error } = await supabase.from("bank_accounts").insert({
      ...payload,
      company_id: company.companyId,
      created_by: user.id,
    });
    if (error)
      return databaseFailure(error, "Akun bank/kas tidak dapat dibuat.");
  }
  revalidatePath("/cash-bank/accounts");
  redirect("/cash-bank/accounts?saved=1");
}

export async function toggleBankAccountAction(
  _state: MutationState,
  formData: FormData,
): Promise<MutationState> {
  return toggleMaster(
    formData,
    "bank_accounts",
    "settings.manage",
    "/cash-bank/accounts",
  );
}

async function toggleMaster(
  formData: FormData,
  table:
    | "bank_accounts"
    | "chart_of_accounts"
    | "contacts"
    | "products"
    | "tax_codes"
    | "warehouses",
  permission: string,
  path: string,
): Promise<MutationState> {
  const parsed = archiveFormSchema.safeParse({
    id: value(formData, "id"),
    version: value(formData, "version"),
  });
  if (!parsed.success) return validationFailure(parsed.error);
  const { company, supabase, user } =
    await requireMutationPermission(permission);
  const isActive = value(formData, "activate") === "true";
  const { data, error } = await supabase
    .from(table)
    .update({ is_active: isActive, updated_by: user.id })
    .eq("company_id", company.companyId)
    .eq("id", parsed.data.id)
    .eq("version", parsed.data.version)
    .select("id")
    .maybeSingle();
  if (error) return databaseFailure(error, "Status data tidak dapat diubah.");
  if (!data) return conflictFailure();
  revalidatePath(path);
  redirect(`${path}?statusChanged=1`);
}
