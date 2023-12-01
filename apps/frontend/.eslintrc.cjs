// @ts-check
const { defineConfig } = require("eslint-define-config");

/// <reference types="@eslint-types/typescript-eslint" />

module.exports = defineConfig({
  extends: ["custom/react"],
  parserOptions: {
    project: ["./tsconfig.json", "./tsconfig.node.json"],
  },
});
