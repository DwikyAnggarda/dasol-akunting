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

async function chooseByText(locator: Locator, text: string) {
  const value = await locator
    .locator("option")
    .filter({ hasText: text })
    .first()
    .getAttribute("value");
  expect(value).toBeTruthy();
  await locator.selectOption(value!);
}

test("inventory adjustment updates stock, journal, approval trail, and can be reversed", async ({
  page,
}, testInfo) => {
  test.setTimeout(150_000);
  test.skip(
    testInfo.project.name.includes("mobile"),
    "Inventory mutation runs once.",
  );
  const credentials = {
    admin: [process.env.DEMO_ADMIN_EMAIL, process.env.DEMO_ADMIN_PASSWORD],
    approver: [
      process.env.DEMO_APPROVER_EMAIL,
      process.env.DEMO_APPROVER_PASSWORD,
    ],
    operator: [
      process.env.DEMO_OPERATOR_EMAIL,
      process.env.DEMO_OPERATOR_PASSWORD,
    ],
  } as const;
  test.skip(
    Object.values(credentials)
      .flat()
      .some((value) => !value),
    "Demo credentials are not configured.",
  );

  await login(page, credentials.admin[0]!, credentials.admin[1]!);
  const suffix = Date.now().toString().slice(-8);
  const sku = `INV-${suffix}`;
  await page.goto("/master/products/new");
  await page.getByLabel("SKU").fill(sku);
  await page.getByLabel("Nama produk").fill("Produk Inventory E2E");
  await page.getByLabel("Tipe produk").selectOption("inventory");
  await chooseByText(page.getByLabel("Satuan dasar"), "PCS");
  await chooseByText(page.getByLabel("Akun penjualan"), "4100");
  await chooseByText(page.getByLabel("Akun pembelian/beban"), "8400");
  await chooseByText(page.getByLabel("Akun persediaan"), "1300");
  await chooseByText(page.getByLabel("Akun HPP"), "5100");
  await page.getByRole("button", { name: "Simpan" }).click();
  await expect(page).toHaveURL(/\/master\/products\?saved=1$/);

  await page.context().clearCookies();
  await login(page, credentials.operator[0]!, credentials.operator[1]!);
  await page.goto("/inventory/adjustments/new");
  await chooseByText(page.getByLabel("Cabang"), "JKT");
  await chooseByText(page.getByLabel("Gudang"), "WH-JKT");
  await chooseByText(page.getByLabel("Akun lawan"), "3100");
  await page.getByLabel("Alasan").fill("Saldo awal verifikasi inventory E2E");
  await chooseByText(page.getByLabel("Produk baris 1"), sku);
  await page.getByLabel("Kuantitas baris 1").fill("10");
  await page.getByLabel("Biaya unit baris 1").fill("125000");
  await page.getByRole("button", { name: "Simpan draft" }).click();
  await expect(page).toHaveURL(
    /\/inventory\/adjustments\/[0-9a-f-]+\?saved=1$/,
    { timeout: 30_000 },
  );
  const detail = new URL(page.url()).pathname;
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Ajukan" }).click();
  await expect(page).toHaveURL(/submitted=1/);

  await page.context().clearCookies();
  await login(page, credentials.approver[0]!, credentials.approver[1]!);
  await page.goto(detail);
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Setujui" }).click();
  await expect(page).toHaveURL(/approved=1/);
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Posting" }).click();
  await expect(page).toHaveURL(/posted=1/);
  await expect(page.getByText(/^Jurnal:/)).toBeVisible();

  await page.goto("/inventory/stock");
  const stockRow = page.getByRole("row").filter({ hasText: sku });
  await expect(stockRow).toContainText("10");
  const stockCardHref = await stockRow
    .getByRole("link", { name: "Kartu stok" })
    .getAttribute("href");
  await page.goto(stockCardHref!);
  await expect(page.getByText("adjustment_in", { exact: true })).toBeVisible();

  await page.goto(detail);
  await page
    .getByLabel("Alasan")
    .fill("Membalik saldo awal setelah verifikasi E2E");
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Reverse adjustment" }).click();
  await expect(page).toHaveURL(/reversed=1/);
  await expect(page.getByText("reversed", { exact: true })).toBeVisible();
  await expect(page.getByText(/^Jurnal reversal:/)).toBeVisible();
});
