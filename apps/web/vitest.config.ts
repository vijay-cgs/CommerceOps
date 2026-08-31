import { defineConfig } from "vitest/config";

export default defineConfig({
  // Matches the automatic JSX runtime Next.js uses, so components do not need
  // React in scope to be rendered in tests.
  esbuild: { jsx: "automatic" },
  test: {
    environment: "jsdom",
    include: ["tests/**/*.test.ts", "tests/**/*.test.tsx"],
    globals: true,
  },
});
