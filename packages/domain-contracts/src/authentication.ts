import type { CommandActor } from "./actor.js";
import type { UserRole } from "./roles.js";

/**
 * Authentication contracts (ADR-0011).
 *
 * An AuthenticatedPrincipal is the ONLY legitimate source of a CommandActor
 * above the service layer. Its roles are loaded from the User row during
 * session verification — never accepted from a caller. This retires the
 * "actor roles are trusted caller input" assumption carried by
 * ADR-0003…ADR-0010: the services remain the authorization point; the
 * authentication layer becomes the identity point.
 */
export interface AuthenticatedPrincipal {
  readonly userId: string;
  readonly organizationId: string;
  readonly displayName: string;
  readonly roles: readonly UserRole[];
  readonly sessionId: string;
  readonly expiresAt: Date;
}

/**
 * The bridge that makes forged roles structurally impossible upstream of the
 * services: the actor's identity and roles come from the verified principal,
 * and there is no parameter through which a caller could add any.
 */
export function principalToActor(principal: AuthenticatedPrincipal): CommandActor {
  return {
    actorId: principal.userId,
    actorType: "USER",
    roles: [...principal.roles],
  };
}

/**
 * Port for the external identity layer. A managed IdP adapter (OIDC)
 * implements this at deployment time; the dev provider maps pre-registered
 * synthetic assertions to user emails. Implementations verify WHO the caller
 * is; they never decide what the caller may do.
 */
export interface IdentityProvider {
  /** Returns the verified email or throws; never returns roles or tenancy. */
  verifyAssertion(assertion: string): Promise<{ email: string }>;
}

/** Default session lifetime: one nursing shift. */
export const DEFAULT_SESSION_TTL_MS = 8 * 60 * 60 * 1000;
