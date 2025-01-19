import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    collections: "src/collections/index.ts",
    documents: "src/documents/index.ts",
    functions: "src/functions/index.ts",
    index: "src/index.ts",
  },
  format: "esm",
  target: "esnext",
  sourcemap: true,
});
