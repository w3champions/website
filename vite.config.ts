import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import Components from "unplugin-vue-components/vite";
import { ComponentResolver } from "unplugin-vue-components";
import vuetify from "vite-plugin-vuetify";

export default defineConfig({
    plugins: [
        vue({
        }),
        vuetify({
            autoImport: true
        }),
    ],
    server: {
        port: 8080,
    },
    resolve: {
        alias: {
            "@": fileURLToPath(new URL("./src", import.meta.url))
        },
        extensions: [
            ".js",
            ".json",
            ".jsx",
            ".mjs",
            ".ts",
            ".tsx",
            ".vue",
        ],
    },
    build: {
        sourcemap: true,
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
