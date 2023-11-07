const { resolve } = require("node:path");

const project = resolve(process.cwd(), "tsconfig.json");

module.exports = {
  env: { browser: true, es2020: true },
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended-type-checked",
    "plugin:react-hooks/recommended",
    "plugin:@typescript-eslint/stylistic-type-checked",
    "plugin:react/recommended",
    "plugin:react/jsx-runtime",
    "prettier",
    "turbo",
    "plugin:mdx/recommended",
    "plugin:storybook/recommended",
  ].map(require.resolve),
  ignorePatterns: ["dist/", "node_modules/"],
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint", "react-refresh", "react"],
  rules: {
    "react-refresh/only-export-components": [
      "warn",
      { allowConstantExport: true },
    ],
    semi: "error",
    "no-empty": "warn",
    "no-empty-function": "warn",
    "@typescript-eslint/no-unused-vars": "warn",
    "prefer-const": "warn",
    "@typescript-eslint/no-empty-interface": "warn",
  },
  parserOptions: {
    project,
  },
  settings: {
    "import/resolver": {
      typescript: {
        project,
      },
    },
  },
};
