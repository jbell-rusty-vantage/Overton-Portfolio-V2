import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/browser",
  timeout: 60000,
  workers: 1,
  fullyParallel: false,
  use: {
    baseURL: "http://127.0.0.1:3077",
    channel: "chrome",
    headless: true,
    viewport: { width: 1366, height: 860 },
    launchOptions: { args: ["--enable-unsafe-swiftshader"] },
    trace: "retain-on-failure",
  },
  webServer: {
    command: "node scripts/preview-library.mjs 3077",
    url: "http://127.0.0.1:3077",
    reuseExistingServer: true,
    timeout: 60000,
  },
});
