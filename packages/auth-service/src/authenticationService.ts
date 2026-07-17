import { createHash, randomBytes } from "node:crypto";
import {
  DEFAULT_SESSION_TTL_MS,
  principalToActor,
  type AuthenticatedPrincipal,
  type CommandActor,
  type IdentityProvider,
} from "@clarity/domain-contracts";
import type { PrismaAuthGateway } from "@clarity/case-repository";

export interface LoginResult {
  /**
   * The opaque bearer token, returned exactly once. It is never stored,
   * logged, or audited anywhere — only its SHA-256 hash persists.
   */
  token: string;
  principal: AuthenticatedPrincipal;
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/**
 * The single controlled path for authentication (ADR-0011).
 *
 * login:        assertion → IdentityProvider (WHO) → session issuance
 *               (ACTIVE user in ACTIVE org; roles loaded from the User row)
 * authenticate: bearer token → principal, middleware-shaped for the API
 *               phase (one call per request; uniform failure)
 * logout:       audited revocation; the session row survives
 * actorFor:     the ONLY sanctioned way to build a CommandActor above the
 *               service layer — roles come from the verified principal,
 *               which got them from the database. This retires the
 *               "actor roles are trusted caller input" assumption of
 *               ADR-0003…ADR-0010.
 */
export class AuthenticationService {
  constructor(
    private readonly identityProvider: IdentityProvider,
    private readonly gateway: PrismaAuthGateway,
    private readonly sessionTtlMs: number = DEFAULT_SESSION_TTL_MS,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async login(assertion: string): Promise<LoginResult> {
    const { email } = await this.identityProvider.verifyAssertion(assertion);
    const token = randomBytes(32).toString("hex");
    const { principal } = await this.gateway.issueSession({
      email,
      tokenHash: hashToken(token),
      expiresAt: new Date(this.now().getTime() + this.sessionTtlMs),
    });
    return { token, principal };
  }

  async authenticate(token: string): Promise<AuthenticatedPrincipal> {
    return this.gateway.verifySession(hashToken(token));
  }

  async logout(token: string): Promise<void> {
    await this.gateway.revokeSession(hashToken(token));
  }

  actorFor(principal: AuthenticatedPrincipal): CommandActor {
    return principalToActor(principal);
  }
}
