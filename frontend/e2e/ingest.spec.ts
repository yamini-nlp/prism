import { test, expect } from "@playwright/test";
import fs from "fs";
import os from "os";
import path from "path";
import { API_BASE_URL, mockAuthenticatedSession, mockHealth } from "./helpers/mock-api";

test.describe("ingest", () => {
  test("uploading a document moves it through processing to ready", async ({ page }) => {
    await mockAuthenticatedSession(page);
    await mockHealth(page);

    await page.route(`${API_BASE_URL}/api/v1/upload/`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ job_id: "job-e2e-1" }),
      });
    });

    await page.route(`${API_BASE_URL}/api/v1/jobs/job-e2e-1`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          status: "complete",
          stage: "ready",
          result: { preview: "This paper studies grounded retrieval.", source: "test-paper.txt" },
        }),
      });
    });

    await page.route(`${API_BASE_URL}/api/v1/summary/`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          summary: {
            tldr: "This paper studies grounded retrieval.",
            key_concepts: ["retrieval", "grounding"],
            methodology: "N/A",
            results: "N/A",
            limitations: "N/A",
          },
        }),
      });
    });

    const filePath = path.join(os.tmpdir(), "test-paper.txt");
    fs.writeFileSync(filePath, "This paper studies grounded retrieval augmented generation.");

    await page.goto("/ingest");
    await expect(page.getByText(/add sources/i)).toBeVisible();

    await page.setInputFiles("#ingest-file-input", filePath);

    await expect(page.getByText("test-paper.txt")).toBeVisible();
    await expect(page.getByText("Ready")).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(/test-paper\.txt ingested/i)).toBeVisible();
  });

  test("rejects an unsupported file type before uploading", async ({ page }) => {
    await mockAuthenticatedSession(page);
    await mockHealth(page);

    const filePath = path.join(os.tmpdir(), "unsupported.exe");
    fs.writeFileSync(filePath, "not a real document");

    await page.goto("/ingest");
    await page.setInputFiles("#ingest-file-input", filePath);

    await expect(page.getByText(/unsupported\.exe rejected/i)).toBeVisible();
    await expect(page.getByText(/unsupported file type/i)).toBeVisible();
  });
});