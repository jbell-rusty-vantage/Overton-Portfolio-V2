import { defineConfig } from "@playwright/test";
import reports from "./reports.config";

export default defineConfig({
  ...reports,
  testMatch: ["portfolio.spec.ts", "reports.spec.ts"],
  outputDir: "../.local-library/showcase-2026/browser-results",
  reporter: [["list"], ["json", { outputFile: "../.local-library/showcase-2026/browser-results.json" }]],
});
