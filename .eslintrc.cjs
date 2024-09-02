/* eslint-env node */
/** @type {import('eslint').Linter.Config} */ // This provides type hints for the configuration options below.
module.exports = {
  root: true,
  env: {
    browser: true,
    es2022: true,
    node: true,
  },
  // plugins: [
  //   "prettier"
  // ],
  extends: [
    "eslint:recommended",
    "plugin:vue/essential",
    "plugin:vuetify/base",
    // "plugin:vuetify/recommended",
    //  "plugin:prettier/recommended",
    "@vue/typescript/recommended",
    // "@vue/prettier/@typescript-eslint"
    // "@vue/typescript/recommended",
    // "@vue/prettier/@typescript-eslint",
    "plugin:lodash/recommended",
  ],
  rules: {
    // "prettier/prettier": "warn",
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
    "@typescript-eslint/ban-ts-comment": "off",
    "@typescript-eslint/comma-dangle": ["warn", "only-multiline"],
    "@typescript-eslint/explicit-module-boundary-types": "off",
    "@typescript-eslint/member-delimiter-style": "warn",
    "@typescript-eslint/no-loss-of-precision": "off",
    "@typescript-eslint/no-non-null-assertion": "off",
    "@typescript-eslint/quotes": ["warn", "double", { "avoidEscape": true, "allowTemplateLiterals": true }],
    "@typescript-eslint/semi": "warn",
    "@typescript-eslint/space-infix-ops": "warn",
    "vue/no-v-text-v-html-on-component": "warn",
    "vue/valid-v-slot": ["error", { allowModifiers: true }],
    "lodash/import-scope": ["warn", "method"],
    "lodash/prefer-constant": "off",
    "lodash/prefer-lodash-method": "off",
    "lodash/prefer-lodash-typecheck": "off",
    "lodash/prefer-matches": "off",
    "lodash/prop-shorthand": "off",
  },
};
