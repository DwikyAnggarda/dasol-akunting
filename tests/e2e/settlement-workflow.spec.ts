import { expect, test, type Page } from "@playwright/test";
import { config } from "dotenv";

config({ path: ".env.local", quiet: true });

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

async function login(page: Page, role: keyof typeof credentials) {
  const [email, password] = credentials[role];
  await page.goto("/login");
  await page.getByLabel("Email").fill(email!);
  await page.getByLabel("Kata sandi", { exact: true }).fill(password!);
  await page.getByRole("button", { name: "Masuk ke Dasol" }).click();
  await page.getByRole("button").filter({ hasText: "DASOLDEMO" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}

async function createDraft(page: Page, kind: "customer" | "supplier") {
  const base = kind === "customer" ? "/sales/receipts" : "/purchases/payments";
  await page.goto(`${base}/new`);
  const branch = page.getByLabel("Cabang");
  await branch.selectOption(
    (await branch
      .locator("option")
      .filter({ hasText: "JKT" })
      .getAttribute("value"))!,
  );
  const contact = page.getByRole("combobox", {
    name: kind === "customer" ? /^Pelanggan/ : /^Pemasok/,
  });
  if (kind === "customer") {
    await contact.selectOption({ index: 1 });
  } else {
    await contact.selectOption(
      (await contact
        .locator("option")
        .filter({ hasText: "SUP-001" })
        .getAttribute("value"))!,
    );
  }
  await page.getByLabel("Akun bank/kas").selectOption({ index: 1 });
  const allocation = page
    .getByRole("spinbutton", { name: /^Alokasi / })
    .first();
  await expect(allocation).toBeVisible();
  await allocation.fill("50000");
  await page.getByLabel("Catatan").fill(`Verifikasi settlement ${kind}`);
  await page.getByRole("button", { name: "Simpan draft" }).click();
  await expect(page).toHaveURL(/\/[0-9a-f-]+\?saved=1$/);
  await expect(
    page.getByText("Draft pembayaran berhasil disimpan."),
  ).toBeVisible();
  return new URL(page.url()).pathname;
}

async function post(page: Page, path: string) {
  await page.goto(path);
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Posting" }).click();
  await expect(page).toHaveURL(/posted=1/);
  await expect(page.getByText("posted", { exact: true }).first()).toBeVisible();
  await expect(page.getByText(/^Jurnal:/)).toBeVisible();
}

test("receipt and supplier payment allocate, post, and reverse safely", async ({
  page,
}, testInfo) => {
  test.setTimeout(120_000);
  test.skip(
    testInfo.project.name.includes("mobile"),
    "Financial mutation flow runs once on desktop.",
  );
  test.skip(
    Object.values(credentials)
      .flat()
      .some((value) => !value),
    "Demo workflow credentials are not configured.",
  );
  await login(page, "operator");
  const receiptPath = await createDraft(page, "customer");
  const paymentPath = await createDraft(page, "supplier");

  await page.context().clearCookies();
  await login(page, "approver");
  await post(page, receiptPath);
  await post(page, paymentPath);

  await page.context().clearCookies();
  await login(page, "admin");
  await page.goto(receiptPath);
  await page
    .getByLabel("Alasan")
    .fill("Reversal otomatis untuk verifikasi E2E");
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Reverse pembayaran" }).click();
  await expect(page).toHaveURL(/reversed=1/);
  await expect(
    page.getByText("reversed", { exact: true }).first(),
  ).toBeVisible();
});
