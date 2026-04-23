import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    include: ["apps/api/tests/**/*.test.ts", "components/**/*.test.tsx"],
    hookTimeout: 120_000,
    testTimeout: 120_000,
    fileParallelism: false,
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["apps/api/src/**/*.js", "components/**/*.tsx", "lib/**/*.ts", "lib/**/*.tsx"],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname),
    },
  },
});
