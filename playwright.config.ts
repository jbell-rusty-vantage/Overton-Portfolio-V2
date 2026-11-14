import { defineConfig } from "@playwright/test";
import { existsSync } from "node:fs";
const chrome = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ??
  (process.platform === "win32" && existsSync("C:/Program Files/Google/Chrome/Application/chrome.exe")
    ? "C:/Program Files/Google/Chrome/Application/chrome.exe" : undefined);
export default defineConfig({
  testDir: "./tests/browser",
  testIgnore: ["portfolio.spec.ts", "reports.spec.ts"],
  timeout: 60000,
  workers: 1,
  fullyParallel: false,
  use: {
    baseURL: "http://127.0.0.1:3077",
    channel: "chrome",
    headless: true,
    viewport: { width: 1366, height: 860 },
    launchOptions: { executablePath: chrome, args: ["--enable-unsafe-swiftshader"] },
    trace: "retain-on-failure",
  },
  webServer: {
    command: "node scripts/test-browser-server.mjs",
    url: "http://127.0.0.1:3077",
    reuseExistingServer: false,
    timeout: 120000,
  },
});
