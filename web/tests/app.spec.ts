import { test, expect } from "@playwright/test";
import path from "node:path";
import AxeBuilder from "@axe-core/playwright";

test("real inference, reset, navigation and layout", async ({
  page,
}, testInfo) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Get to know your leaves." }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Check my leaf" }),
  ).toBeDisabled();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBeTruthy();
  await page.screenshot({
    path: `../.local/${testInfo.project.name}-home.png`,
    fullPage: true,
  });
  await page.getByRole("button", { name: "Try sample 1" }).click();
  await expect(page.getByAltText("Your selected leaf")).toBeVisible();
  await page.getByRole("button", { name: "Check my leaf" }).click();
  await expect(
    page.getByRole("heading", { name: "Pepper, bell", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Appears healthy", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("meter", { name: "Model confidence" }),
  ).toBeVisible();
  const audit = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(
    audit.violations.map((item) => ({
      id: item.id,
      nodes: item.nodes.map((node) => ({
        target: node.target,
        summary: node.failureSummary,
      })),
    })),
  ).toEqual([]);
  await page.screenshot({
    path: `../.local/${testInfo.project.name}-result.png`,
    fullPage: true,
  });
  await page.getByRole("button", { name: "Try sample 2" }).click();
  await expect(
    page.getByRole("heading", { name: "Pepper, bell", exact: true }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Check my leaf" }).click();
  await expect(
    page.getByRole("heading", { name: "Corn", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Check another leaf" }).click();
  await expect(
    page.getByRole("button", { name: "Check my leaf" }),
  ).toBeDisabled();
  await page
    .getByRole("navigation")
    .getByRole("link", { name: "How it works" })
    .click();
  await expect(page).toHaveURL(/how-it-works/);
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "A closer look at how it works." }),
  ).toBeVisible();
  await page
    .locator("summary")
    .filter({ hasText: /^Apple/ })
    .click();
  await expect(page.getByText("Apple scab", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Explore the source" }),
  ).toHaveAttribute("href", "https://github.com/ranaumarbilal31/leaflens");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBeTruthy();
  await page.screenshot({
    path: `../.local/${testInfo.project.name}-about.png`,
    fullPage: true,
  });
});

test("keyboard, invalid uploads, service failure and retry", async ({
  page,
}) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("link", { name: "Skip to content" }),
  ).toBeFocused();
  await page.getByLabel("Choose a leaf photo").setInputFiles({
    name: "notes.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("bad"),
  });
  await expect(page.getByRole("alert")).toContainText("JPEG or PNG");
  await page.getByLabel("Choose a leaf photo").setInputFiles({
    name: "large.png",
    mimeType: "image/png",
    buffer: Buffer.alloc(10 * 1024 * 1024 + 1),
  });
  await expect(page.getByRole("alert")).toContainText("under 10 MB");
  await page
    .getByLabel("Choose a leaf photo")
    .setInputFiles(path.resolve("../test images/3.png"));
  await page.route("**/api/predict", (route) =>
    route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({ detail: "Please try again shortly." }),
    }),
  );
  await page.getByRole("button", { name: "Check my leaf" }).click();
  await expect(page.getByRole("alert")).toContainText("try again");
  await expect(
    page.getByRole("button", { name: "Check my leaf" }),
  ).toBeEnabled();
  await page.unroute("**/api/predict");
  await page.getByRole("button", { name: "Check my leaf" }).click();
  await expect(
    page.getByRole("heading", { name: "Strawberry", exact: true }),
  ).toBeVisible();
});

test("a newer selection never shows an old response", async ({ page }) => {
  await page.goto("/");
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/api/predict", async (route) => {
    await gate;
    await route
      .fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          class_id: 19,
          label: "Pepper, bell - Healthy",
          plant: "Pepper, bell",
          condition: "Healthy",
          confidence: 99,
        }),
      })
      .catch(() => {});
  });
  await page.getByRole("button", { name: "Try sample 1" }).click();
  await page.getByRole("button", { name: "Check my leaf" }).click();
  await expect(page.getByText("Taking a closer look.")).toBeVisible();
  await expect(page.locator(".result-skeleton .skeleton")).toHaveCount(4);
  await page.getByRole("button", { name: "Try sample 2" }).click();
  release();
  await expect(
    page.getByRole("button", { name: "Check my leaf" }),
  ).toBeEnabled();
  await expect(
    page.getByRole("heading", { name: "Pepper, bell", exact: true }),
  ).toHaveCount(0);
  await expect(page.getByText("Sample 2.png", { exact: true })).toBeVisible();
  await expect(page.locator(".result-skeleton")).toHaveCount(0);
});

test("minimal coverage lists open by keyboard and show model categories", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator("#coverage-list")).toBeHidden();
  const plants = page.getByRole("button", { name: "14 supported plants" });
  await plants.focus();
  await page.keyboard.press("Enter");
  await expect(plants).toHaveAttribute("aria-expanded", "true");
  await expect(page.locator(".plant-grid li")).toHaveCount(14);
  await page.getByRole("button", { name: "38 leaf categories" }).click();
  await expect(plants).toHaveAttribute("aria-expanded", "false");
  await expect(page.locator(".coverage-categories li")).toHaveCount(38);
  await expect(page.locator(".coverage-categories")).toContainText(
    "Apple scab",
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
  const audit = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(audit.violations).toEqual([]);
  await page.getByRole("button", { name: "Close list" }).click();
  await expect(page.locator("#coverage-list")).toBeHidden();
});

test("coverage list recovers from a failed load", async ({ page }) => {
  await page.route("**/api/categories", (route) =>
    route.fulfill({ status: 503, body: "unavailable" }),
  );
  await page.goto("/");
  await page.getByRole("button", { name: "14 supported plants" }).click();
  await expect(page.getByRole("alert")).toContainText("couldn’t load");
  await page.unroute("**/api/categories");
  await page.getByRole("button", { name: "Try again", exact: true }).click();
  await expect(page.locator(".plant-grid li")).toHaveCount(14);
});

test("accessible home and explanation", async ({ page }) => {
  for (const route of ["/", "/how-it-works"]) {
    await page.goto(route);
    if (route === "/how-it-works")
      await expect(
        page.locator("summary").filter({ hasText: /^Apple/ }),
      ).toBeVisible();
    const audit = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(
      audit.violations.map((item) => ({
        id: item.id,
        nodes: item.nodes.map((node) => ({
          target: node.target,
          summary: node.failureSummary,
        })),
      })),
    ).toEqual([]);
  }
});
