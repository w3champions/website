/** @type {import('eslint').Linter.Config} */ // This provides type hints for the configuration options below.
module.exports = {
  root: true,
  env: {
    node: true,
  },
  //plugins: [
  //  "prettier"
  //],
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
  parser: "vue-eslint-parser",
  parserOptions: {
    ecmaVersion: 2020,
  },
  rules: {
    // "prettier/prettier": "warn",
    "semi": "off",
    "@typescript-eslint/semi": "warn",
    "@typescript-eslint/member-delimiter-style": "warn",
    "comma-dangle": "off",
    "@typescript-eslint/comma-dangle": ["warn", "only-multiline"],
    "quotes": "off",
    "@typescript-eslint/quotes": ["warn", "double", { "avoidEscape": true, "allowTemplateLiterals": true }],
    "object-curly-spacing": ["warn", "always"],
    "space-infix-ops": "off",
    "@typescript-eslint/space-infix-ops": "warn",
    "no-trailing-spaces": "warn",
    "arrow-parens": ["warn", "always"],
    "@typescript-eslint/no-non-null-assertion": "off",
    "no-console": process.env.NODE_ENV === "production" ? "error" : "off",
    "no-debugger": process.env.NODE_ENV === "production" ? "error" : "off",
    "prefer-const": "warn",
    "@typescript-eslint/ban-ts-comment": "off",
    "@typescript-eslint/no-loss-of-precision": "off",
    "@typescript-eslint/explicit-module-boundary-types":"off",
    camelcase: "off",
    "vue/no-v-text-v-html-on-component": "warn",
    "vue/valid-v-slot": ["error", {
      allowModifiers: true,
    }],
    "lodash/import-scope": ["warn", "method"],
    "lodash/prefer-constant": "off",
    "lodash/prefer-lodash-method": "off",
    "lodash/prefer-lodash-typecheck": "off",
    "lodash/prefer-matches": "off",
    "lodash/prop-shorthand": "off",
  },
};
