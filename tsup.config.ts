import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    "functions/index": "src/functions/index.ts",
  },
  format: "esm",
  target: "esnext",
  sourcemap: true,
});
