import { defineConfig } from "tsup";

export default defineConfig([
  {
    entry: { "bin/lazycommit": "bin/lazycommit.ts" },
    format: ["esm"],
    target: "node18",
    sourcemap: true,
    clean: true,
    splitting: false,
    banner: {
      js: "#!/usr/bin/env node",
    },
  },
  {
    entry: { index: "src/index.ts" },
    format: ["esm"],
    target: "node18",
    dts: true,
    sourcemap: true,
    splitting: false,
  },
]);
