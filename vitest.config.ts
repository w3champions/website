import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vitest/config";
import vue from "@vitejs/plugin-vue";
import vuetify from "vite-plugin-vuetify";

// Kept separate from vite.config.ts so the production build never has to resolve
// the test runner. It only needs the "@" alias that the suites import through.
export default defineConfig({
  plugins: [vue(), vuetify({ autoImport: true })],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    // Most suites are pure TypeScript and run in "node". Component tests opt into
    // jsdom per file with a `// @vitest-environment jsdom` docblock.
    environment: "node",
    // Vuetify ships CSS imports that Node cannot load, so it has to go through vite.
    server: { deps: { inline: ["vuetify"] } },
    css: false,
    include: ["src/**/*.test.ts"],
  },
});
