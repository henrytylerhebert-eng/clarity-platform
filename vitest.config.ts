import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: {
    alias: {
      "@clarity/domain-contracts": fileURLToPath(
        new URL("./packages/domain-contracts/src/index.ts", import.meta.url),
      ),
      "@clarity/case-repository": fileURLToPath(
        new URL("./packages/case-repository/src/index.ts", import.meta.url),
      ),
      "@clarity/case-service": fileURLToPath(
        new URL("./packages/case-service/src/index.ts", import.meta.url),
      ),
      "@clarity/document-service": fileURLToPath(
        new URL("./packages/document-service/src/index.ts", import.meta.url),
      ),
      "@clarity/evidence-service": fileURLToPath(
        new URL("./packages/evidence-service/src/index.ts", import.meta.url),
      ),
    },
  },
  test: {
    include: ["tests/**/*.test.ts", "packages/**/*.test.ts"],
    environment: "node",
  },
});
