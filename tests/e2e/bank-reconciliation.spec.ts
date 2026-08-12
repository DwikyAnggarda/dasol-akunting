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
async function switchUser(
  page: Page,
  credentials: readonly [string | undefined, string | undefined],
) {
  await page.context().clearCookies();
  await login(page, credentials[0]!, credentials[1]!);
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
test("CSV bank statement can be matched, unmatched, rematched, and finalized", async ({
  page,
}, testInfo) => {
  test.setTimeout(180_000);
  test.skip(
    testInfo.project.name.includes("mobile"),
    "Mutation flow runs once.",
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
  const suffix = Date.now().toString().slice(-7),
    bankCode = `REC-${suffix}`,
    amount = Number(`4${suffix.slice(-5)}`);
  await login(page, admin[0]!, admin[1]!);
  await page.goto("/cash-bank/accounts/new");
  await page.getByLabel("Kode").fill(bankCode);
  await page.getByLabel("Nama akun").fill(`Bank Rekonsiliasi ${suffix}`);
  await page.getByLabel("Tipe").selectOption("bank");
  await page.getByLabel("Nama bank").fill("Bank E2E");
  await page
    .getByLabel("Nomor rekening tersamarkan")
    .fill(`****${suffix.slice(-4)}`);
  await choose(page.getByLabel("Akun GL"), "1100");
  await page.getByRole("button", { name: "Simpan" }).click();
  await expect(page).toHaveURL(/accounts\?saved=1/, { timeout: 30_000 });
  await switchUser(page, operator);
  await page.goto("/cash-bank/transactions/new");
  await page.getByLabel("Tipe transaksi").selectOption("cash_in");
  await choose(page.getByLabel("Cabang"), "JKT");
  await choose(page.getByLabel("Akun sumber / penerima"), bankCode);
  await choose(page.getByLabel("Akun lawan"), "7100");
  await page.getByLabel("Jumlah").fill(String(amount));
  await page.getByLabel("Referensi").fill(`REC-${suffix}`);
  await page.getByLabel("Keterangan").fill("Penerimaan untuk rekonsiliasi E2E");
  await page.getByRole("button", { name: "Simpan draft" }).click();
  await expect(page).toHaveURL(/transactions\/[0-9a-f-]+\?saved=1/, {
    timeout: 30_000,
  });
  const transaction = new URL(page.url()).pathname;
  page.once("dialog", (d) => d.accept());
  await page.getByRole("button", { name: "Ajukan" }).click();
  await expect(page).toHaveURL(/submitted=1/, { timeout: 30_000 });
  await switchUser(page, approver);
  await page.goto(transaction);
  page.once("dialog", (d) => d.accept());
  await page.getByRole("button", { name: "Setujui" }).click();
  await expect(page).toHaveURL(/approved=1/, { timeout: 30_000 });
  page.once("dialog", (d) => d.accept());
  await page.getByRole("button", { name: "Posting" }).click();
  await expect(page).toHaveURL(/posted=1/, { timeout: 30_000 });
  await switchUser(page, admin);
  await page.goto("/cash-bank/reconciliations/new");
  await choose(page.getByLabel("Akun bank"), bankCode);
  await page.getByLabel("Saldo pembukaan").fill("0");
  await page.getByLabel("Saldo penutupan").fill(String(amount));
  const date = await page.getByLabel("Tanggal statement").inputValue();
  await page
    .getByLabel("CSV statement")
    .setInputFiles({
      name: "statement.csv",
      mimeType: "text/csv",
      buffer: Buffer.from(
        `date,description,reference,amount\n${date},Penerimaan rekonsiliasi,REC-${suffix},${amount}`,
      ),
    });
  await expect(page.getByText("Penerimaan rekonsiliasi")).toBeVisible();
  await page.getByRole("button", { name: "Import statement" }).click();
  await expect(page).toHaveURL(/reconciliations\/[0-9a-f-]+\?saved=1/, {
    timeout: 30_000,
  });
  const reconciliation = new URL(page.url()).pathname;
  await page.getByLabel("Transaksi cocok").selectOption({ index: 1 });
  await page.getByRole("button", { name: "Match" }).click();
  await expect(page).toHaveURL(/matched=1/, { timeout: 30_000 });
  await page.getByRole("button", { name: "Unmatch" }).click();
  await expect(page).toHaveURL(/unmatched=1/, { timeout: 30_000 });
  await page.getByLabel("Transaksi cocok").selectOption({ index: 1 });
  await page.getByRole("button", { name: "Match" }).click();
  await expect(page).toHaveURL(/matched=1/, { timeout: 30_000 });
  page.once("dialog", (d) => d.accept());
  await page.getByRole("button", { name: "Finalisasi" }).click();
  await expect(page).toHaveURL(/finalized=1/, { timeout: 30_000 });
  await expect(page.getByText("finalized", { exact: true })).toBeVisible();
  await page.goto(reconciliation);
  await expect(page.getByText("finalized", { exact: true })).toBeVisible();
});
