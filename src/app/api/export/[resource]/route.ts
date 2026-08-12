import { NextResponse } from "next/server";

import { requireUser } from "@/server/auth/require-user";
import { requireCompanyPermission } from "@/server/auth/require-permission";

type ExportResource =
  | "accounts"
  | "audit-log"
  | "bank-accounts"
  | "contacts"
  | "products"
  | "taxes"
  | "warehouses";

const allowed = new Set<ExportResource>([
  "accounts",
  "audit-log",
  "bank-accounts",
  "contacts",
  "products",
  "taxes",
  "warehouses",
]);

function csvCell(value: unknown) {
  let text =
    value === null || value === undefined
      ? ""
      : typeof value === "object"
        ? JSON.stringify(value)
        : String(value);
  if (/^[=+\-@]/.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
}

function toCsv(rows: Record<string, unknown>[]) {
  if (rows.length === 0) return "";
  const columns = Object.keys(rows[0]);
  return [
    columns.map(csvCell).join(","),
    ...rows.map((row) =>
      columns.map((column) => csvCell(row[column])).join(","),
    ),
  ].join("\r\n");
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ resource: string }> },
) {
  const { resource: rawResource } = await params;
  if (!allowed.has(rawResource as ExportResource)) {
    return NextResponse.json(
      { error: "Resource ekspor tidak dikenal." },
      { status: 404 },
    );
  }

  const resource = rawResource as ExportResource;
  const context = await requireCompanyPermission("report.export");
  const readPermissions: Record<ExportResource, string[]> = {
    accounts: ["coa.read"],
    "audit-log": ["audit.read"],
    "bank-accounts": ["report.financial.read", "settings.manage"],
    contacts: ["contact.read"],
    products: ["item.read"],
    taxes: ["report.tax.read", "settings.manage"],
    warehouses: ["inventory.read", "settings.manage"],
  };
  if (
    !readPermissions[resource].some((permission) =>
      context.permissions.includes(permission),
    )
  ) {
    return NextResponse.json(
      { error: "Anda tidak memiliki izin membaca data tersebut." },
      { status: 403 },
    );
  }
  const { supabase } = await requireUser();

  let result;
  switch (resource) {
    case "accounts":
      result = await supabase
        .from("chart_of_accounts")
        .select(
          "code,name,account_type,normal_balance,cash_flow_category,is_control_account,allow_manual_entry,is_active",
        )
        .eq("company_id", context.companyId)
        .order("code")
        .limit(10000);
      break;
    case "audit-log":
      result = await supabase
        .from("audit_logs")
        .select(
          "created_at,action,entity_type,entity_id,document_number,reason,before_data,after_data",
        )
        .eq("company_id", context.companyId)
        .order("created_at", { ascending: false })
        .limit(10000);
      break;
    case "contacts":
      result = await supabase
        .from("contacts")
        .select(
          "code,contact_type,display_name,legal_name,email,phone,tax_id,national_id,tax_branch_id,is_taxable_entrepreneur,credit_limit,is_active",
        )
        .eq("company_id", context.companyId)
        .order("code")
        .limit(10000);
      break;
    case "products":
      result = await supabase
        .from("products")
        .select(
          "sku,barcode,name,product_type,sales_price,purchase_price,minimum_stock,is_active",
        )
        .eq("company_id", context.companyId)
        .order("sku")
        .limit(10000);
      break;
    case "warehouses":
      result = await supabase
        .from("warehouses")
        .select("code,name,address_line,city,province,postal_code,is_active")
        .eq("company_id", context.companyId)
        .order("code")
        .limit(10000);
      break;
    case "taxes":
      result = await supabase
        .from("tax_codes")
        .select(
          "code,name,category,is_active,tax_rate_versions(rate,effective_from,effective_to,status)",
        )
        .eq("company_id", context.companyId)
        .order("code")
        .limit(10000);
      break;
    case "bank-accounts":
      result = await supabase
        .from("bank_accounts")
        .select(
          "code,name,account_type,bank_name,masked_account_number,currency_code,is_active,chart_of_accounts(code,name)",
        )
        .eq("company_id", context.companyId)
        .order("code")
        .limit(10000);
      break;
  }

  if (result.error) {
    console.error("Master export failed", {
      code: result.error.code,
      resource,
    });
    return NextResponse.json(
      { error: "Data ekspor tidak dapat dibuat." },
      { status: 500 },
    );
  }
  const csv = toCsv((result.data ?? []) as Record<string, unknown>[]);
  return new Response(`\uFEFF${csv}`, {
    headers: {
      "Cache-Control": "no-store",
      "Content-Disposition": `attachment; filename="dasol-${resource}-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Content-Type": "text/csv; charset=utf-8",
    },
  });
}
