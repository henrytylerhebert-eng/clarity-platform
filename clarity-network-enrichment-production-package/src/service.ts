import type { CandidateField, EnrichmentPackage, ReviewState } from "./types";
import { validateEnrichmentPackage } from "./validation";
import { reviewRequirement } from "./review-policy";

export interface Actor {
  actorId: string;
  organizationId: string;
  roles: string[];
}

export interface ReviewApproval {
  actorId: string;
  role: string;
  approvedAt: string;
}

export interface CandidateRecord extends CandidateField {
  organizationId: string;
  runId: string;
  version: number;
  approvals: ReviewApproval[];
}

export interface AuditEvent {
  eventType: string;
  organizationId: string;
  objectId: string;
  actorId: string;
  commandId: string;
  correlationId: string;
  previousState: ReviewState | null;
  newState: ReviewState;
  metadata: Record<string, unknown>;
  occurredAt: string;
}

export interface CommandEnvelope<T> {
  commandId: string;
  idempotencyKey: string;
  correlationId: string;
  expectedVersion?: number;
  payload: T;
}

export class DomainError extends Error {
  constructor(public readonly code: "VALIDATION" | "PERMISSION_DENIED" | "NOT_FOUND" | "CONCURRENCY_CONFLICT" | "IDEMPOTENCY_CONFLICT" | "REVIEW_REQUIRED", message: string) { super(message); }
}

export class InMemoryNetworkEnrichmentStore {
  readonly candidates = new Map<string, CandidateRecord>();
  readonly audits: AuditEvent[] = [];
  readonly idempotency = new Map<string, { fingerprint: string; result: unknown }>();

  seedCandidate(record: CandidateRecord): void { this.candidates.set(record.candidateId, structuredClone(record)); }
  getCandidate(id: string): CandidateRecord | undefined { const found = this.candidates.get(id); return found ? structuredClone(found) : undefined; }
}

function fingerprint(command: CommandEnvelope<unknown>): string {
  return JSON.stringify({ commandId: command.commandId, correlationId: command.correlationId, expectedVersion: command.expectedVersion, payload: command.payload });
}

export class NetworkEnrichmentService {
  constructor(private readonly store: InMemoryNetworkEnrichmentStore, private readonly now: () => string = () => new Date().toISOString()) {}

  submitCandidatePackage(actor: Actor, command: CommandEnvelope<{ package: EnrichmentPackage }>): { accepted: number } {
    if (!actor.roles.includes("NETWORK_RESEARCHER")) throw new DomainError("PERMISSION_DENIED", "Permission denied.");
    if (actor.organizationId !== command.payload.package.organizationId) throw new DomainError("PERMISSION_DENIED", "Permission denied.");
    return this.idempotent(actor, command, () => {
      const errors = validateEnrichmentPackage(command.payload.package);
      if (errors.length) throw new DomainError("VALIDATION", errors.join(" "));
      for (const c of command.payload.package.candidates) {
        if (this.store.candidates.has(c.candidateId)) throw new DomainError("VALIDATION", `Candidate ${c.candidateId} already exists.`);
        this.store.seedCandidate({ ...structuredClone(c), organizationId: actor.organizationId, runId: command.payload.package.runId, version: 1, approvals: [] });
        this.store.audits.push({ eventType: "NETWORK_CANDIDATE_SUBMITTED", organizationId: actor.organizationId, objectId: c.candidateId, actorId: actor.actorId, commandId: command.commandId, correlationId: command.correlationId, previousState: null, newState: c.reviewState, metadata: { fieldPath: c.fieldPath, evidenceCount: c.evidenceIds.length }, occurredAt: this.now() });
      }
      return { accepted: command.payload.package.candidates.length };
    });
  }

  approveCandidate(actor: Actor, command: CommandEnvelope<{ candidateId: string; rationale?: string }>): CandidateRecord {
    return this.idempotent(actor, command, () => {
      const current = this.store.candidates.get(command.payload.candidateId);
      if (!current || current.organizationId !== actor.organizationId) throw new DomainError("NOT_FOUND", "Candidate not found.");
      if (command.expectedVersion !== current.version) throw new DomainError("CONCURRENCY_CONFLICT", "Candidate changed before approval.");
      if (["REJECTED", "SUPERSEDED", "DEPRECATED"].includes(current.reviewState)) throw new DomainError("VALIDATION", "Candidate is not approvable in its current state.");
      const requirement = reviewRequirement(current.fieldPath);
      const eligible = requirement.roles.filter(role => actor.roles.includes(role));
      if (!eligible.length) throw new DomainError("PERMISSION_DENIED", "Permission denied.");
      if (current.approvals.some(a => a.actorId === actor.actorId)) throw new DomainError("VALIDATION", "The same actor cannot satisfy multiple approvals for this candidate.");
      const unsatisfied = eligible.find(role => !current.approvals.some(a => a.role === role));
      if (!unsatisfied) throw new DomainError("VALIDATION", "No unsatisfied approval role is available to this actor.");
      const approval = { actorId: actor.actorId, role: unsatisfied, approvedAt: this.now() };
      const approvals = [...current.approvals, approval];
      const complete = requirement.mode === "ANY" ? approvals.some(a => requirement.roles.includes(a.role)) : requirement.roles.every(role => approvals.some(a => a.role === role));
      const nextState: ReviewState = complete ? "HUMAN_CONFIRMED" : "SOURCE_CONFIRMED";
      const next: CandidateRecord = { ...current, reviewState: nextState, operationalUseStatus: complete ? (requirement.roles[0] === "NETWORK_REVIEWER" ? "APPROVED_REFERENCE" : "APPROVED_OPERATIONAL") : "REQUIRES_REVIEW", approvals, version: current.version + 1 };
      this.store.candidates.set(next.candidateId, structuredClone(next));
      this.store.audits.push({ eventType: complete ? "NETWORK_CANDIDATE_APPROVED" : "NETWORK_CANDIDATE_PARTIALLY_APPROVED", organizationId: actor.organizationId, objectId: next.candidateId, actorId: actor.actorId, commandId: command.commandId, correlationId: command.correlationId, previousState: current.reviewState, newState: nextState, metadata: { fieldPath: current.fieldPath, approvalRole: unsatisfied, rationale: command.payload.rationale ?? null }, occurredAt: this.now() });
      return structuredClone(next);
    });
  }

  rejectCandidate(actor: Actor, command: CommandEnvelope<{ candidateId: string; rationale: string }>): CandidateRecord {
    return this.idempotent(actor, command, () => {
      if (!command.payload.rationale?.trim()) throw new DomainError("VALIDATION", "Rationale is required.");
      const current = this.store.candidates.get(command.payload.candidateId);
      if (!current || current.organizationId !== actor.organizationId) throw new DomainError("NOT_FOUND", "Candidate not found.");
      if (command.expectedVersion !== current.version) throw new DomainError("CONCURRENCY_CONFLICT", "Candidate changed before rejection.");
      const requirement = reviewRequirement(current.fieldPath);
      if (!actor.roles.some(role => requirement.roles.includes(role))) throw new DomainError("PERMISSION_DENIED", "Permission denied.");
      const next: CandidateRecord = { ...current, reviewState: "REJECTED", operationalUseStatus: "RETIRED", version: current.version + 1 };
      this.store.candidates.set(next.candidateId, structuredClone(next));
      this.store.audits.push({ eventType: "NETWORK_CANDIDATE_REJECTED", organizationId: actor.organizationId, objectId: next.candidateId, actorId: actor.actorId, commandId: command.commandId, correlationId: command.correlationId, previousState: current.reviewState, newState: "REJECTED", metadata: { fieldPath: current.fieldPath, rationale: command.payload.rationale }, occurredAt: this.now() });
      return structuredClone(next);
    });
  }

  private idempotent<T>(actor: Actor, command: CommandEnvelope<unknown>, action: () => T): T {
    const key = `${actor.organizationId}:${command.idempotencyKey}`;
    const fp = fingerprint(command);
    const prior = this.store.idempotency.get(key);
    if (prior) {
      if (prior.fingerprint !== fp) throw new DomainError("IDEMPOTENCY_CONFLICT", "Idempotency key was reused with different input.");
      return structuredClone(prior.result) as T;
    }
    const result = action();
    this.store.idempotency.set(key, { fingerprint: fp, result: structuredClone(result) });
    return result;
  }
}
