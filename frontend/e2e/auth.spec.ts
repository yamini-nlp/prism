import { test, expect } from "@playwright/test";
import { mockDashboardDependencies, mockLogin, mockRegister } from "./helpers/mock-api";

test.describe("authentication", () => {
  test("registering a new account redirects to the dashboard", async ({ page }) => {
    await mockRegister(page, "newresearcher@prism.dev");
    await mockDashboardDependencies(page);

    await page.goto("/register");
    await expect(page.getByText(/create your account/i)).toBeVisible();

    await page.getByLabel(/^email$/i).fill("newresearcher@prism.dev");
    await page.getByLabel(/^password$/i).fill("password123");
    await page.getByLabel(/confirm password/i).fill("password123");
    await page.getByLabel(/confirm password/i).press("Tab");

    await expect(page.getByRole("button", { name: /create account/i })).toBeEnabled();
    await page.getByRole("button", { name: /create account/i }).click();

    await expect(page).toHaveURL(/\/dashboard/);
  });

  test("signing in with valid credentials redirects to the dashboard", async ({ page }) => {
    await mockLogin(page, "researcher@prism.dev");
    await mockDashboardDependencies(page);

    await page.goto("/login");
    await expect(page.getByText(/sign in to prism/i)).toBeVisible();

    await page.getByLabel(/email/i).fill("researcher@prism.dev");
    await page.getByLabel(/password/i).fill("password123");
    await page.getByLabel(/password/i).press("Tab");

    await expect(page.getByRole("button", { name: /sign in/i })).toBeEnabled();
    await page.getByRole("button", { name: /sign in/i }).click();

    await expect(page).toHaveURL(/\/dashboard/);
  });

  test("shows a field error and blocks submission for an invalid email", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel(/email/i).fill("not-an-email");
    await page.getByLabel(/password/i).fill("password123");
    await page.getByLabel(/password/i).press("Tab");

    await expect(page.getByText(/enter a valid email address/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /sign in/i })).toBeDisabled();
  });
});