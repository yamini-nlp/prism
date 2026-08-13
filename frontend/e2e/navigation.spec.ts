import { test, expect } from "@playwright/test";
import { mockAuthenticatedSession, mockEmptyDocuments, mockHealth } from "./helpers/mock-api";

test.describe("navigation", () => {
  test.beforeEach(async ({ page }) => {
    await mockAuthenticatedSession(page);
    await mockHealth(page);
    await mockEmptyDocuments(page);
  });

  test("sidebar links navigate to library, source trace, and verification", async ({ page }) => {
    await page.goto("/dashboard");

    await page.getByRole("navigation", { name: /primary navigation/i }).getByRole("link", { name: /library/i }).click();
    await expect(page).toHaveURL(/\/library/);
    await expect(page.getByRole("heading", { name: /your research library/i })).toBeVisible();

    await page.getByRole("navigation", { name: /primary navigation/i }).getByRole("link", { name: /source trace/i }).click();
    await expect(page).toHaveURL(/\/source-trace/);
    await expect(page.getByRole("heading", { name: /retrieval transparency/i })).toBeVisible();

    await page.getByRole("navigation", { name: /primary navigation/i }).getByRole("link", { name: /verification/i }).click();
    await expect(page).toHaveURL(/\/verification/);
    await expect(page.getByRole("heading", { name: /answer verification/i })).toBeVisible();
  });

  test("visiting library directly renders the library page", async ({ page }) => {
    await page.goto("/library");
    await expect(page.getByRole("heading", { name: /your research library/i })).toBeVisible();
    await expect(page.getByPlaceholder(/search by title/i)).toBeVisible();
  });

  test("visiting source-trace directly renders the source trace page", async ({ page }) => {
    await page.goto("/source-trace");
    await expect(page.getByRole("heading", { name: /retrieval transparency/i })).toBeVisible();
  });

  test("visiting verification directly renders the verification page", async ({ page }) => {
    await page.goto("/verification");
    await expect(page.getByRole("heading", { name: /answer verification/i })).toBeVisible();
  });
});