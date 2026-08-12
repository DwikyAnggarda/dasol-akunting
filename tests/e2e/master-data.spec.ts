import { expect, test, type Page } from "@playwright/test";
import { config } from "dotenv";

config({ path: ".env.local", quiet: true });

const adminEmail = process.env.DEMO_ADMIN_EMAIL;
const adminPassword = process.env.DEMO_ADMIN_PASSWORD;
const viewerEmail = process.env.DEMO_VIEWER_EMAIL;
const viewerPassword = process.env.DEMO_VIEWER_PASSWORD;

async function login(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Kata sandi", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Masuk ke Dasol" }).click();
  await expect(page).toHaveURL(/\/select-company$/);
  await page.getByRole("button").filter({ hasText: "DASOLDEMO" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}

test.describe("master data end-to-end", () => {
  test.beforeEach(async ({ page }, testInfo) => {
    test.skip(
      testInfo.project.name.includes("mobile"),
      "Mutation flow runs once on desktop.",
    );
    test.skip(
      !adminEmail || !adminPassword,
      "Demo admin credentials are not configured.",
    );
    await login(page, adminEmail!, adminPassword!);
  });

  test("admin can open every master-data workflow", async ({ page }) => {
    const routes = [
      ["/master/accounts", "Daftar Akun"],
      ["/master/accounts/new", "Tambah Akun"],
      ["/master/contacts", "Pelanggan & Pemasok"],
      ["/master/contacts/new", "Tambah Pelanggan/Pemasok"],
      ["/master/products", "Produk & Jasa"],
      ["/master/products/new", "Tambah Produk/Jasa"],
      ["/master/warehouses", "Gudang"],
      ["/master/warehouses/new", "Tambah Gudang"],
      ["/master/taxes", "Kode Pajak"],
      ["/master/taxes/new", "Tambah Kode Pajak"],
      ["/cash-bank/accounts", "Akun Bank & Kas"],
      ["/cash-bank/accounts/new", "Tambah Akun Bank/Kas"],
    ] as const;

    for (const [route, heading] of routes) {
      const response = await page.goto(route);
      expect(response?.status(), route).toBe(200);
      await expect(
        page.getByRole("heading", { level: 1, name: heading, exact: true }),
      ).toBeVisible();
    }
  });

  test("account create, edit, and deactivate persists", async ({ page }) => {
    const suffix = Date.now().toString().slice(-8);
    const code = `E2E${suffix}`;

    await page.goto("/master/accounts/new");
    await page.getByLabel("Kode akun").fill(code);
    await page.getByLabel("Nama akun").fill("Akun verifikasi E2E");
    await page.getByLabel("Tipe akun").selectOption("asset");
    await page.getByLabel("Saldo normal").selectOption("debit");
    await page.getByRole("button", { name: "Simpan" }).click();
    await expect(page).toHaveURL(/\/master\/accounts\?saved=1$/);

    const row = page.getByRole("row").filter({ hasText: code });
    await expect(row).toContainText("Akun verifikasi E2E");
    await row.getByRole("link", { name: "Edit" }).click();
    await page.getByLabel("Nama akun").fill("Akun verifikasi E2E diperbarui");
    await page.getByRole("button", { name: "Simpan" }).click();
    await expect(page.getByRole("row").filter({ hasText: code })).toContainText(
      "diperbarui",
    );

    page.once("dialog", (dialog) => dialog.accept());
    await page
      .getByRole("row")
      .filter({ hasText: code })
      .getByRole("button", { name: "Nonaktifkan" })
      .click();
    await expect(page).toHaveURL(/statusChanged=1/);
    await expect(page.getByRole("row").filter({ hasText: code })).toContainText(
      "inactive",
    );
  });

  test("contact is saved atomically with its primary address", async ({
    page,
  }) => {
    const suffix = Date.now().toString().slice(-8);
    const code = `CT${suffix}`;
    await page.goto("/master/contacts/new");
    await page.getByLabel("Kode kontak").fill(code);
    await page.getByLabel("Tipe kontak").selectOption("customer");
    await page.getByLabel("Nama tampilan").fill("Kontak verifikasi E2E");
    await page.getByLabel("Email").fill(`${code.toLowerCase()}@example.test`);
    await page.getByLabel("Alamat").fill("Jl. Pengujian No. 1");
    await page.getByLabel("Kota").fill("Jakarta");
    await page.getByRole("button", { name: "Simpan" }).click();
    await expect(page).toHaveURL(/\/master\/contacts\/[0-9a-f-]+\?saved=1$/);
    await expect(page.getByText("Jl. Pengujian No. 1, Jakarta")).toBeVisible();
  });
});

test("viewer cannot open a protected create page", async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name.includes("mobile"),
    "Role check runs once on desktop.",
  );
  test.skip(
    !viewerEmail || !viewerPassword,
    "Demo viewer credentials are not configured.",
  );
  await login(page, viewerEmail!, viewerPassword!);
  await page.goto("/master/accounts/new");
  await expect(page).toHaveURL(/\/unauthorized$/);
});
