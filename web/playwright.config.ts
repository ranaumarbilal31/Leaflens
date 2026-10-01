import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  workers: 1,
  reporter: "list",
  expect: {
    timeout: process.env.LEAFLENS_URL?.startsWith("https:") ? 90_000 : 5_000,
  },
  timeout: process.env.LEAFLENS_URL?.startsWith("https:") ? 180_000 : 30_000,
  use: {
    baseURL: process.env.LEAFLENS_URL || "http://127.0.0.1:7860",
    trace: "retain-on-failure",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    {
      name: "mobile",
      use: { ...devices["iPhone 13"], defaultBrowserType: "chromium" },
    },
  ],
});
