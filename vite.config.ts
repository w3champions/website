import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue2";
import Components from "unplugin-vue-components/vite";
import { ComponentResolver } from "unplugin-vue-components";
import legacy from "@vitejs/plugin-legacy";

// Vuetify addons cause an import error. Custom loader excludes them.
// https://github.com/antfu/unplugin-vue-components/blob/a495847dd0e7c9955bf5c756280482b007e46f49/src/core/resolvers/vuetify.ts#L3-L16
export function VuetifyResolverMod(): ComponentResolver {
    return {
        type: "component",
        resolve: (name: string) => {
            if (name.match(/^V[A-Z]/)){
              const blockList = ['VDatetimePicker']
              if (!blockList.includes(name)) // Exclude addon from autoloader.
                    return { name, from: "vuetify/lib" };
            }
        }
    };
}

export default defineConfig({
    plugins: [
        vue(),
        Components({
            resolvers: [VuetifyResolverMod()],
        }),
        legacy(), // Build for old browser.
    ],
    resolve: {
        alias: {
            "@": fileURLToPath(new URL("./src", import.meta.url)),
        },
        extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json', '.vue'],
    },
})
