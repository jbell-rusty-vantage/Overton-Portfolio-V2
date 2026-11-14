import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    ".next-office/**",
    ".next-browser/**",
    ".local-library/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    ".agent-docs/**",
    "docs/archive/**",
    ".firecrawl/**",
    ".vercel/**",
    "public/**",
    "assets/**",
    "content/projects/**",
    "content/media-src/**",
    "content/media-out/**",
    "test-results/**",
    "lib/generated/**",
  ]),
]);

export default eslintConfig;
