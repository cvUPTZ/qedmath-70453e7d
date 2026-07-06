import { test, expect } from "@playwright/test";

// Smoke test for the 17-stage diagnostic pipeline module, gated to admins
// only. This does not attempt to log in as an admin (auth is out of scope
// for a quick smoke check); it verifies the route is reachable and enforces
// its access-control gate rather than crashing or 404ing.
test.describe("/admin/diagnostic", () => {
  test("redirects or gates non-admin / unauthenticated visitors", async ({ page }) => {
    const response = await page.goto("/admin/diagnostic");
    expect(response?.ok()).toBeTruthy();

    // A visitor without an admin session must see either the explicit
    // "غير مصرح لك" gate, or be redirected to /auth — never the raw
    // pipeline dashboard itself.
    const redirectedToAuth = page.url().includes("/auth");
    if (!redirectedToAuth) {
      await expect(page.getByText("غير مصرح لك")).toBeVisible({ timeout: 10_000 });
    }
  });
});
