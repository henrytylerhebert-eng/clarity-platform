import { defineConfig } from "vitest/config";
import { aliases } from "./vitest.aliases.js";

/**
 * Unit/contract suite: everything that does NOT write to a database.
 * No PostgreSQL required, so the fast path stays fast.
 */
export default defineConfig({
  resolve: { alias: aliases },
  test: {
    include: ["tests/**/*.test.ts", "packages/**/*.test.ts"],
    exclude: ["**/node_modules/**", "**/dist/**", "tests/integration/**"],
    environment: "node",
  },
});
