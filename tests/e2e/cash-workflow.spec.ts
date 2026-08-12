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
test("cash in follows segregated approval, posting, journal, and reversal", async ({
  page,
}, testInfo) => {
  test.setTimeout(100_000);
  test.skip(
    testInfo.project.name.includes("mobile"),
    "Cash mutation runs once.",
  );
  const operator = [
      process.env.DEMO_OPERATOR_EMAIL,
      process.env.DEMO_OPERATOR_PASSWORD,
    ] as const,
    approver = [
      process.env.DEMO_APPROVER_EMAIL,
      process.env.DEMO_APPROVER_PASSWORD,
    ] as const;
  test.skip(
    [...operator, ...approver].some((value) => !value),
    "Demo credentials are not configured.",
  );
  await login(page, operator[0]!, operator[1]!);
  await page.goto("/cash-bank/transactions/new");
  await page.getByLabel("Tipe transaksi").selectOption("cash_in");
  await choose(page.getByLabel("Cabang"), "JKT");
  await choose(page.getByLabel("Akun sumber / penerima"), "BANK-IDR");
  await choose(page.getByLabel("Akun lawan"), "7100");
  await page.getByLabel("Jumlah").fill("350000");
  await page.getByLabel("Referensi").fill(`E2E-${Date.now()}`);
  await page.getByLabel("Keterangan").fill("Penerimaan kas verifikasi E2E");
  await page.getByRole("button", { name: "Simpan draft" }).click();
  await expect(page).toHaveURL(
    /\/cash-bank\/transactions\/[0-9a-f-]+\?saved=1$/,
    { timeout: 30_000 },
  );
  const detail = new URL(page.url()).pathname;
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Ajukan" }).click();
  await expect(page).toHaveURL(/submitted=1/);
  await page.context().clearCookies();
  await login(page, approver[0]!, approver[1]!);
  await page.goto(detail);
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Setujui" }).click();
  await expect(page).toHaveURL(/approved=1/, { timeout: 30_000 });
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Posting" }).click();
  await expect(page).toHaveURL(/posted=1/);
  await expect(page.getByText(/^Jurnal:/)).toBeVisible();
  await page
    .getByLabel("Alasan")
    .fill("Reversal setelah pengujian transaksi kas");
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Reverse transaksi" }).click();
  await expect(page).toHaveURL(/reversed=1/);
  await expect(page.getByText(/^Jurnal reversal:/)).toBeVisible();
});
