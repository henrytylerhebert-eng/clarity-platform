import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  ActiveAdmissionExistsError,
  ConcurrencyConflictError,
  CaseNotFoundError,
  EpisodeGateway,
  FacilityNotFoundError,
  GovernedEventGateway,
  InvalidDocumentationGapTransitionError,
  PrismaEpisodePersistenceGateway,
  ReviewAlreadySupersededError,
  TimezoneConfigurationNotFoundError,
  UtilizationReviewGateway,
  type CaseAuditWriter,
} from "@clarity/case-repository";
import { GovernedEventEnvelopeSchema, type AdmissionHandoffCommand, type AuditActor } from "@clarity/domain-contracts";
import { createHarness, type Harness } from "./helpers/harness.js";

/**
 * S2 bounded persistence slice (MSG-0045; docs/decisions/S2_PERSISTENCE_DECISION_PACKET.md).
 * Deterministic behaviors: organization predicates, idempotent replay,
 * single-active-admission, facility-owned timezone lineage, append-only
 * correction chains with one active branch, controlled documentation-gap
 * transitions, optimistic concurrency, and atomic source/audit/event/outbox
 * writes. Synthetic data only.
 */

let h: Harness;
let gateway: PrismaEpisodePersistenceGateway;
let episodeReads: EpisodeGateway;
let urReads: UtilizationReviewGateway;
let eventReads: GovernedEventGateway;

const FIXED_NOW = new Date("2026-07-18T15:00:00.000Z");
let actorA: AuditActor;
let facilityA: string;
let facilityB: string;
let timezoneSourceRefA: string;

async function createCase(tenant: Harness["tenantA"], suffix: string): Promise<string> {
  const id = h.caseKey(suffix);
  await h.prisma.behavioralHealthCase.create({
    data: {
      id,
      organizationId: tenant.organizationId,
      patientTokenId: tenant.patientTokenId,
      status: "DRAFT",
      urgency: "ROUTINE",
    },
  });
  return id;
}

function admissionCommand(caseId: string, overrides: Partial<AdmissionHandoffCommand> = {}): AdmissionHandoffCommand {
  return {
    sourceCaseId: caseId,
    acceptedFacilityResponseId: randomUUID(),
    facilityId: facilityA,
    programId: "synthetic-program-adult-inpatient",
    unitId: null,
    // 03:30Z is 22:30 the PREVIOUS day in America/Chicago — proves the service
    // date comes from the facility timezone, not UTC.
    admittedAt: "2026-07-19T03:30:00.000Z",
    facilityTimezone: {
      facilityTimezone: "America/Chicago",
      source: "FACILITY_CONFIGURATION",
      sourceReferenceId: timezoneSourceRefA,
    },
    sourcePacketVersionId: null,
    sourceCustodyEventId: null,
    attestation: { code: "AUTHORIZED_ADMISSION_RECORDED", method: "FACILITY_WORKFLOW" },
    ...overrides,
  };
}

/** Convenience: full admission for tests that need an episode to build on. */
async function admit(caseSuffix: string) {
  const caseId = await createCase(h.tenantA, caseSuffix);
  const result = await gateway.recordAdmission({
    organizationId: h.tenantA.organizationId,
    command: admissionCommand(caseId),
    actor: actorA,
  });
  return { caseId, ...result };
}

beforeAll(async () => {
  h = await createHarness();
  actorA = { actorType: "USER", actorId: h.tenantA.userId };
  gateway = new PrismaEpisodePersistenceGateway(h.prisma, undefined, () => FIXED_NOW);
  episodeReads = new EpisodeGateway(h.prisma);
  urReads = new UtilizationReviewGateway(h.prisma);
  eventReads = new GovernedEventGateway(h.prisma);

  facilityA = `synthetic-facility-a-${h.runId}`;
  facilityB = `synthetic-facility-b-${h.runId}`;
  await h.prisma.facilityProfile.create({
    data: { id: facilityA, organizationId: h.tenantA.organizationId, name: "Synthetic Facility A" },
  });
  await h.prisma.facilityProfile.create({
    data: { id: facilityB, organizationId: h.tenantB.organizationId, name: "Synthetic Facility B" },
  });
  timezoneSourceRefA = `synthetic-tz-source-${h.runId}`;
  await gateway.recordFacilityTimezoneConfiguration({
    organizationId: h.tenantA.organizationId,
    facilityProfileId: facilityA,
    facilityTimezone: "America/Chicago",
    sourceReferenceId: timezoneSourceRefA,
    effectiveDate: new Date("2026-01-01T00:00:00.000Z"),
    actor: actorA,
  });
});

afterAll(async () => h?.dispose());

describe("facility timezone configuration lineage", () => {
  it("appends versions; the prior version is frozen and linked, never edited away", async () => {
    const facility = `synthetic-facility-tz-${h.runId}`;
    await h.prisma.facilityProfile.create({
      data: { id: facility, organizationId: h.tenantA.organizationId, name: "Synthetic TZ Facility" },
    });
    const v1 = await gateway.recordFacilityTimezoneConfiguration({
      organizationId: h.tenantA.organizationId,
      facilityProfileId: facility,
      facilityTimezone: "America/Chicago",
      sourceReferenceId: "synthetic-tz-ref-v1",
      effectiveDate: new Date("2026-01-01T00:00:00.000Z"),
      actor: actorA,
    });
    const v2 = await gateway.recordFacilityTimezoneConfiguration({
      organizationId: h.tenantA.organizationId,
      facilityProfileId: facility,
      facilityTimezone: "America/New_York",
      sourceReferenceId: "synthetic-tz-ref-v2",
      effectiveDate: new Date("2026-06-01T00:00:00.000Z"),
      actor: actorA,
    });
    expect(v1.version).toBe(1);
    expect(v2.version).toBe(2);
    const frozenV1 = await h.prisma.facilityTimezoneConfiguration.findUniqueOrThrow({ where: { id: v1.id } });
    expect(frozenV1.supersededById).toBe(v2.id);
    expect(frozenV1.facilityTimezone).toBe("America/Chicago"); // original value untouched
    const active = await h.prisma.facilityTimezoneConfiguration.findMany({
      where: { facilityProfileId: facility, supersededById: null },
    });
    expect(active).toHaveLength(1);
    expect(active[0]!.id).toBe(v2.id);
  });

  it("rejects an unknown IANA timezone and a facility outside the organization", async () => {
    await expect(
      gateway.recordFacilityTimezoneConfiguration({
        organizationId: h.tenantA.organizationId,
        facilityProfileId: facilityA,
        facilityTimezone: "Not/AZone",
        sourceReferenceId: "synthetic-bad-tz",
        effectiveDate: FIXED_NOW,
        actor: actorA,
      }),
    ).rejects.toThrow(/Unknown IANA timezone/);
    await expect(
      gateway.recordFacilityTimezoneConfiguration({
        organizationId: h.tenantA.organizationId,
        facilityProfileId: facilityB, // belongs to tenant B
        facilityTimezone: "America/Chicago",
        sourceReferenceId: "synthetic-cross-tenant",
        effectiveDate: FIXED_NOW,
        actor: actorA,
      }),
    ).rejects.toBeInstanceOf(FacilityNotFoundError);
  });
});

describe("admission handoff", () => {
  it("persists episode + link + governed event + audit + outbox atomically, with the service date derived from the facility timezone", async () => {
    const { caseId, ...result } = await admit("admit-happy");
    expect(result.replayed).toBe(false);
    expect(result.serviceDate).toBe("2026-07-18"); // 03:30Z on the 19th is the 18th in Chicago

    const episode = await episodeReads.getEpisode(h.tenantA.organizationId, result.episodeId);
    expect(episode?.status).toBe("ACTIVE");
    expect(episode?.facilityTimezone.sourceReferenceId).toBe(timezoneSourceRefA);

    const links = await episodeReads.getCaseEpisodeLinks(h.tenantA.organizationId, caseId);
    expect(links).toHaveLength(1);
    expect(links[0]!.relationship).toBe("ADMISSION_SOURCE");

    // Episode carries the lineage row it was admitted under.
    const episodeRow = await h.prisma.episode.findUniqueOrThrow({ where: { id: result.episodeId } });
    expect(episodeRow.timezoneConfigurationId).not.toBeNull();

    // Governed event validates against the envelope contract on read-back.
    const envelope = await eventReads.getEvent(h.tenantA.organizationId, result.admissionEventId!);
    expect(envelope?.eventType.name).toBe("ADMISSION_RECORDED");
    expect(envelope?.correction.kind).toBe("ORIGINAL");
    expect(envelope?.tenant.organizationId).toBe(h.tenantA.organizationId);
    expect(GovernedEventEnvelopeSchema.parse(envelope).payload).toMatchObject({
      episodeId: result.episodeId,
      serviceDate: "2026-07-18",
      attestationCode: "AUTHORIZED_ADMISSION_RECORDED",
    });

    // Outbox row written in the same transaction; persistence only, PENDING.
    const outbox = await h.prisma.outboxRecord.findUniqueOrThrow({ where: { id: result.outboxRecordId! } });
    expect(outbox.governedEventId).toBe(result.admissionEventId);
    expect(outbox.status).toBe("PENDING");

    const audits = await h.prisma.auditEvent.findMany({
      where: { organizationId: h.tenantA.organizationId, action: "EPISODE_ADMISSION_RECORDED", objectId: result.episodeId },
    });
    expect(audits).toHaveLength(1);
  });

  it("replays idempotently on the acceptance id without duplicating any fact", async () => {
    const caseId = await createCase(h.tenantA, "admit-replay");
    const command = admissionCommand(caseId);
    const first = await gateway.recordAdmission({ organizationId: h.tenantA.organizationId, command, actor: actorA });
    const second = await gateway.recordAdmission({ organizationId: h.tenantA.organizationId, command, actor: actorA });
    expect(first.replayed).toBe(false);
    expect(second.replayed).toBe(true);
    expect(second.episodeId).toBe(first.episodeId);
    expect(await h.prisma.episode.count({ where: { sourceCaseId: caseId } })).toBe(1);
    expect(await h.prisma.caseEpisodeLink.count({ where: { caseId } })).toBe(1);
    expect(await h.prisma.governedEvent.count({ where: { caseId, eventTypeName: "ADMISSION_RECORDED" } })).toBe(1);
  });

  it("enforces at most one active admission-source episode per case", async () => {
    const caseId = await createCase(h.tenantA, "admit-single-active");
    await gateway.recordAdmission({ organizationId: h.tenantA.organizationId, command: admissionCommand(caseId), actor: actorA });
    await expect(
      gateway.recordAdmission({
        organizationId: h.tenantA.organizationId,
        command: admissionCommand(caseId), // new acceptance id, same case
        actor: actorA,
      }),
    ).rejects.toBeInstanceOf(ActiveAdmissionExistsError);
  });

  it("rejects cross-tenant cases, cross-tenant facilities, and lineage that does not match the active configuration", async () => {
    const caseA = await createCase(h.tenantA, "admit-tenancy");
    // Tenant B cannot see tenant A's case.
    await expect(
      gateway.recordAdmission({
        organizationId: h.tenantB.organizationId,
        command: admissionCommand(caseA, { facilityId: facilityB }),
        actor: { actorType: "USER", actorId: h.tenantB.userId },
      }),
    ).rejects.toBeInstanceOf(CaseNotFoundError);
    // Tenant A cannot admit into tenant B's facility.
    await expect(
      gateway.recordAdmission({
        organizationId: h.tenantA.organizationId,
        command: admissionCommand(caseA, { facilityId: facilityB }),
        actor: actorA,
      }),
    ).rejects.toBeInstanceOf(FacilityNotFoundError);
    // A declared source reference that is not the facility's active configuration is refused.
    await expect(
      gateway.recordAdmission({
        organizationId: h.tenantA.organizationId,
        command: admissionCommand(caseA, {
          facilityTimezone: {
            facilityTimezone: "America/Chicago",
            source: "FACILITY_CONFIGURATION",
            sourceReferenceId: "synthetic-stale-or-forged-ref",
          },
        }),
        actor: actorA,
      }),
    ).rejects.toBeInstanceOf(TimezoneConfigurationNotFoundError);
  });

  it("rolls back the entire admission when the audit write fails (atomicity)", async () => {
    const failingWriter: CaseAuditWriter = {
      write: async () => {
        throw new Error("synthetic audit failure");
      },
    };
    const failing = new PrismaEpisodePersistenceGateway(h.prisma, failingWriter, () => FIXED_NOW);
    const caseId = await createCase(h.tenantA, "admit-atomic");
    await expect(
      failing.recordAdmission({ organizationId: h.tenantA.organizationId, command: admissionCommand(caseId), actor: actorA }),
    ).rejects.toThrow("synthetic audit failure");
    expect(await h.prisma.episode.count({ where: { sourceCaseId: caseId } })).toBe(0);
    expect(await h.prisma.caseEpisodeLink.count({ where: { caseId } })).toBe(0);
    expect(await h.prisma.governedEvent.count({ where: { caseId } })).toBe(0);
    expect(
      await h.prisma.outboxRecord.count({ where: { organizationId: h.tenantA.organizationId, aggregateId: { contains: "admit-atomic" } } }),
    ).toBe(0);
  });
});

describe("episode-owned utilization review", () => {
  it("records an authorization, a review, and inclusive day decisions with one governed event per decision", async () => {
    const admitted = await admit("ur-record");
    const authorization = await gateway.recordEpisodeAuthorization({
      organizationId: h.tenantA.organizationId,
      episodeId: admitted.episodeId,
      levelOfCare: "INPATIENT_PSYCH",
      requirement: "REQUIRED",
      effectiveStartDate: "2026-07-18",
      actor: actorA,
    });
    expect((await urReads.getEpisodeAuthorization(h.tenantA.organizationId, authorization.id))?.requirement).toBe("REQUIRED");

    const review = await gateway.recordAuthorizationReview({
      organizationId: h.tenantA.organizationId,
      episodeId: admitted.episodeId,
      episodeAuthorizationId: authorization.id,
      reviewType: "INITIAL",
      requestedStartDate: "2026-07-18",
      requestedEndDate: "2026-07-21",
      decisionStatus: "APPROVED",
      dayDecisions: [
        { startDate: "2026-07-18", endDate: "2026-07-19", outcome: "APPROVED", denialReasonCode: null },
        { startDate: "2026-07-20", endDate: "2026-07-21", outcome: "DENIED", denialReasonCode: "DOCUMENTATION_GAP" },
      ],
      actor: actorA,
    });
    expect(review.dayDecisions).toHaveLength(2);
    for (const decision of review.dayDecisions) {
      const envelope = await eventReads.getEvent(h.tenantA.organizationId, decision.sourceEventId);
      expect(envelope?.eventType.name).toBe("AUTHORIZATION_DAY_DECISION_RECORDED");
      expect(envelope?.correction.kind).toBe("ORIGINAL");
      const outbox = await h.prisma.outboxRecord.findUnique({ where: { governedEventId: decision.sourceEventId } });
      expect(outbox?.status).toBe("PENDING");
    }
    const decisions = await urReads.getAuthorizationDayDecisions(h.tenantA.organizationId, admitted.episodeId);
    expect(decisions).toHaveLength(2);
    expect(decisions.every((d) => d.supersededByEventId === null)).toBe(true);
  });

  it("rejects reversed ranges and unpaired denial reasons before touching the database", async () => {
    const admitted = await admit("ur-validation");
    const authorization = await gateway.recordEpisodeAuthorization({
      organizationId: h.tenantA.organizationId,
      episodeId: admitted.episodeId,
      levelOfCare: "INPATIENT_PSYCH",
      requirement: "REQUIRED",
      effectiveStartDate: "2026-07-18",
      actor: actorA,
    });
    const base = {
      organizationId: h.tenantA.organizationId,
      episodeId: admitted.episodeId,
      episodeAuthorizationId: authorization.id,
      reviewType: "INITIAL" as const,
      requestedStartDate: "2026-07-18",
      requestedEndDate: "2026-07-19",
      decisionStatus: "APPROVED" as const,
      actor: actorA,
    };
    await expect(
      gateway.recordAuthorizationReview({
        ...base,
        dayDecisions: [{ startDate: "2026-07-19", endDate: "2026-07-18", outcome: "APPROVED", denialReasonCode: null }],
      }),
    ).rejects.toThrow(/start on or before it ends/);
    await expect(
      gateway.recordAuthorizationReview({
        ...base,
        dayDecisions: [{ startDate: "2026-07-18", endDate: "2026-07-19", outcome: "DENIED", denialReasonCode: null }],
      }),
    ).rejects.toThrow(/controlled denial reason/);
    await expect(
      gateway.recordAuthorizationReview({
        ...base,
        dayDecisions: [{ startDate: "2026-07-18", endDate: "2026-07-19", outcome: "APPROVED", denialReasonCode: "LATE_REVIEW" }],
      }),
    ).rejects.toThrow(/Only denied day decisions/);
  });

  it("corrects a review append-only: original frozen, reversal events supersede its decisions, one active branch", async () => {
    const admitted = await admit("ur-correct");
    const authorization = await gateway.recordEpisodeAuthorization({
      organizationId: h.tenantA.organizationId,
      episodeId: admitted.episodeId,
      levelOfCare: "INPATIENT_PSYCH",
      requirement: "REQUIRED",
      effectiveStartDate: "2026-07-18",
      actor: actorA,
    });
    const original = await gateway.recordAuthorizationReview({
      organizationId: h.tenantA.organizationId,
      episodeId: admitted.episodeId,
      episodeAuthorizationId: authorization.id,
      reviewType: "INITIAL",
      requestedStartDate: "2026-07-18",
      requestedEndDate: "2026-07-20",
      decisionStatus: "APPROVED",
      dayDecisions: [{ startDate: "2026-07-18", endDate: "2026-07-20", outcome: "APPROVED", denialReasonCode: null }],
      actor: actorA,
    });

    // A stale expectedVersion is refused before anything is frozen.
    await expect(
      gateway.correctAuthorizationReview({
        organizationId: h.tenantA.organizationId,
        originalReviewId: original.reviewId,
        expectedVersion: 99,
        reasonCode: "PAYER_DATE_RANGE_CORRECTED",
        replacement: {
          reviewType: "INITIAL",
          requestedStartDate: "2026-07-18",
          requestedEndDate: "2026-07-21",
          decisionStatus: "APPROVED",
          dayDecisions: [{ startDate: "2026-07-18", endDate: "2026-07-21", outcome: "APPROVED", denialReasonCode: null }],
        },
        actor: actorA,
      }),
    ).rejects.toBeInstanceOf(ConcurrencyConflictError);

    const correction = await gateway.correctAuthorizationReview({
      organizationId: h.tenantA.organizationId,
      originalReviewId: original.reviewId,
      expectedVersion: original.version,
      reasonCode: "PAYER_DATE_RANGE_CORRECTED",
      replacement: {
        reviewType: "INITIAL",
        requestedStartDate: "2026-07-18",
        requestedEndDate: "2026-07-21",
        decisionStatus: "APPROVED",
        dayDecisions: [{ startDate: "2026-07-18", endDate: "2026-07-21", outcome: "APPROVED", denialReasonCode: null }],
      },
      actor: actorA,
    });

    // Original review frozen and linked, its content untouched.
    const frozen = await h.prisma.authorizationReview.findUniqueOrThrow({ where: { id: original.reviewId } });
    expect(frozen.supersededByReviewId).toBe(correction.replacementReviewId);
    expect(frozen.requestedEndDate).toBe("2026-07-20");
    const replacementRow = await h.prisma.authorizationReview.findUniqueOrThrow({ where: { id: correction.replacementReviewId } });
    expect(replacementRow.correctionReasonCode).toBe("PAYER_DATE_RANGE_CORRECTED");

    // Original day decision superseded by a REVERSAL event; replacement active.
    expect(correction.reversalEventIds).toHaveLength(1);
    const originalDecision = await h.prisma.authorizationDayDecision.findUniqueOrThrow({
      where: { id: original.dayDecisions[0]!.id },
    });
    expect(originalDecision.supersededByEventId).toBe(correction.reversalEventIds[0]);
    const reversal = await eventReads.getEvent(h.tenantA.organizationId, correction.reversalEventIds[0]!);
    expect(reversal?.correction.kind).toBe("REVERSAL");
    expect(reversal?.correction.supersedesEventId).toBe(original.dayDecisions[0]!.sourceEventId);
    expect(reversal?.metricEligibility).toBe("EXCLUDED_CORRECTED");

    // One active branch: correcting the frozen review again is refused.
    await expect(
      gateway.correctAuthorizationReview({
        organizationId: h.tenantA.organizationId,
        originalReviewId: original.reviewId,
        expectedVersion: original.version + 1,
        reasonCode: "DUPLICATE_REVIEW",
        replacement: {
          reviewType: "INITIAL",
          requestedStartDate: "2026-07-18",
          requestedEndDate: "2026-07-22",
          decisionStatus: "APPROVED",
          dayDecisions: [],
        },
        actor: actorA,
      }),
    ).rejects.toBeInstanceOf(ReviewAlreadySupersededError);

    // And the database itself refuses a second supersession of the same event.
    await expect(
      h.prisma.governedEvent.create({
        data: {
          id: randomUUID(),
          organizationId: h.tenantA.organizationId,
          eventTypeName: "AUTHORIZATION_DAY_DECISION_RECORDED",
          eventTypeVersion: 1,
          schemaName: "clarity.governed-event",
          schemaVersion: "1.0.0",
          aggregateType: "AUTHORIZATION_REVIEW",
          aggregateId: original.reviewId,
          aggregateVersion: 3,
          correlationId: randomUUID(),
          correctionKind: "REVERSAL",
          supersedesEventId: original.dayDecisions[0]!.sourceEventId, // already superseded
          reasonCode: "DUPLICATE_REVIEW",
          classification: "PUBLIC_SYNTHETIC",
          metricEligibility: "EXCLUDED_CORRECTED",
          payloadHash: "0".repeat(64),
          envelope: {},
          effectiveAt: FIXED_NOW,
          recordedAt: FIXED_NOW,
        },
      }),
    ).rejects.toThrow(/[Uu]nique/);
  });
});

describe("documentation gaps", () => {
  it("records a gap with an OPEN history row, a governed event, and an outbox row", async () => {
    const admitted = await admit("gap-record");
    const gap = await gateway.recordDocumentationGap({
      organizationId: h.tenantA.organizationId,
      episodeId: admitted.episodeId,
      categoryCode: "MISSING_PROGRESS_NOTE",
      operationalSummary: "Synthetic: progress note absent for review window.",
      actor: actorA,
    });
    expect(gap.status).toBe("OPEN");
    const history = await h.prisma.documentationGapStatusHistory.findMany({
      where: { documentationGapId: gap.id },
      orderBy: { changedAt: "asc" },
    });
    expect(history).toHaveLength(1);
    expect(history[0]!.fromStatus).toBeNull();
    expect(history[0]!.toStatus).toBe("OPEN");
    const event = await h.prisma.governedEvent.findFirst({
      where: { organizationId: h.tenantA.organizationId, eventTypeName: "DOCUMENTATION_GAP_RECORDED", aggregateId: gap.id },
    });
    expect(event).not.toBeNull();
    expect(await h.prisma.outboxRecord.count({ where: { governedEventId: event!.id } })).toBe(1);
  });

  it("allows only controlled transitions, appends history, and enforces optimistic concurrency", async () => {
    const admitted = await admit("gap-transitions");
    const gap = await gateway.recordDocumentationGap({
      organizationId: h.tenantA.organizationId,
      episodeId: admitted.episodeId,
      categoryCode: "MISSING_PHYSICIAN_ORDER",
      actor: actorA,
    });

    const acknowledged = await gateway.transitionDocumentationGap({
      organizationId: h.tenantA.organizationId,
      documentationGapId: gap.id,
      toStatus: "ACKNOWLEDGED",
      expectedVersion: gap.version,
      actor: actorA,
    });
    expect(acknowledged.status).toBe("ACKNOWLEDGED");
    expect(acknowledged.version).toBe(gap.version + 1);

    // Stale version is refused.
    await expect(
      gateway.transitionDocumentationGap({
        organizationId: h.tenantA.organizationId,
        documentationGapId: gap.id,
        toStatus: "RESOLVED",
        expectedVersion: gap.version, // stale
        actor: actorA,
      }),
    ).rejects.toBeInstanceOf(ConcurrencyConflictError);

    const resolved = await gateway.transitionDocumentationGap({
      organizationId: h.tenantA.organizationId,
      documentationGapId: gap.id,
      toStatus: "RESOLVED",
      expectedVersion: acknowledged.version,
      actor: actorA,
    });
    expect(resolved.resolvedByActorId).toBe(actorA.actorId);

    // RESOLVED -> CANCELLED is not in the controlled transition table.
    await expect(
      gateway.transitionDocumentationGap({
        organizationId: h.tenantA.organizationId,
        documentationGapId: gap.id,
        toStatus: "CANCELLED",
        expectedVersion: resolved.version,
        actor: actorA,
      }),
    ).rejects.toBeInstanceOf(InvalidDocumentationGapTransitionError);

    const history = await h.prisma.documentationGapStatusHistory.findMany({
      where: { documentationGapId: gap.id },
      orderBy: { id: "asc" },
    });
    expect(history.map((row) => row.toStatus)).toEqual(["OPEN", "ACKNOWLEDGED", "RESOLVED"]);
  });

  it("keeps reads and writes organization-scoped", async () => {
    const admitted = await admit("gap-tenancy");
    const gap = await gateway.recordDocumentationGap({
      organizationId: h.tenantA.organizationId,
      episodeId: admitted.episodeId,
      categoryCode: "PAYER_REQUESTED_CLARIFICATION",
      actor: actorA,
    });
    expect(await urReads.getDocumentationGap(h.tenantB.organizationId, gap.id)).toBeNull();
    expect(await eventReads.getEvent(h.tenantB.organizationId, admitted.admissionEventId!)).toBeNull();
    expect(await episodeReads.getEpisode(h.tenantB.organizationId, admitted.episodeId)).toBeNull();
    await expect(
      gateway.transitionDocumentationGap({
        organizationId: h.tenantB.organizationId,
        documentationGapId: gap.id,
        toStatus: "ACKNOWLEDGED",
        expectedVersion: gap.version,
        actor: { actorType: "USER", actorId: h.tenantB.userId },
      }),
    ).rejects.toThrow(/not found/);
  });
});
