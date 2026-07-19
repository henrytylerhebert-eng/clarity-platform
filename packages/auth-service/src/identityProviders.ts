import type { IdentityProvider } from "@clarity/domain-contracts";
import { LoginRejectedError } from "@clarity/case-repository";

/**
 * DEVELOPMENT-ONLY identity provider (same posture as
 * LocalFilesystemObjectStorage): maps pre-registered synthetic assertions to
 * user emails so the full session lifecycle is testable without an external
 * IdP. It performs no cryptography and must never front a real deployment —
 * production uses a managed-IdP (OIDC) adapter behind the same port
 * (ADR-0011 §2). Failures are uniform: an unknown assertion and a known-but-
 * wrong one look identical.
 */
export class LocalDevIdentityProvider implements IdentityProvider {
  #assertions = new Map<string, string>();

  /** Registers a synthetic assertion → email pair (test/dev setup only). */
  register(assertion: string, email: string): void {
    if (assertion.length < 16) {
      throw new Error("Dev assertions must be at least 16 characters");
    }
    this.#assertions.set(assertion, email);
  }

  async verifyAssertion(assertion: string): Promise<{ email: string }> {
    const email = this.#assertions.get(assertion);
    if (!email) throw new LoginRejectedError();
    return { email };
  }
}
