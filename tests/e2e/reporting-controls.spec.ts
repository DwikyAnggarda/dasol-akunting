import { expect, test, type Page } from "@playwright/test";
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
test("financial report catalog, drilldowns, CSV, and audit detail are reachable", async ({
  page,
}, testInfo) => {
  test.setTimeout(90_000);
  test.skip(
    testInfo.project.name.includes("mobile"),
    "Report suite runs once.",
  );
  const email = process.env.DEMO_ACCOUNTANT_EMAIL,
    password = process.env.DEMO_ACCOUNTANT_PASSWORD;
  test.skip(
    !email || !password,
    "Demo accountant credentials are not configured.",
  );
  await login(page, email!, password!);
  const reports = [
    ["general-ledger", "Buku Besar"],
    ["trial-balance", "Neraca Saldo"],
    ["profit-loss", "Laba Rugi"],
    ["balance-sheet", "Neraca"],
    ["cash-flow", "Arus Kas"],
    ["ar-aging", "Umur Piutang"],
    ["ap-aging", "Umur Utang"],
    ["tax", "Laporan Pajak"],
  ] as const;
  for (const [route, heading] of reports) {
    const response = await page.goto(`/reports/${route}`);
    expect(response?.status()).toBe(200);
    await expect(
      page.getByRole("heading", { level: 1, name: heading }),
    ).toBeVisible();
  }
  const csv = await page.request.get(
    "/api/reports/export?report=trial-balance&from=2026-01-01&to=2026-12-31",
    { maxRedirects: 0 },
  );
  const csvBody = await csv.text();
  const csvDiagnostic = `CSV response URL: ${csv.url()}\nRedirect: ${csv.headers().location ?? "-"}\n${csvBody.slice(0, 300)}`;
  expect(csv.status(), csvDiagnostic).toBe(200);
  expect(csv.headers()["content-type"], csvDiagnostic).toContain("text/csv");
  await page.goto("/audit-log");
  await page.getByRole("link", { name: "Lihat" }).first().click();
  await expect(
    page.getByRole("heading", { level: 1, name: /Audit / }),
  ).toBeVisible();
});
test("administrator can close and reopen a future period with an audit reason", async ({
  page,
}, testInfo) => {
  test.setTimeout(60_000);
  test.skip(
    testInfo.project.name.includes("mobile"),
    "Period mutation runs once.",
  );
  const email = process.env.DEMO_ADMIN_EMAIL,
    password = process.env.DEMO_ADMIN_PASSWORD;
  test.skip(!email || !password, "Demo admin credentials are not configured.");
  await login(page, email!, password!);
  await page.goto("/accounting/periods");
  let row = page.getByRole("row").filter({ hasText: "2026-12-01" });
  if (await row.getByRole("button", { name: "Buka kembali" }).count()) {
    await row.getByRole("textbox").fill("Persiapan ulang uji periode");
    page.once("dialog", (dialog) => dialog.accept());
    await row.getByRole("button", { name: "Buka kembali" }).click();
    await expect(page).toHaveURL(/reopened=1/);
    row = page.getByRole("row").filter({ hasText: "2026-12-01" });
  }
  page.once("dialog", (dialog) => dialog.accept());
  await row.getByRole("button", { name: "Tutup periode" }).click();
  await expect(page).toHaveURL(/closed=1/);
  row = page.getByRole("row").filter({ hasText: "2026-12-01" });
  await row.getByRole("textbox").fill("Dibuka kembali setelah uji kontrol E2E");
  page.once("dialog", (dialog) => dialog.accept());
  await row.getByRole("button", { name: "Buka kembali" }).click();
  await expect(page).toHaveURL(/reopened=1/);
});
