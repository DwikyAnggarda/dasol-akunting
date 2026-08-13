import { describe, expect, it } from "vitest";

import { getInternalNavigationPath } from "@/components/layout/dashboard-navigation-utils";

const origin = "https://dasol.example";

describe("getInternalNavigationPath", () => {
  it("returns an internal destination including query parameters", () => {
    expect(
      getInternalNavigationPath(
        {
          download: false,
          href: "/sales/orders?page=2",
          target: null,
        },
        origin,
        "/sales/orders",
      ),
    ).toBe("/sales/orders?page=2");
  });

  it("ignores the current route, downloads, new tabs, APIs, and external links", () => {
    expect(
      getInternalNavigationPath(
        { download: false, href: "/sales/orders", target: null },
        origin,
        "/sales/orders",
      ),
    ).toBeNull();
    expect(
      getInternalNavigationPath(
        { download: true, href: "/reports/export", target: null },
        origin,
        "/reports",
      ),
    ).toBeNull();
    expect(
      getInternalNavigationPath(
        { download: false, href: "/sales/orders", target: "_blank" },
        origin,
        "/sales/invoices",
      ),
    ).toBeNull();
    expect(
      getInternalNavigationPath(
        { download: false, href: "/api/export/products", target: null },
        origin,
        "/master/products",
      ),
    ).toBeNull();
    expect(
      getInternalNavigationPath(
        {
          download: false,
          href: "https://example.com/docs",
          target: null,
        },
        origin,
        "/dashboard",
      ),
    ).toBeNull();
  });
});
