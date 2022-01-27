module.exports = {
  root: true,
  env: {
    node: true,
  },
  //plugins: [ "prettier" ],
  extends: [
    "plugin:vue/essential",
    "eslint:recommended",
    //"plugin:prettier/recommended",
    "@vue/typescript/recommended",
    //"@vue/prettier/@typescript-eslint",
  ],
  parserOptions: {
    ecmaVersion: 2020,
  },
  rules: {
    "no-console": process.env.NODE_ENV === "production" ? "error" : "off",
    "no-debugger": process.env.NODE_ENV === "production" ? "error" : "off",
    "ban-ts-comment": "off",
    //"no-loss-off-precision": "off",
    "@typescript-eslint/no-loss-of-precision": "off",
    "@typescript-eslint/explicit-module-boundary-types":"off",
    camelcase: "off",
  },
};
