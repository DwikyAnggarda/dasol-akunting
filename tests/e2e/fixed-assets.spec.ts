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

test("fixed asset category, activation, depreciation, and write-off create journals", async ({
  page,
}, testInfo) => {
  test.setTimeout(120_000);
  test.skip(
    testInfo.project.name.includes("mobile"),
    "Fixed asset mutation runs once.",
  );
  const email = process.env.DEMO_ACCOUNTANT_EMAIL;
  const password = process.env.DEMO_ACCOUNTANT_PASSWORD;
  test.skip(
    !email || !password,
    "Demo accountant credentials are not configured.",
  );
  await login(page, email!, password!);

  const suffix = Date.now().toString().slice(-8);
  const categoryCode = `FA${suffix}`;
  await page.goto("/fixed-assets/categories/new");
  await page.getByLabel("Kode").fill(categoryCode);
  await page.getByLabel("Nama").fill("Peralatan Uji E2E");
  await choose(page.getByLabel("Akun aset"), "1600");
  await choose(page.getByLabel("Akun akumulasi penyusutan"), "1610");
  await choose(page.getByLabel("Akun beban penyusutan"), "6400");
  await page.getByLabel("Masa manfaat default").fill("12");
  await page.getByRole("button", { name: "Simpan" }).click();
  await expect(page).toHaveURL(/\/fixed-assets\/categories\?saved=1$/);

  const assetCode = `AST${suffix}`;
  await page.goto("/fixed-assets/new");
  await page.getByLabel("Kode aset").fill(assetCode);
  await page.getByLabel("Nama aset").fill("Laptop Uji Penyusutan");
  await choose(page.getByLabel("Kategori"), categoryCode);
  await page.getByLabel("Tanggal akuisisi").fill("2026-01-01");
  await page.getByLabel("Tanggal in-service").fill("2026-01-01");
  await page.getByLabel("Biaya perolehan").fill("12000000");
  await page.getByLabel("Nilai residu").fill("0");
  await page.getByLabel("Masa manfaat \(bulan\)").fill("12");
  await page.getByRole("button", { name: "Simpan draft" }).click();
  await expect(page).toHaveURL(/\/fixed-assets\/[0-9a-f-]+\?saved=1$/, {
    timeout: 30_000,
  });

  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Aktifkan" }).click();
  await expect(page).toHaveURL(/activated=1/);
  await expect(page.getByRole("row")).toHaveCount(13);

  await page.getByLabel("Posting sampai tanggal").fill("2026-07-31");
  await page
    .getByRole("button", { name: "Posting penyusutan jatuh tempo" })
    .click();
  await expect(page).toHaveURL(/depreciated=7/);
  await expect(page.getByText("Rp 7.000.000", { exact: true })).toBeVisible();

  await page.getByLabel("Tanggal disposal").fill("2026-08-12");
  await page.getByLabel("Hasil disposal").fill("0");
  await choose(page.getByLabel("Akun laba/rugi disposal"), "8100");
  await page
    .getByLabel("Alasan disposal")
    .fill("Write-off setelah pengujian lifecycle aset");
  await page.getByRole("button", { name: "Posting disposal" }).click();
  await expect(page).toHaveURL(/disposed=1/);
  await expect(page.getByText("disposed", { exact: true })).toBeVisible();
  await expect(page.getByText(/^Jurnal disposal:/)).toBeVisible();
});
