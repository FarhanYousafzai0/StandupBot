import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    setupFiles: ["../../vitest.setup.ts"],
    include: ["tests/api/**/*.test.ts"],
    hookTimeout: 120_000,
    testTimeout: 120_000,
    fileParallelism: false,
  },
});
