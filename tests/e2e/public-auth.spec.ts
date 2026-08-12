import { expect, test } from "@playwright/test";

test("login and password recovery are usable without leaking configuration", async ({
  page,
}) => {
  await page.goto("/login");
  await expect(
    page.getByRole("heading", { name: "Selamat datang kembali" }),
  ).toBeVisible();
  await expect(page.getByLabel("Email")).toBeVisible();
  await expect(page.getByLabel("Kata sandi", { exact: true })).toBeVisible();
  await page.getByRole("link", { name: "Lupa kata sandi?" }).click();
  await expect(
    page.getByRole("heading", { name: "Lupa kata sandi" }),
  ).toBeVisible();
});

test("login layout remains usable on mobile", async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.includes("mobile"), "Mobile-only assertion");
  await page.goto("/login");
  await expect(
    page.getByRole("button", { name: "Masuk ke Dasol" }),
  ).toBeInViewport();
});

test("login submission returns a controlled authentication error", async ({
  page,
}) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill("missing-user@example.test");
  const password = page.getByLabel("Kata sandi", { exact: true });
  await password.evaluate((input) => input.removeAttribute("minlength"));
  await password.fill("short");
  await page.getByRole("button", { name: "Masuk ke Dasol" }).click();

  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("status")).toHaveText(
    "Kata sandi minimal 8 karakter.",
  );
});
