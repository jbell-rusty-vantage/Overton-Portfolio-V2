import { defineConfig } from "@playwright/test";
import { existsSync } from "node:fs";

/** Focused office checks reuse the owner's running server; never start another. */
export default defineConfig({
  testDir: "./browser",
  testMatch: "reports.spec.ts",
  outputDir: "../.local-library/showcase-review/report-test-results",
  timeout: 60000,
  workers: 1,
  use: { baseURL: process.env.RELEASE_BASE_URL || "http://127.0.0.1:3078",
    ...(process.env.RELEASE_STORAGE_STATE ? { storageState: process.env.RELEASE_STORAGE_STATE } : {}), channel: "chrome", headless: true,
    launchOptions: { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ??
      (process.platform === "win32" && existsSync("C:/Program Files/Google/Chrome/Application/chrome.exe") ? "C:/Program Files/Google/Chrome/Application/chrome.exe" : undefined) },
    viewport: { width: 1366, height: 844 }, trace: "retain-on-failure" },
});
