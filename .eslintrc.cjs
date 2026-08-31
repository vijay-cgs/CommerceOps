module.exports = {
  root: true,
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint"],
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
    ecmaFeatures: {
      jsx: true,
    },
  },
  ignorePatterns: [
    "node_modules",
    ".next",
    "dist",
    "coverage",
    "playwright-report",
    "test-results",
  ],
  extends: ["./packages/config-eslint/index.cjs"],
  overrides: [
    {
      files: ["**/*.ts", "**/*.tsx"],
      rules: {},
    },
  ],
};
