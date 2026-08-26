import { test, expect } from "@playwright/test";
import { API_BASE_URL, mockAuthenticatedSession, mockEmptyDocuments, mockHealth } from "./helpers/mock-api";

test.describe("workspace", () => {
  test("sending a message streams back a grounded answer", async ({ page }) => {
    await mockAuthenticatedSession(page);
    await mockHealth(page);
    await mockEmptyDocuments(page);

    const sse =
      `event: retrieval\ndata: {"citations":[{"id":"c1","text":"RAG grounds answers in retrieved context.","source":"paper.pdf","score":0.92,"chunk_index":0}],"confidence_score":88}\n\n` +
      `event: token\ndata: {"token":"Retrieval-augmented "}\n\n` +
      `event: token\ndata: {"token":"generation grounds each answer in your documents."}\n\n` +
      `event: done\ndata: {"answer":"Retrieval-augmented generation grounds each answer in your documents.","confidence_score":91,"citations":[{"id":"c1","text":"RAG grounds answers in retrieved context.","source":"paper.pdf","score":0.92,"chunk_index":0}],"grounding":[{"claim":"RAG grounds answers.","label":"supported","confidence":90,"supporting_chunk":"c1"}]}\n\n`;

    await page.route(`${API_BASE_URL}/api/v1/generate/`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "text/event-stream",
        body: sse,
      });
    });

    await page.goto("/workspace");
    await expect(page.getByText(/query your research/i)).toBeVisible();

    const textarea = page.getByPlaceholder(/ask a question grounded in your research/i);
    await textarea.fill("What does this paper find?");
    await textarea.press("Enter");

    await expect(page.getByText("What does this paper find?")).toBeVisible();
    await expect(
      page.getByText("Retrieval-augmented generation grounds each answer in your documents.")
    ).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(/91%/)).toBeVisible();
  });

  test("shows an error and allows retry when generation fails", async ({ page }) => {
    await mockAuthenticatedSession(page);
    await mockHealth(page);
    await mockEmptyDocuments(page);

    await page.route(`${API_BASE_URL}/api/v1/generate/`, async (route) => {
      await route.fulfill({ status: 500, contentType: "text/plain", body: "Internal Server Error" });
    });

    await page.goto("/workspace");
    const textarea = page.getByPlaceholder(/ask a question grounded in your research/i);
    await textarea.fill("What does this paper find?");
    await textarea.press("Enter");

    await expect(page.getByText(/request failed with status 500/i)).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole("button", { name: /retry/i })).toBeVisible();
  });
});
