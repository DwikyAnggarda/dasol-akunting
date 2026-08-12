import type { OperationalKind } from "./schemas";
export const operationConfig: Record<
  OperationalKind,
  { base: string; contact: string; domain: "purchase" | "sales"; title: string }
> = {
  sales_quotation: {
    base: "/sales/quotations",
    contact: "Pelanggan",
    domain: "sales",
    title: "Sales Quotation",
  },
  sales_order: {
    base: "/sales/orders",
    contact: "Pelanggan",
    domain: "sales",
    title: "Sales Order",
  },
  sales_delivery: {
    base: "/sales/deliveries",
    contact: "Pelanggan",
    domain: "sales",
    title: "Sales Delivery",
  },
  purchase_order: {
    base: "/purchases/orders",
    contact: "Pemasok",
    domain: "purchase",
    title: "Purchase Order",
  },
  purchase_request: {
    base: "/purchases/requests",
    contact: "Pemasok",
    domain: "purchase",
    title: "Purchase Request",
  },
  goods_receipt: {
    base: "/purchases/receipts",
    contact: "Pemasok",
    domain: "purchase",
    title: "Goods Receipt",
  },
};
export const isFulfillment = (kind: OperationalKind) =>
  kind === "sales_delivery" || kind === "goods_receipt";
export const isOrder = (kind: OperationalKind) =>
  kind === "sales_order" || kind === "purchase_order";
export const isPreorder = (kind: OperationalKind) =>
  kind === "sales_quotation" || kind === "purchase_request";
