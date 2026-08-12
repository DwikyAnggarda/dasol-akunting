import { expect, test, type Page } from "@playwright/test";
import { config } from "dotenv";
config({ path: ".env.local", quiet: true });
async function login(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(process.env.DEMO_ADMIN_EMAIL!);
  await page
    .getByLabel("Kata sandi", { exact: true })
    .fill(process.env.DEMO_ADMIN_PASSWORD!);
  await page.getByRole("button", { name: "Masuk ke Dasol" }).click();
  await page.getByRole("button").filter({ hasText: "DASOLDEMO" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}
test("all expanded business navigation routes render", async ({
  page,
}, testInfo) => {
  test.setTimeout(120_000);
  test.skip(
    !process.env.DEMO_ADMIN_EMAIL || !process.env.DEMO_ADMIN_PASSWORD,
    "Admin credentials missing.",
  );
  await login(page);
  test.skip(
    testInfo.project.name.includes("mobile"),
    "Expanded route catalog runs once on desktop; mobile auth layout has a dedicated test.",
  );
  const routes: Array<[string, RegExp]> = [
    ["/sales/quotations", /^Sales Quotation$/],
    ["/sales/orders", /^Sales Order$/],
    ["/sales/deliveries", /^Sales Delivery$/],
    ["/sales/returns", /^Sales Return/],
    ["/purchases/requests", /^Purchase Request$/],
    ["/purchases/orders", /^Purchase Order$/],
    ["/purchases/receipts", /^Goods Receipt$/],
    ["/purchases/returns", /^Purchase Return/],
    ["/inventory/adjustments", /^Stock Adjustment$/],
    ["/inventory/transfers", /^Stock Transfer$/],
    ["/inventory/opname", /^Stock Opname$/],
    ["/cash-bank/transactions", /^Transaksi Kas/],
    ["/cash-bank/reconciliations", /^Rekonsiliasi Bank$/],
    ["/fixed-assets", /^Aset Tetap$/],
    ["/notifications", /^Notifikasi/],
    ["/settings/roles", /^Roles/],
    ["/settings/users", /^Pengguna$/],
    ["/settings/account-mapping", /^Pemetaan Akun$/],
  ];
  for (const [route, heading] of routes) {
    const response = await page.goto(route);
    expect(response?.status(), route).toBe(200);
    await expect(
      page.getByRole("heading", { level: 1, name: heading }),
    ).toBeVisible();
  }
});
