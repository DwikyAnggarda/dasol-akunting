import { expect, test, type Page } from "@playwright/test";
import { config } from "dotenv";
config({ path: ".env.local", quiet: true });
const email = process.env.DEMO_ACCOUNTANT_EMAIL,
  password = process.env.DEMO_ACCOUNTANT_PASSWORD;
async function login(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email!);
  await page.getByLabel("Kata sandi", { exact: true }).fill(password!);
  await page.getByRole("button", { name: "Masuk ke Dasol" }).click();
  await page.getByRole("button").filter({ hasText: "DASOLDEMO" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}
async function selectMatching(page: Page, label: string, text: string) {
  const select = page.getByLabel(label);
  await select.selectOption(
    (await select
      .locator("option")
      .filter({ hasText: text })
      .getAttribute("value"))!,
  );
}
test("balanced manual journal posts and reverses with an immutable trail", async ({
  page,
}, testInfo) => {
  test.setTimeout(60_000);
  test.skip(
    testInfo.project.name.includes("mobile"),
    "Financial mutation runs once.",
  );
  test.skip(
    !email || !password,
    "Demo accountant credentials are not configured.",
  );
  await login(page);
  await page.goto("/accounting/journals/new");
  await selectMatching(page, "Cabang", "JKT");
  await page.getByLabel("Keterangan").fill("Verifikasi jurnal manual E2E");
  await selectMatching(page, "Akun baris 1", "6500");
  await page.getByLabel("Debit baris 1").fill("1000");
  await selectMatching(page, "Akun baris 2", "1100");
  await page.getByLabel("Kredit baris 2").fill("1000");
  await page.getByRole("button", { name: "Posting jurnal" }).click();
  await expect(page).toHaveURL(/\/accounting\/journals\/[0-9a-f-]+\?posted=1$/);
  await expect(page.getByText("Jurnal berhasil diposting.")).toBeVisible();
  await page.getByLabel("Alasan").fill("Reversal verifikasi jurnal E2E");
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Reverse jurnal" }).click();
  await expect(page).toHaveURL(/reversed=1/);
  await expect(page.getByText(/Sudah direversal oleh jurnal/)).toBeVisible();
});
