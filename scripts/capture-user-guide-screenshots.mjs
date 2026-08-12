import { mkdir } from "node:fs/promises";

import { chromium } from "@playwright/test";
import { config } from "dotenv";

config({ path: ".env.local", quiet: true });

const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";
const email = process.env.DEMO_ADMIN_EMAIL;
const password = process.env.DEMO_ADMIN_PASSWORD;

if (!email || !password) {
  throw new Error("Demo administrator credentials are not configured.");
}

const outputDirectory = "docs/user-guide/assets";
await mkdir(outputDirectory, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { height: 1000, width: 1440 } });

try {
  await page.goto(`${baseUrl}/login`, { waitUntil: "networkidle" });
  await page.screenshot({
    fullPage: true,
    path: `${outputDirectory}/login.png`,
  });

  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Kata sandi", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Masuk ke Dasol" }).click();
  await page.getByRole("button").filter({ hasText: "DASOLDEMO" }).waitFor();
  await page.screenshot({
    fullPage: true,
    path: `${outputDirectory}/company-selector.png`,
  });
  await page.getByRole("button").filter({ hasText: "DASOLDEMO" }).click();
  await page.waitForURL(/\/dashboard$/);
  await page.getByRole("heading", { name: "Ringkasan keuangan" }).waitFor();
  await page.screenshot({
    fullPage: true,
    path: `${outputDirectory}/dashboard-administrator.png`,
  });

  await page.goto(`${baseUrl}/sales/invoices`, { waitUntil: "networkidle" });
  await page
    .getByRole("heading", { name: "Invoice Penjualan", exact: true })
    .last()
    .waitFor();
  await page.screenshot({
    fullPage: true,
    path: `${outputDirectory}/sales-invoice-list.png`,
  });
} finally {
  await browser.close();
}
