import { defineConfig } from "vitest/config";
import { aliases } from "./vitest.aliases.js";

/**
 * Database-writing integration suite. The harness refuses any database not marked
 * CLARITY_DISPOSABLE_DATABASE=1, so run this via `npm run test:integration`.
 */
export default defineConfig({
  resolve: { alias: aliases },
  test: {
    include: ["tests/integration/**/*.test.ts"],
    environment: "node",
  },
});
