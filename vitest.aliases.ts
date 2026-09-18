import { fileURLToPath } from "node:url";

/** Shared workspace aliases for every vitest config in this repository. */
export const aliases = {
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
      "@clarity/legal-hold-forms": fileURLToPath(
        new URL("./packages/legal-hold-forms/src/index.ts", import.meta.url),
      ),
      "@clarity/api-service": fileURLToPath(
        new URL("./packages/api-service/src/index.ts", import.meta.url),
      ),
      "@clarity/evidence-service": fileURLToPath(
        new URL("./packages/evidence-service/src/index.ts", import.meta.url),
      ),
      "@clarity/benefits-service": fileURLToPath(
        new URL("./packages/benefits-service/src/index.ts", import.meta.url),
      ),
      "@clarity/authorization-service": fileURLToPath(
        new URL("./packages/authorization-service/src/index.ts", import.meta.url),
      ),
      "@clarity/auth-service": fileURLToPath(
        new URL("./packages/auth-service/src/index.ts", import.meta.url),
      ),
      "@clarity/prescreen-service": fileURLToPath(
        new URL("./packages/prescreen-service/src/index.ts", import.meta.url),
      ),
      "@clarity/learning-practice-service": fileURLToPath(
        new URL("./packages/learning-practice-service/src/index.ts", import.meta.url),
      ),
};
