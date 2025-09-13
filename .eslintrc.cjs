/* eslint-env node */
/** @type {import('eslint').Linter.Config} */ // This provides type hints for the configuration options below.
module.exports = {
  root: true,
  env: {
    browser: true,
    es2022: true,
    node: true,
  },
  extends: [
    "eslint:recommended",
    "plugin:vue/recommended",
    "plugin:vuetify/recommended",
    "@vue/typescript/recommended",
    "plugin:lodash/recommended",
  ],
  rules: {
    "arrow-parens": ["warn", "always"],
    "camelcase": "off",
    "comma-dangle": "off",
    "no-console": process.env.NODE_ENV === "production" ? "error" : "off",
    "no-debugger": process.env.NODE_ENV === "production" ? "error" : "off",
    "no-trailing-spaces": "warn",
    "object-curly-spacing": ["warn", "always"],
    "prefer-const": "warn",
    "quotes": "off",
    "semi": "off",
    "space-infix-ops": "off",

    // Typescript-eslint rules
    "@typescript-eslint/ban-ts-comment": "off",
    "@typescript-eslint/comma-dangle": ["warn", "only-multiline"],
    "@typescript-eslint/explicit-module-boundary-types": "off",
    "@typescript-eslint/member-delimiter-style": "warn",
    "@typescript-eslint/no-loss-of-precision": "off",
    "@typescript-eslint/no-non-null-assertion": "off",
    "@typescript-eslint/quotes": ["warn", "double", { "avoidEscape": true, "allowTemplateLiterals": true }],
    "@typescript-eslint/semi": "warn",
    "@typescript-eslint/space-infix-ops": "warn",

    // Lodash rules
    "lodash/import-scope": ["warn", "method"],
    "lodash/prefer-constant": "off",
    "lodash/prefer-lodash-method": "off",
    "lodash/prefer-lodash-typecheck": "off",
    "lodash/prefer-matches": "off",
    "lodash/prop-shorthand": "off",

    // Vue rules
    "vue/no-v-text-v-html-on-component": "warn",
    "vue/valid-v-slot": ["error", { allowModifiers: true }],
    "vue/html-self-closing": ["error", {
      "html": {
        "void": "always",
        "normal": "never",
        "component": "always"
      },
    }],
    "vue/max-attributes-per-line": ["error", {
      "singleline": {
        "max": 10
      },
      "multiline": {
        "max": 1
      }
    }]
  },
};
