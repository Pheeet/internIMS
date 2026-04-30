import type { Page } from "@playwright/test";

export async function login(page: Page, email: string, password: string) {
  await page.goto("/intern/login");
  await page.waitForLoadState("networkidle");

  // Accept Terms of Service
  await page.locator("#tos").check();
  await page.waitForTimeout(200);

  // Fill credentials
  await page.locator("#email").fill(email);
  await page.locator("#password").fill(password);

  // Submit login
  await page
    .locator('button[type="button"]:has-text("เข้าสู่ระบบ")')
    .click();

  // Wait for redirect away from login and dashboard pages
  // Login action redirects to /intern/dashboard, which then redirects to /intern/admin or /intern/student
  await page.waitForURL(
    (url) =>
      url.pathname.startsWith("/intern/") &&
      url.pathname !== "/intern/login" &&
      url.pathname !== "/intern/dashboard",
    { timeout: 15_000 },
  );
  await page.waitForLoadState("networkidle");
}
