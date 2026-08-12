import { expect, test, type Page } from "@playwright/test";
import { config } from "dotenv";

config({ path: ".env.local", quiet: true });

const operatorEmail = process.env.DEMO_OPERATOR_EMAIL;
const operatorPassword = process.env.DEMO_OPERATOR_PASSWORD;
const approverEmail = process.env.DEMO_APPROVER_EMAIL;
const approverPassword = process.env.DEMO_APPROVER_PASSWORD;

async function login(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Kata sandi", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Masuk ke Dasol" }).click();
  await expect(page).toHaveURL(/\/select-company$/);
  await page.getByRole("button").filter({ hasText: "DASOLDEMO" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}

async function createAndSubmitInvoice(page: Page, kind: "purchase" | "sales") {
  const base = kind === "sales" ? "/sales/invoices" : "/purchases/invoices";
  await page.goto(`${base}/new`);
  const branch = page.getByLabel("Cabang");
  await branch.selectOption(
    (await branch
      .locator("option")
      .filter({ hasText: "JKT" })
      .getAttribute("value"))!,
  );
  await page
    .getByRole("combobox", {
      name: kind === "sales" ? /^Pelanggan/ : /^Pemasok/,
    })
    .selectOption({ index: 1 });
  const product = page.getByLabel("Produk baris 1");
  await product.selectOption(
    (await product
      .locator("option")
      .filter({ hasText: "SRV-ACC" })
      .getAttribute("value"))!,
  );
  await page
    .getByLabel("Harga baris 1")
    .fill(kind === "sales" ? "275000" : "175000");
  const tax = page.getByLabel("Pajak baris 1");
  await tax.selectOption(
    (await tax
      .locator("option")
      .filter({ hasText: "PPN-CONTOH" })
      .getAttribute("value"))!,
  );
  await page.getByLabel("Catatan").fill(`Verifikasi workflow ${kind}`);
  await page.getByRole("button", { name: "Simpan draft" }).click();
  await expect(page).toHaveURL(/\/[0-9a-f-]+\?saved=1$/);
  const detailPath = new URL(page.url()).pathname;
  await expect(
    page.getByText("Draft invoice berhasil disimpan."),
  ).toBeVisible();
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Ajukan" }).click();
  await expect(page).toHaveURL(/submitted=1/);
  await expect(
    page.getByText("pending approval", { exact: true }),
  ).toBeVisible();
  return detailPath;
}

async function approveAndPost(page: Page, detailPath: string) {
  await page.goto(detailPath);
  await expect(
    page.getByRole("heading", { name: "Keputusan Persetujuan" }),
  ).toBeVisible();
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Setujui" }).click();
  await expect(page).toHaveURL(/approved=1/);
  await expect(page.getByText("approved", { exact: true })).toBeVisible();
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Posting" }).click();
  await expect(page).toHaveURL(/posted=1/);
  await expect(page.getByText("posted", { exact: true }).first()).toBeVisible();
  await expect(page.getByText(/^Jurnal:/)).toBeVisible();
}

test("sales and purchase invoices complete segregated draft-to-post workflows", async ({
  page,
}, testInfo) => {
  test.setTimeout(240_000);
  test.skip(
    testInfo.project.name.includes("mobile"),
    "Financial mutation flow runs once on desktop.",
  );
  test.skip(
    !operatorEmail || !operatorPassword || !approverEmail || !approverPassword,
    "Demo workflow credentials are not configured.",
  );

  await login(page, operatorEmail!, operatorPassword!);
  const salesPath = await createAndSubmitInvoice(page, "sales");
  const purchasePath = await createAndSubmitInvoice(page, "purchase");

  await page.context().clearCookies();
  await login(page, approverEmail!, approverPassword!);
  await approveAndPost(page, salesPath);
  await approveAndPost(page, purchasePath);

  await page.context().clearCookies();
  await login(page, operatorEmail!, operatorPassword!);
  const salesInvoiceId = salesPath.split("/").at(-1)!;
  await page.goto(`/sales/returns/new?invoice=${salesInvoiceId}`);
  await page.getByLabel(/Kuantitas SRV-ACC/).fill("1");
  await page.getByLabel("Alasan").fill("Koreksi layanan untuk pengujian retur");
  await page.getByRole("button", { name: "Simpan draft" }).click();
  await expect(page).toHaveURL(/sales\/returns\/[0-9a-f-]+\?saved=1/, {
    timeout: 30_000,
  });
  const returnPath = new URL(page.url()).pathname;
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Ajukan" }).click();
  await expect(page).toHaveURL(/submitted=1/, { timeout: 30_000 });

  await page.context().clearCookies();
  await login(page, approverEmail!, approverPassword!);
  await approveAndPost(page, returnPath);

  await page
    .getByLabel("Alasan")
    .fill("Membatalkan retur setelah verifikasi integritas");
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Reverse retur" }).click();
  await expect(page).toHaveURL(/reversed=1/, { timeout: 30_000 });
  await expect(page.getByText("reversed", { exact: true })).toBeVisible();

  await page.goto(salesPath);
  await expect(page.getByText("posted", { exact: true }).first()).toBeVisible();
});
