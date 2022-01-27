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
    "plugin:prettier/recommended",
    "@vue/typescript/recommended",
    //"@vue/prettier/@typescript-eslint"
    //"@vue/typescript/recommended",
    //"@vue/prettier/@typescript-eslint",
  ],
  parser: "vue-eslint-parser",
  parserOptions: {
    ecmaVersion: 2020,
  },
  rules: {
    "no-console": process.env.NODE_ENV === "production" ? "error" : "off",
    "no-debugger": process.env.NODE_ENV === "production" ? "error" : "off",
    "global-require": "off",
    "@typescript-eslint/ban-ts-comment": "off",
    "@typescript-eslint/no-loss-of-precision": "off",
    "@typescript-eslint/explicit-module-boundary-types":"off",
    camelcase: "off",
  },
};
