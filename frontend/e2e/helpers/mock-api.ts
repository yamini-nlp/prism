import type { Page } from "@playwright/test";

export const API_BASE_URL = "http://localhost:8000";

export async function mockHealth(page: Page) {
  await page.route(`${API_BASE_URL}/health`, async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ status: "ok" }) });
  });
}

export async function mockEmptyDocuments(page: Page) {
  await page.route(`${API_BASE_URL}/api/v1/documents/**`, async (route) => {
    if (route.request().method() !== "GET") {
      await route.fallback();
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      headers: { "X-Total-Count": "0", "X-Has-More": "false" },
      body: JSON.stringify([]),
    });
  });
}

export async function mockAnalyticsSummary(page: Page) {
  await page.route(`${API_BASE_URL}/api/v1/analytics/summary`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        documents: { total: 0, over_time: [] },
        generations: { total: 0, average_confidence: null, over_time: [] },
        verifications: { total: 0, average_grounding_score: null, over_time: [] },
        active_jobs: 0,
        requests: { total_requests: 0, average_latency_ms: 0, by_route: [] },
      }),
    });
  });
}

export async function mockEvalReport(page: Page) {
  await page.route(`${API_BASE_URL}/eval-report`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ content: "", generated_at: new Date().toISOString() }),
    });
  });
}

export async function mockDashboardDependencies(page: Page) {
  await mockHealth(page);
  await mockEmptyDocuments(page);
  await mockAnalyticsSummary(page);
  await mockEvalReport(page);
}

export async function mockLogin(page: Page, email = "researcher@prism.dev") {
  await page.route(`${API_BASE_URL}/api/v1/auth/login`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        access_token: "test-access-token",
        refresh_token: "test-refresh-token",
        user: { id: "user-1", email, created_at: new Date().toISOString() },
      }),
    });
  });
}

export async function mockRegister(page: Page, email = "researcher@prism.dev") {
  await page.route(`${API_BASE_URL}/api/v1/auth/register`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        access_token: "test-access-token",
        refresh_token: "test-refresh-token",
        user: { id: "user-1", email, created_at: new Date().toISOString() },
      }),
    });
  });
}

export async function mockAuthenticatedSession(page: Page, email = "researcher@prism.dev") {
  await page.context().addCookies([
    {
      name: "prism_refresh_token",
      value: "test-refresh-token",
      domain: "localhost",
      path: "/",
      httpOnly: true,
      sameSite: "Lax",
    },
  ]);

  await page.route("**/api/auth/refresh", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        access_token: "test-access-token",
        user: { id: "user-1", email, created_at: new Date().toISOString() },
      }),
    });
  });
}
