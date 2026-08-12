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

test.describe("access and settings administration", () => {
  test.beforeEach(async ({ page }, testInfo) => {
    test.skip(
      testInfo.project.name.includes("mobile"),
      "Administrative mutations run once on desktop.",
    );
    const email = process.env.DEMO_ADMIN_EMAIL;
    const password = process.env.DEMO_ADMIN_PASSWORD;
    test.skip(
      !email || !password,
      "Demo admin credentials are not configured.",
    );
    await login(page, email!, password!);
  });

  test("administrator can reach company, mappings, users, and roles", async ({
    page,
  }) => {
    const routes = [
      ["/settings/company", "Pengaturan Perusahaan"],
      ["/settings/account-mapping", "Pemetaan Akun"],
      ["/settings/users", "Pengguna"],
      ["/settings/roles", "Roles & Permission"],
    ] as const;
    for (const [route, heading] of routes) {
      const response = await page.goto(route);
      expect(response?.status(), route).toBe(200);
      await expect(
        page.getByRole("heading", { level: 1, name: heading }),
      ).toBeVisible();
    }
  });

  test("custom role permissions are saved atomically and role can be deactivated", async ({
    page,
  }) => {
    const code = `qa_${Date.now()}`;
    await page.goto("/settings/roles/new");
    await page.getByLabel(/Kode role/).fill(code);
    await page.getByLabel(/Nama role/).fill("QA E2E Role");
    await page.getByRole("checkbox").first().check();
    await page.getByRole("button", { name: "Simpan role" }).click();
    await expect(page).toHaveURL(/\/settings\/roles\/[0-9a-f-]+\?saved=1$/, {
      timeout: 30_000,
    });
    await expect(
      page.getByRole("heading", { level: 1, name: "QA E2E Role" }),
    ).toBeVisible();

    await page.goto("/settings/roles");
    const row = page.getByRole("row").filter({ hasText: code });
    await expect(row).toContainText("1 izin");
    page.once("dialog", (dialog) => dialog.accept());
    await row.getByRole("button", { name: "Nonaktifkan" }).click();
    await expect(page).toHaveURL(/statusChanged=1/);
    await expect(page.getByRole("row").filter({ hasText: code })).toContainText(
      "inactive",
    );
  });
});

test("viewer cannot access role administration", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name.includes("mobile"), "Role check runs once.");
  const email = process.env.DEMO_VIEWER_EMAIL;
  const password = process.env.DEMO_VIEWER_PASSWORD;
  test.skip(!email || !password, "Demo viewer credentials are not configured.");
  await login(page, email!, password!);
  await page.goto("/settings/roles");
  await expect(page).toHaveURL(/\/unauthorized$/);
});
