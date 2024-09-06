import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import legacy from "@vitejs/plugin-legacy";
import vuetify from "vite-plugin-vuetify";

export default defineConfig({
    plugins: [
        vue({}),
        vuetify({
            autoImport: true
        }),
        legacy(), // Build for old browser.
    ],
    server: {
        port: 8080,
        hmr: {
            overlay: false,
        }
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
});
