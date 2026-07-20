import type { z } from "zod";
import type {
  AuditEvent,
  PacketReadinessResult,
  PacketRequirement,
  PrescreenAssessmentVersion,
  PrescreenEncounter,
  PrescreenEventEnvelope,
} from "@clarity/domain-contracts";
import type {
  AttestAssessmentCommandSchema,
  CreateAssessmentSupplementCommandSchema,
  EvaluateTargetReadinessCommandSchema,
  SaveAssessmentDraftCommandSchema,
  StartPrescreenEncounterCommandSchema,
  SubmitPrescreenCommandSchema,
  UpdatePacketRequirementCommandSchema,
} from "./commands.js";

/** Fully parsed command shapes (defaults applied) handed from service to gateway. */
export type ParsedStartPrescreenEncounter = z.output<typeof StartPrescreenEncounterCommandSchema>;
export type ParsedSaveAssessmentDraft = z.output<typeof SaveAssessmentDraftCommandSchema>;
export type ParsedAttestAssessment = z.output<typeof AttestAssessmentCommandSchema>;
export type ParsedCreateAssessmentSupplement = z.output<typeof CreateAssessmentSupplementCommandSchema>;
export type ParsedSubmitPrescreen = z.output<typeof SubmitPrescreenCommandSchema>;
export type ParsedUpdatePacketRequirement = z.output<typeof UpdatePacketRequirementCommandSchema>;
export type ParsedEvaluateTargetReadiness = z.output<typeof EvaluateTargetReadinessCommandSchema>;

export interface PrescreenCommandResult {
  readonly objectId: string;
  readonly objectType: "PrescreenEncounter" | "PrescreenAssessmentVersion" | "PacketRequirement";
  readonly encounterId: string;
  readonly encounterVersion: number;
  readonly status: string;
  readonly replayed: boolean;
}

/** Recorded submission intent. Grants nothing; implies no acknowledgement, review, or acceptance. */
export interface PrescreenSubmissionRecord {
  readonly encounterId: string;
  readonly organizationId: string;
  readonly assessmentVersionId: string;
  readonly target: string;
  readonly receivingOrganizationId: string;
  readonly submittedAt: string;
  readonly submittedBy: string;
}

/**
 * Gateway contract for the prescreen command service. Each mutating method
 * is atomic: state change, audit event, outbox envelope, and idempotency
 * record commit together or not at all. The contract is Promise-based so
 * the in-memory test double and the Phase 3 Prisma adapter
 * (PrismaPrescreenGateway in @clarity/case-repository) share one
 * interface; provider-backed verification remains separately gated.
 */
export interface PrescreenGateway {
  startEncounter(cmd: ParsedStartPrescreenEncounter): Promise<PrescreenCommandResult>;
  saveAssessmentDraft(cmd: ParsedSaveAssessmentDraft): Promise<PrescreenCommandResult>;
  attestAssessment(cmd: ParsedAttestAssessment): Promise<PrescreenCommandResult>;
  createAssessmentSupplement(cmd: ParsedCreateAssessmentSupplement): Promise<PrescreenCommandResult>;
  submitPrescreen(cmd: ParsedSubmitPrescreen): Promise<PrescreenCommandResult>;
  updatePacketRequirement(cmd: ParsedUpdatePacketRequirement): Promise<PrescreenCommandResult>;
  evaluateTargetReadiness(cmd: ParsedEvaluateTargetReadiness): Promise<PacketReadinessResult>;

  /** Tenant-scoped snapshots (copies) for verification; cross-tenant misses are non-revealing. */
  getEncounter(organizationId: string, encounterId: string): Promise<PrescreenEncounter>;
  getAssessmentVersion(organizationId: string, assessmentVersionId: string): Promise<PrescreenAssessmentVersion>;
  getSubmission(organizationId: string, encounterId: string): Promise<PrescreenSubmissionRecord | undefined>;
  listPacketRequirements(organizationId: string, encounterId: string): Promise<readonly PacketRequirement[]>;

  /** Test/verification inspection of the audit, outbox, and idempotency contracts. */
  auditEvents(): Promise<readonly AuditEvent[]>;
  outboxEnvelopes(): Promise<readonly PrescreenEventEnvelope[]>;
  idempotencyRecordCount(): Promise<number>;
}
