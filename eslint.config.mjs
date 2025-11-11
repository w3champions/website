import { globalIgnores } from "eslint/config";
import { defineConfigWithVueTs, vueTsConfigs } from "@vue/eslint-config-typescript";
import pluginVue from "eslint-plugin-vue";
import eslintPluginVue from "eslint-plugin-vue";
import { defineConfig } from "eslint/config";
import eslintPluginLodash from "eslint-plugin-lodash";
import eslint from "@eslint/js";
import tseslint from "typescript-eslint";

export default defineConfig([
  eslint.configs.recommended,
  tseslint.configs.recommended,
  ...pluginVue.configs["flat/recommended"],
  defineConfigWithVueTs(vueTsConfigs.recommended),
  ...eslintPluginVue.configs["flat/recommended"],
  globalIgnores(["**/dist/**", "src/locales/data.ts", "src/locales/en.ts"]),
  {
    name: "eslint",
    files: ["*.{ts,mts,tsx,vue}", "**/*.{ts,mts,tsx,vue}"],
    rules: {
      "arrow-parens": ["warn", "always"],
      "camelcase": "off",
      "comma-dangle": ["warn", "only-multiline"],
      "no-trailing-spaces": "warn",
      "object-curly-spacing": ["warn", "always"],
      "prefer-const": "warn",
      "quotes": "warn",
      "semi": "warn",
      "space-infix-ops": "warn",
    },
  },
  {
    name: "typescript-eslint",
    files: ["*.{ts,mts,tsx,vue}", "**/*.{ts,mts,tsx,vue}"],
    rules: {
      "@typescript-eslint/ban-ts-comment": "warn",
      "@typescript-eslint/explicit-module-boundary-types": "warn",
      // "@typescript-eslint/member-delimiter-style": "warn", TODO: install @stylistic/eslint-plugin (https://eslint.style/rules)
      "@typescript-eslint/no-loss-of-precision": "warn",
      "@typescript-eslint/no-non-null-assertion": "off",
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unused-expressions": "off",
      "@typescript-eslint/no-unused-vars": ["error", {
        "argsIgnorePattern": "^_",
        "caughtErrorsIgnorePattern": "^_",
        "varsIgnorePattern": "^_",
      }],
    },
  },
  {
    name: "eslint-plugin-vue",
    files: ["*.{ts,mts,tsx,vue}", "**/*.{ts,mts,tsx,vue}"],
    rules: {
      "vue/no-v-text-v-html-on-component": "warn",
      "vue/valid-v-slot": ["error", { allowModifiers: true }],
      "vue/html-self-closing": ["error", {
        "html": {
          "void": "always",
          "normal": "never",
          "component": "always",
        },
        "svg": "always",
      }],
      "vue/max-attributes-per-line": ["error", {
        "singleline": {
          "max": 10,
        },
        "multiline": {
          "max": 1,
        },
      }],
      "vue/v-bind-style": ["error", "shorthand"],
      "vue/v-slot-style": ["error", "longform"],
      // "vue/attribute-hyphenation": ["warn", "always"],
      "vue/attribute-hyphenation": ["off"],
      "vue/singleline-html-element-content-newline": ["off"],
      "vue/no-v-html": ["off"],
      "vue/no-lone-template": ["warn"],
      "vue/v-on-event-hyphenation": ["off"],
      "vue/require-explicit-emits": ["off"],

      // This rule is for Vue 2, and was deprecated in eslint-plugin-vue v10.0.0, and will be removed in v11.
      // https://github.com/vuejs/eslint-plugin-vue/pull/2675
      // "vue/no-v-model-argument": ["warn"],

      "vue/no-deprecated-delete-set": "warn",
      "vue/no-deprecated-dollar-listeners-api": "warn",
      "vue/no-deprecated-model-definition": "warn",
      "vue/no-deprecated-props-default-this": "warn",
      "vue/no-deprecated-slot-attribute": "warn",
      "vue/prefer-import-from-vue": "warn",
    },
  },
  {
    name: "eslint-plugin-lodash",
    plugins: {
      lodash: eslintPluginLodash,
    },
    files: ["*.{ts,mts,tsx,vue}", "**/*.{ts,mts,tsx,vue}"],
    rules: {
      "lodash/import-scope": ["warn", "method"],
      "lodash/prefer-constant": "off",
      "lodash/prefer-lodash-method": "off",
      "lodash/prefer-lodash-typecheck": "off",
      "lodash/prefer-matches": "off",
      "lodash/prop-shorthand": "off",
    },
  },
]);
