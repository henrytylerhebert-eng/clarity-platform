import type {
  AuditEvent,
  PacketReadinessResult,
  PacketRequirement,
  ParsedAttestAssessment,
  ParsedCreateAssessmentSupplement,
  ParsedEvaluateTargetReadiness,
  ParsedSaveAssessmentDraft,
  ParsedStartPrescreenEncounter,
  ParsedSubmitPrescreen,
  ParsedUpdatePacketRequirement,
  PrescreenAssessmentVersion,
  PrescreenCommandResult,
  PrescreenEncounter,
  PrescreenEventEnvelope,
  PrescreenSubmissionRecord,
} from "@clarity/domain-contracts";

/**
 * The parsed command shapes and result contracts moved to
 * @clarity/domain-contracts (prescreenCommands.ts) so the Phase 3
 * persistence adapter shares them. Re-exported unchanged.
 */
export type {
  ParsedStartPrescreenEncounter,
  ParsedSaveAssessmentDraft,
  ParsedAttestAssessment,
  ParsedCreateAssessmentSupplement,
  ParsedSubmitPrescreen,
  ParsedUpdatePacketRequirement,
  ParsedEvaluateTargetReadiness,
  PrescreenCommandResult,
  PrescreenSubmissionRecord,
} from "@clarity/domain-contracts";

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
