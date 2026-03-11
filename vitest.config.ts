import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    coverage: {
      provider: "v8",
      include: ["src/**/*.ts"],
      exclude: [
        "src/index.ts",
        "src/**/index.ts", // barrel re-export files
        "src/ui/**", // terminal I/O — not unit-testable
      ],
      thresholds: {
        lines: 70,
        functions: 70,
      },
    },
  },
});
