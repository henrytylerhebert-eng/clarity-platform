import { randomUUID } from "node:crypto";
import type { PrismaClient } from "@prisma/client";
import {
  USER_ROLES,
  type AuditActor,
  type AuthenticatedPrincipal,
  type UserRole,
} from "@clarity/domain-contracts";
import { PrismaCaseAuditWriter, type CaseAuditWriter } from "./auditWriter.js";

/**
 * Uniform, non-revealing authentication failure. Unknown token, tampered
 * token, expired session, revoked session, inactive user, and suspended
 * organization all present identically — a caller probing tokens learns
 * nothing about which condition failed.
 */
export class AuthenticationFailedError extends Error {
  constructor() {
    super("Authentication failed");
    this.name = "AuthenticationFailedError";
  }
}

/** Login-time failure: the asserted identity cannot receive a session. */
export class LoginRejectedError extends Error {
  constructor() {
    super("Login rejected");
    this.name = "LoginRejectedError";
  }
}

const OBJECT_TYPE = "AuthSession";

/**
 * The single approved Prisma adapter for authentication (ADR-0011).
 *
 * Sessions are server-side rows keyed by the SHA-256 hash of an opaque
 * bearer token; the raw token never reaches this gateway, the database, or
 * any audit row. Verification loads the user's roles FROM THE DATABASE —
 * the principal a caller receives cannot carry roles the User row does not
 * have. Session issuance and revocation are audited (organization-level
 * events; caseId is null).
 */
export class PrismaAuthGateway {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly auditWriter: CaseAuditWriter = new PrismaCaseAuditWriter(),
    private readonly now: () => Date = () => new Date(),
  ) {}

  /**
   * Issues a session for a verified email (identity already proven by the
   * IdentityProvider upstream). ACTIVE user in an ACTIVE organization only.
   * LoginRejectedError is deliberately uniform across unknown email,
   * inactive user, and suspended organization.
   */
  async issueSession(params: {
    email: string;
    tokenHash: string;
    expiresAt: Date;
  }): Promise<{ sessionId: string; principal: AuthenticatedPrincipal }> {
    const result = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { email: params.email },
        include: { organization: { select: { status: true } } },
      });
      if (!user || user.status !== "ACTIVE" || user.organization.status !== "ACTIVE") {
        throw new LoginRejectedError();
      }
      const session = await tx.authSession.create({
        data: {
          id: randomUUID(),
          userId: user.id,
          organizationId: user.organizationId,
          tokenHash: params.tokenHash,
          issuedAt: this.now(),
          expiresAt: params.expiresAt,
        },
      });
      await tx.user.update({ where: { id: user.id }, data: { lastLoginAt: this.now() } });
      const actor: AuditActor = { actorType: "USER", actorId: user.id };
      await this.auditWriter.write(tx, {
        organizationId: user.organizationId,
        caseId: null, // organization-level event; no case involved
        action: "SESSION_ISSUED",
        actor,
        objectType: OBJECT_TYPE,
        objectId: session.id,
        metadata: {
          sessionId: session.id,
          userId: user.id,
          expiresAt: params.expiresAt.toISOString(),
          // never the token, never its hash
        },
        occurredAt: this.now(),
      });
      return { session, user };
    });
    return {
      sessionId: result.session.id,
      principal: this.toPrincipal(result.session.id, result.session.expiresAt, result.user),
    };
  }

  /** Middleware-shaped verification: token hash in, principal out or a uniform failure. */
  async verifySession(tokenHash: string): Promise<AuthenticatedPrincipal> {
    const session = await this.prisma.authSession.findUnique({
      where: { tokenHash },
      include: {
        user: { include: { organization: { select: { status: true } } } },
      },
    });
    const now = this.now();
    if (
      !session ||
      session.revokedAt !== null ||
      session.expiresAt <= now ||
      session.user.status !== "ACTIVE" ||
      session.user.organization.status !== "ACTIVE"
    ) {
      throw new AuthenticationFailedError();
    }
    return this.toPrincipal(session.id, session.expiresAt, session.user);
  }

  /** Logout: revocation is a timestamp; the row survives for audit. Idempotent for already-revoked. */
  async revokeSession(tokenHash: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const session = await tx.authSession.findUnique({ where: { tokenHash } });
      if (!session) throw new AuthenticationFailedError();
      if (session.revokedAt !== null) return; // already revoked: no second audit event
      await tx.authSession.update({
        where: { id: session.id },
        data: { revokedAt: this.now() },
      });
      await this.auditWriter.write(tx, {
        organizationId: session.organizationId,
        caseId: null,
        action: "SESSION_REVOKED",
        actor: { actorType: "USER", actorId: session.userId },
        objectType: OBJECT_TYPE,
        objectId: session.id,
        metadata: { sessionId: session.id, userId: session.userId },
        occurredAt: this.now(),
      });
    });
  }

  private toPrincipal(
    sessionId: string,
    expiresAt: Date,
    user: { id: string; organizationId: string; displayName: string; roles: string[] },
  ): AuthenticatedPrincipal {
    const roles = user.roles.filter((r): r is UserRole =>
      (USER_ROLES as readonly string[]).includes(r),
    );
    return {
      userId: user.id,
      organizationId: user.organizationId,
      displayName: user.displayName,
      roles,
      sessionId,
      expiresAt,
    };
  }
}
