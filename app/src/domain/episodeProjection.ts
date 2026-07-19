export type EpisodeStatus = "ACTIVE" | "DISCHARGED" | "CLOSED";

export type EpisodeCoverageOutcome =
  | "APPROVED"
  | "DENIED"
  | "PENDING"
  | "EXPIRED"
  | "UNREQUESTED"
  | "UNKNOWN"
  | "NOT_REQUIRED";

export type EpisodeRiskFlagCode =
  | "DAY_AT_RISK"
  | "DOCUMENTATION_GAP"
  | "EXPIRING_SOON"
  | "LATE_REVIEW"
  | "UNKNOWN_COVERAGE";

export interface EpisodeDayProjection {
  id: string;
  serviceDate: string;
  outcome: EpisodeCoverageOutcome;
  denialReason?: string;
  riskFlags: EpisodeRiskFlagCode[];
}

export interface EpisodeRiskFlagProjection {
  id: string;
  code: EpisodeRiskFlagCode;
  label: string;
  serviceDate: string;
  explanation: string;
}

export interface EpisodeDocumentationGapProjection {
  id: string;
  category: string;
  status: "OPEN" | "ACKNOWLEDGED" | "IN_PROGRESS" | "RESOLVED";
  assignedRole: string;
  dueAt: string;
  summary: string;
}

export interface EpisodeEventProjection {
  id: string;
  eventType: "ADMISSION_RECORDED" | "AUTHORIZATION_DAY_DECISION_RECORDED" | "DOCUMENTATION_GAP_RECORDED";
  occurredAt: string;
  actor: string;
  status: "DELIVERED" | "PENDING";
  correctionLabel?: string;
}

export interface EpisodeProjection {
  caseId: string;
  caseLabel: string;
  episode: {
    id: string;
    status: EpisodeStatus;
    admittedAt: string;
    serviceDate: string;
    facilityName: string;
    programName: string;
    unitName: string;
    facilityTimezone: string;
    timezoneSource: "FACILITY_CONFIGURATION";
    timezoneReferenceId: string;
  };
  admissionLink: {
    relationship: "ADMISSION_SOURCE" | "TRANSFER_SOURCE" | "READMISSION_SOURCE";
    sourceAcceptanceId: string;
    linkedAt: string;
    linkedBy: string;
  };
  utilization: {
    owner: string;
    assignmentVersion: number;
    levelOfCare: string;
    requirement: "REQUIRED" | "NOT_REQUIRED" | "UNKNOWN";
    reviewType: "INITIAL" | "CONCURRENT" | "RETROSPECTIVE" | "PEER_TO_PEER" | "APPEAL";
    reviewStatus: "PENDING" | "APPROVED" | "DENIED" | "WITHDRAWN" | "UNKNOWN";
    payerReferenceToken: string;
  };
  episodeDays: EpisodeDayProjection[];
  riskFlags: EpisodeRiskFlagProjection[];
  documentationGaps: EpisodeDocumentationGapProjection[];
  events: EpisodeEventProjection[];
  draftMetrics: Array<{ name: string; definition: string; status: "DRAFT" }>;
}

const episodeFixture: Omit<EpisodeProjection, "caseId" | "caseLabel" | "episode" | "admissionLink"> = {
  utilization: {
    owner: "Victor Bermudez, LCSW / UR reviewer",
    assignmentVersion: 2,
    levelOfCare: "Inpatient psychiatric",
    requirement: "REQUIRED",
    reviewType: "CONCURRENT",
    reviewStatus: "PENDING",
    payerReferenceToken: "payer-ref-synthetic-004",
  },
  episodeDays: [
    { id: "episode-day-004-01", serviceDate: "2026-07-08", outcome: "APPROVED", riskFlags: [] },
    { id: "episode-day-004-02", serviceDate: "2026-07-09", outcome: "PENDING", riskFlags: ["DAY_AT_RISK"] },
    {
      id: "episode-day-004-03",
      serviceDate: "2026-07-10",
      outcome: "DENIED",
      denialReason: "DOCUMENTATION_GAP",
      riskFlags: ["DOCUMENTATION_GAP", "DAY_AT_RISK"],
    },
    { id: "episode-day-004-04", serviceDate: "2026-07-11", outcome: "EXPIRED", riskFlags: ["EXPIRING_SOON"] },
    { id: "episode-day-004-05", serviceDate: "2026-07-12", outcome: "UNREQUESTED", riskFlags: ["LATE_REVIEW"] },
    { id: "episode-day-004-06", serviceDate: "2026-07-13", outcome: "UNKNOWN", riskFlags: ["UNKNOWN_COVERAGE"] },
    { id: "episode-day-004-07", serviceDate: "2026-07-14", outcome: "NOT_REQUIRED", riskFlags: [] },
  ],
  riskFlags: [
    {
      id: "episode-risk-004-01",
      code: "DAY_AT_RISK",
      label: "Day at risk",
      serviceDate: "2026-07-09",
      explanation: "Pending payer review leaves the episode day unresolved.",
    },
    {
      id: "episode-risk-004-02",
      code: "DOCUMENTATION_GAP",
      label: "Documentation gap",
      serviceDate: "2026-07-10",
      explanation: "A missing progress note is linked to the denied day decision.",
    },
    {
      id: "episode-risk-004-03",
      code: "EXPIRING_SOON",
      label: "Review window ending",
      serviceDate: "2026-07-11",
      explanation: "The recorded authorization window has reached its expiration boundary.",
    },
  ],
  documentationGaps: [
    {
      id: "gap-004-01",
      category: "MISSING_PROGRESS_NOTE",
      status: "OPEN",
      assignedRole: "UR reviewer",
      dueAt: "2026-07-10T17:00:00-05:00",
      summary: "Concurrent review needs the daily progress note before the denied day can be reconciled.",
    },
    {
      id: "gap-004-02",
      category: "MISSING_TREATMENT_PLAN",
      status: "ACKNOWLEDGED",
      assignedRole: "Treatment team",
      dueAt: "2026-07-11T12:00:00-05:00",
      summary: "Treatment-plan update is acknowledged and remains open for human completion.",
    },
  ],
  events: [
    {
      id: "event-004-admission",
      eventType: "ADMISSION_RECORDED",
      occurredAt: "2026-07-08T14:46:00Z",
      actor: "Facility handoff service (synthetic)",
      status: "DELIVERED",
    },
    {
      id: "event-004-review",
      eventType: "AUTHORIZATION_DAY_DECISION_RECORDED",
      occurredAt: "2026-07-10T15:20:00Z",
      actor: "Victor Bermudez, LCSW",
      status: "DELIVERED",
    },
    {
      id: "event-004-correction",
      eventType: "AUTHORIZATION_DAY_DECISION_RECORDED",
      occurredAt: "2026-07-10T16:05:00Z",
      actor: "Victor Bermudez, LCSW",
      status: "DELIVERED",
      correctionLabel: "Correction supersedes event-004-review; original preserved",
    },
    {
      id: "event-004-gap",
      eventType: "DOCUMENTATION_GAP_RECORDED",
      occurredAt: "2026-07-10T16:06:00Z",
      actor: "Victor Bermudez, LCSW",
      status: "PENDING",
    },
  ],
  draftMetrics: [
    { name: "Episode day coverage", definition: "Recorded approved episode days divided by episode days in scope.", status: "DRAFT" },
    { name: "Days at risk", definition: "Episode days carrying a separate authorization-risk flag at review time.", status: "DRAFT" },
    { name: "Open documentation gaps", definition: "Episode-owned gaps not in a resolved or cancelled state.", status: "DRAFT" },
  ],
};

export function getEpisodeProjection(caseId: string, caseLabel: string): EpisodeProjection {
  const fixtureId = caseId.replace(/[^a-z0-9]+/gi, "-");
  const fixtureToken = caseId === "case-004" ? "004" : fixtureId;
  const sourceAcceptanceId = caseId === "case-004" ? "ref-004-a" : `synthetic-acceptance-${fixtureId}`;
  const fixture = {
    utilization: { ...episodeFixture.utilization, payerReferenceToken: `payer-ref-synthetic-${fixtureId}` },
    episodeDays: episodeFixture.episodeDays.map((day) => ({ ...day, id: day.id.replace("004", fixtureToken) })),
    riskFlags: episodeFixture.riskFlags.map((flag) => ({ ...flag, id: flag.id.replace("004", fixtureToken) })),
    documentationGaps: episodeFixture.documentationGaps.map((gap) => ({ ...gap, id: gap.id.replace("004", fixtureToken) })),
    events: episodeFixture.events.map((event) => ({
      ...event,
      id: event.id.replace("004", fixtureToken),
      correctionLabel: event.correctionLabel?.replace("event-004", `event-${fixtureToken}`),
    })),
    draftMetrics: episodeFixture.draftMetrics.map((metric) => ({ ...metric })),
  };

  return {
    caseId,
    caseLabel,
    episode: {
      id: `episode-${caseId}`,
      status: "ACTIVE",
      admittedAt: "2026-07-08T14:46:00Z",
      serviceDate: "2026-07-08",
      facilityName: "Bayou Vista Behavioral (synthetic)",
      programName: "Inpatient Psychiatry",
      unitName: "Adult Acute Unit",
      facilityTimezone: "America/Chicago",
      timezoneSource: "FACILITY_CONFIGURATION",
      timezoneReferenceId: "facility-config-bayou-vista-central",
    },
    admissionLink: {
      relationship: "ADMISSION_SOURCE",
      sourceAcceptanceId,
      linkedAt: "2026-07-08T14:46:02Z",
      linkedBy: "facility-handoff-actor-synthetic",
    },
    ...fixture,
  };
}
