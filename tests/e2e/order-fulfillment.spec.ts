import { expect, test, type Locator, type Page } from "@playwright/test";
import { config } from "dotenv";
config({ path: ".env.local", quiet: true });
async function login(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Kata sandi", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Masuk ke Dasol" }).click();
  await page.getByRole("button").filter({ hasText: "DASOLDEMO" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}
async function choose(locator: Locator, text: string) {
  const value = await locator
    .locator("option")
    .filter({ hasText: text })
    .first()
    .getAttribute("value");
  expect(value).toBeTruthy();
  await locator.selectOption(value!);
}
async function switchUser(
  page: Page,
  credentials: readonly [string | undefined, string | undefined],
) {
  await page.context().clearCookies();
  await login(page, credentials[0]!, credentials[1]!);
}
async function approve(page: Page, path: string) {
  await page.goto(path);
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Setujui" }).click();
  await expect(page).toHaveURL(/approved=1/, { timeout: 30_000 });
}
test("purchase order to receipt and sales order to delivery update remaining stock", async ({
  page,
}, testInfo) => {
  test.setTimeout(300_000);
  test.skip(
    testInfo.project.name.includes("mobile"),
    "Full fulfillment flow runs once.",
  );
  const admin = [
      process.env.DEMO_ADMIN_EMAIL,
      process.env.DEMO_ADMIN_PASSWORD,
    ] as const,
    operator = [
      process.env.DEMO_OPERATOR_EMAIL,
      process.env.DEMO_OPERATOR_PASSWORD,
    ] as const,
    approver = [
      process.env.DEMO_APPROVER_EMAIL,
      process.env.DEMO_APPROVER_PASSWORD,
    ] as const;
  test.skip(
    [...admin, ...operator, ...approver].some((value) => !value),
    "Demo credentials missing.",
  );
  await login(page, admin[0]!, admin[1]!);
  const suffix = Date.now().toString().slice(-8),
    sku = `FLOW-${suffix}`;
  await page.goto("/master/products/new");
  await page.getByLabel("SKU").fill(sku);
  await page.getByLabel("Nama produk").fill("Produk Order Flow E2E");
  await page.getByLabel("Tipe produk").selectOption("inventory");
  await choose(page.getByLabel("Satuan dasar"), "PCS");
  await choose(page.getByLabel("Akun penjualan"), "4100");
  await choose(page.getByLabel("Akun pembelian/beban"), "8400");
  await choose(page.getByLabel("Akun persediaan"), "1300");
  await choose(page.getByLabel("Akun HPP"), "5100");
  await page.getByRole("button", { name: "Simpan" }).click();
  await expect(page).toHaveURL(/products\?saved=1/, { timeout: 30_000 });
  await switchUser(page, operator);
  await page.goto("/purchases/requests/new");
  await choose(page.getByLabel("Cabang"), "JKT");
  await choose(page.getByLabel("Pemasok"), "SUP-001");
  await choose(page.getByLabel("Produk baris 1"), sku);
  await choose(page.getByLabel("Gudang baris 1"), "WH-JKT");
  await page.getByLabel("Kuantitas baris 1").fill("5");
  await page.getByLabel("Harga baris 1").fill("100000");
  await page.getByRole("button", { name: "Simpan draft" }).click();
  await expect(page).toHaveURL(/purchases\/requests\/[0-9a-f-]+\?saved=1/, {
    timeout: 30_000,
  });
  const purchaseRequest = new URL(page.url()).pathname;
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Ajukan" }).click();
  await expect(page).toHaveURL(/submitted=1/, { timeout: 30_000 });
  await switchUser(page, approver);
  await approve(page, purchaseRequest);
  await switchUser(page, operator);
  await page.goto(purchaseRequest);
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Buat Purchase Order" }).click();
  await expect(page).toHaveURL(/purchases\/orders\/[0-9a-f-]+\?converted=1/, {
    timeout: 30_000,
  });
  const po = new URL(page.url()).pathname;
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Ajukan" }).click();
  await expect(page).toHaveURL(/submitted=1/, { timeout: 30_000 });
  await switchUser(page, approver);
  await approve(page, po);
  await switchUser(page, operator);
  await page.goto(po);
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Buat Goods Receipt" }).click();
  await expect(page).toHaveURL(/purchases\/receipts\/[0-9a-f-]+\?converted=1/, {
    timeout: 30_000,
  });
  const receipt = new URL(page.url()).pathname;
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Ajukan" }).click();
  await expect(page).toHaveURL(/submitted=1/, { timeout: 30_000 });
  await switchUser(page, approver);
  await approve(page, receipt);
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Posting" }).click();
  await expect(page).toHaveURL(/posted=1/, { timeout: 30_000 });
  await expect(page.getByText(/^Jurnal:/)).toBeVisible();
  await page.goto("/inventory/stock");
  await expect(page.getByRole("row").filter({ hasText: sku })).toContainText(
    "5",
  );
  await switchUser(page, operator);
  await page.goto("/sales/quotations/new");
  await choose(page.getByLabel("Cabang"), "JKT");
  await choose(page.getByLabel("Pelanggan"), "CUST-001");
  await choose(page.getByLabel("Produk baris 1"), sku);
  await choose(page.getByLabel("Gudang baris 1"), "WH-JKT");
  await page.getByLabel("Kuantitas baris 1").fill("2");
  await page.getByLabel("Harga baris 1").fill("175000");
  await page.getByRole("button", { name: "Simpan draft" }).click();
  await expect(page).toHaveURL(/sales\/quotations\/[0-9a-f-]+\?saved=1/, {
    timeout: 30_000,
  });
  const quotation = new URL(page.url()).pathname;
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Ajukan" }).click();
  await expect(page).toHaveURL(/submitted=1/, { timeout: 30_000 });
  await switchUser(page, approver);
  await approve(page, quotation);
  await switchUser(page, operator);
  await page.goto(quotation);
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Buat Sales Order" }).click();
  await expect(page).toHaveURL(/sales\/orders\/[0-9a-f-]+\?converted=1/, {
    timeout: 30_000,
  });
  const so = new URL(page.url()).pathname;
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Ajukan" }).click();
  await expect(page).toHaveURL(/submitted=1/, { timeout: 30_000 });
  await switchUser(page, approver);
  await approve(page, so);
  await switchUser(page, operator);
  await page.goto(so);
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Buat Delivery" }).click();
  await expect(page).toHaveURL(/sales\/deliveries\/[0-9a-f-]+\?converted=1/, {
    timeout: 30_000,
  });
  const delivery = new URL(page.url()).pathname;
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Ajukan" }).click();
  await expect(page).toHaveURL(/submitted=1/, { timeout: 30_000 });
  await switchUser(page, approver);
  await approve(page, delivery);
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Posting" }).click();
  await expect(page).toHaveURL(/posted=1/, { timeout: 30_000 });
  await expect(page.getByText(/^Jurnal:/)).toBeVisible();
  await page.goto("/inventory/stock");
  await expect(page.getByRole("row").filter({ hasText: sku })).toContainText(
    "3",
  );
  await page.goto(so);
  await expect(page.getByText("completed", { exact: true })).toBeVisible();

  await switchUser(page, operator);
  await page.goto("/inventory/transfers/new");
  await choose(page.getByLabel("Cabang"), "JKT");
  await choose(page.getByLabel("Gudang sumber"), "WH-JKT");
  await choose(page.getByLabel("Gudang tujuan"), "WH-SBY");
  await page.getByLabel("Alasan").fill("Transfer pengujian antar gudang");
  await choose(page.getByLabel("Produk baris 1"), sku);
  await page.getByLabel("Kuantitas baris 1").fill("1");
  await page.getByRole("button", { name: "Simpan draft" }).click();
  await expect(page).toHaveURL(/inventory\/transfers\/[0-9a-f-]+\?saved=1/, {
    timeout: 30_000,
  });
  const transfer = new URL(page.url()).pathname;
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Ajukan" }).click();
  await expect(page).toHaveURL(/submitted=1/, { timeout: 30_000 });
  await switchUser(page, approver);
  await approve(page, transfer);
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Posting" }).click();
  await expect(page).toHaveURL(/posted=1/, { timeout: 30_000 });
  await page.goto("/inventory/stock");
  await expect(
    page
      .getByRole("row")
      .filter({ hasText: sku })
      .filter({ hasText: "Gudang Jakarta" }),
  ).toContainText("2");
  await expect(
    page
      .getByRole("row")
      .filter({ hasText: sku })
      .filter({ hasText: "Gudang Surabaya" }),
  ).toContainText("1");

  await switchUser(page, operator);
  await page.goto("/inventory/opname/new");
  await choose(page.getByLabel("Cabang"), "SBY");
  await choose(page.getByLabel("Gudang opname"), "WH-SBY");
  await choose(page.getByLabel("Akun lawan selisih"), "8400");
  await page.getByLabel("Alasan").fill("Hasil hitung fisik pengujian");
  await choose(page.getByLabel("Produk baris 1"), sku);
  await page.getByLabel("Hasil hitung baris 1").fill("2");
  await page.getByRole("button", { name: "Simpan draft" }).click();
  await expect(page).toHaveURL(/inventory\/opname\/[0-9a-f-]+\?saved=1/, {
    timeout: 30_000,
  });
  const stockCount = new URL(page.url()).pathname;
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Ajukan" }).click();
  await expect(page).toHaveURL(/submitted=1/, { timeout: 30_000 });
  await switchUser(page, approver);
  await approve(page, stockCount);
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Posting" }).click();
  await expect(page).toHaveURL(/posted=1/, { timeout: 30_000 });
  await expect(page.getByText(/^Jurnal:/)).toBeVisible();
  await page.goto("/inventory/stock");
  await expect(
    page
      .getByRole("row")
      .filter({ hasText: sku })
      .filter({ hasText: "Gudang Surabaya" }),
  ).toContainText("2");
});
