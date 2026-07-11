import js from "@eslint/js";
import tseslint from "typescript-eslint";

/**
 * Minimal TypeScript-aware lint baseline (ADR-0006).
 * Scope: backend packages, root tests/scripts, and app/src, all under the
 * non-type-checked recommended rule sets — deliberately small to avoid
 * unrelated churn. Type-checked rules and formatters are future work.
 */
export default tseslint.config(
  {
    ignores: [
      "**/node_modules/**",
      "app/dist/**",
      "app/playwright-report/**",
      "app/test-results/**",
      "coverage/**",
      "prisma/migrations/**",
      "graphify-out/**",
      "reference/**",
      "reporting-metrics-rebuild-package/**",
      ".local-object-storage/**",
      "**/*.d.ts",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.ts", "**/*.tsx"],
    rules: {
      // The command envelopes intentionally accept unknown-shaped input that
      // Zod narrows at runtime; a few adapters need explicit any at the
      // Prisma boundary. Warn (not error) to surface without blocking.
      "@typescript-eslint/no-explicit-any": "warn",
      // Allow intentionally unused params/vars with a leading underscore.
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_", caughtErrorsIgnorePattern: "^_" },
      ],
    },
  },
  {
    // Plain JS config/tooling files at the root are Node scripts.
    files: ["*.mjs", "*.js", "scripts/**/*.js"],
    languageOptions: { globals: { process: "readonly", console: "readonly" } },
  },
);
