import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import legacy from "@vitejs/plugin-legacy";
import vuetify from "vite-plugin-vuetify";

export default defineConfig({
  plugins: [
    vue(),
    vuetify({ autoImport: true }), // Enabled by default
    legacy(), // Build for old browser.
  ],
  server: {
    port: 8080,
  },
  preview: {
    port: 8080,
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
    extensions: [".mjs", ".js", ".ts", ".vue", ".jsx", ".tsx", ".json"],
  },
  css: {
    // https://vitejs.dev/config/#css-preprocessoroptions
    preprocessorOptions: {
      sass: {
        additionalData: [
          // vuetify variable overrides
          '@import "@/scss/variables.scss"',
          "",
        ].join("\n"),
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks,
      },
    },
  },
});

function manualChunks(id: string) {
  if (id.includes("node_modules/vuetify")) {
    return "vuetify";
  }
  if (id.includes("node_modules/chartjs") || id.includes("node_modules/chart.js") || id.includes("node_modules/vue-chartjs")) {
    return "chartjs";
  }
  if (id.includes("node_modules/vue-country-flag-next")) {
    return "vue-country-flag-next";
  }
  if (id.includes("node_modules/vue")) {
    return "vue";
  }
  if (id.includes("node_modules/@tiptap") || id.includes("node_modules/prosemirror")) {
    return "tiptap";
  }
  if (id.includes("node_modules")) {
    return "vendor";
  }
  return null;
}
