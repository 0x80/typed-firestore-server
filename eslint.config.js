// @ts-check
import eslint from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  eslint.configs.recommended,
  tseslint.configs.strictTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: {
          allowDefaultProject: ["*.js", "tsup.config.ts", "eslint.config.js"],
        },
        tsconfigRootDir: import.meta.dirname,
      },
    },
  }
);
