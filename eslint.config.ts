import { globalIgnores } from "eslint/config";
import { defineConfigWithVueTs, vueTsConfigs } from "@vue/eslint-config-typescript";
import eslintPluginVue from "eslint-plugin-vue";
import { defineConfig } from "eslint/config";
import eslintPluginLodash from "eslint-plugin-lodash";
import tseslint from "typescript-eslint";
import stylistic from "@stylistic/eslint-plugin";

export default defineConfigWithVueTs([
  tseslint.configs.recommended,
  vueTsConfigs.recommended,
  eslintPluginVue.configs["flat/recommended"],
  globalIgnores(["**/dist/**", "src/locales/data.ts", "src/locales/en.ts", "public/env.js"]),
  {
    name: "eslint",
    files: ["*.{ts,mts,tsx,vue}", "**/*.{ts,mts,tsx,vue}"],
    rules: {
      "camelcase": "off",
      "prefer-const": "warn",
    },
  },
  {
    name: "typescript-eslint",
    files: ["*.{ts,mts,tsx,vue}", "**/*.{ts,mts,tsx,vue}"],
    rules: {
      "@typescript-eslint/ban-ts-comment": "warn",
      "@typescript-eslint/explicit-module-boundary-types": "warn",
      // "@typescript-eslint/member-delimiter-style": "warn", TODO: Use @stylistic/eslint-plugin (https://eslint.style/rules). Read more: https://typescript-eslint.io/rules/member-delimiter-style
      "@typescript-eslint/no-loss-of-precision": "warn",
      "@typescript-eslint/no-non-null-assertion": "off",
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unused-expressions": "warn",
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
      "vue/v-bind-style": ["warn", "shorthand"],
      "vue/v-slot-style": ["warn", "longform"],
      // "vue/attribute-hyphenation": ["warn", "always"],
      "vue/attribute-hyphenation": ["off"],
      "vue/singleline-html-element-content-newline": ["off"],
      "vue/no-v-html": ["off"],
      "vue/no-lone-template": ["warn"],
      "vue/v-on-event-hyphenation": ["off"],
      "vue/require-explicit-emits": ["off"],
      "vue/no-deprecated-delete-set": "warn",
      "vue/no-deprecated-dollar-listeners-api": "warn",
      "vue/no-deprecated-model-definition": "warn",
      "vue/no-deprecated-props-default-this": "warn",
      "vue/no-deprecated-slot-attribute": "warn",
      "vue/prefer-import-from-vue": "warn",
      // "vue/component-name-in-template-casing": "warn", // https://eslint.vuejs.org/rules/component-name-in-template-casing
      // "vue/component-api-style": ["error", ["script-setup", "composition"]], // Allow both script setup and normal Composition API https://eslint.vuejs.org/rules/component-api-style
      // "vue/component-api-style": ["error", ["script-setup"]], // Allow only script setup
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
  {
    name: "eslint-plugin-stylistic",
    plugins: {
      "@stylistic": stylistic,
    },
    files: ["*.{ts,mts,tsx,vue}", "**/*.{ts,mts,tsx,vue}"],
    rules: {
      "@stylistic/semi": ["warn", "always"],
      "@stylistic/quotes": ["warn", "double"],
      "@stylistic/comma-dangle": ["warn", "only-multiline"],
      // "@stylistic/comma-dangle": ["warn", "always-multiline"],
      "@stylistic/indent": ["warn", 2],
      // "@stylistic/object-curly-spacing": ["warn", "always"],
      "@stylistic/space-infix-ops": ["warn"],
      "@stylistic/arrow-parens": ["warn", "always"],
      "@stylistic/no-trailing-spaces": ["warn"],
      "@stylistic/array-bracket-spacing": ["warn", "never"],
      // "@stylistic/keyword-spacing": ["warn", { "before": true, "after": true }],
      // "@stylistic/space-before-blocks": ["warn", "always"],
      // "@stylistic/space-before-function-paren": ["warn", "never"],
      // "@stylistic/space-before-function-parentheses": ["warn", "never"],
    },
  },
]);
