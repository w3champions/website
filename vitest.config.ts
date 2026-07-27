import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vitest/config";

// Kept separate from vite.config.ts so the production build never has to resolve
// the test runner. It only needs the "@" alias that the suites import through.
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    // The current suites are pure TypeScript. Switch to "jsdom" and add the vue
    // plugin when component tests, or tests of modules that touch `window`
    // (such as anything importing @/config/env), are added.
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
