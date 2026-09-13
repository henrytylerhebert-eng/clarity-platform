import { readdirSync, readFileSync } from "node:fs";
import { extname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import * as contracts from "@clarity/domain-contracts";

/**
 * Enforces the architecture invariant that `packages/domain-contracts` enum
 * arrays mirror every Prisma enum loaded from the configured multi-file schema.
 */

const schemaDirectory = fileURLToPath(new URL("../../prisma/", import.meta.url));

function readPrismaSchemaFiles(directory: string): string {
  return readdirSync(directory, { withFileTypes: true })
    .filter((entry) => entry.isFile() && extname(entry.name) === ".prisma")
    .map((entry) => readFileSync(join(directory, entry.name), "utf8"))
    .join("\n");
}

/** Schema enum name -> the exported contract array that must mirror it. */
const MIRRORED: Readonly<Record<string, string>> = {
  UserRole: "USER_ROLES",
  CaseStatus: "CASE_STATUSES",
  ParallelWorkstreamStatus: "WORKSTREAM_STATUSES",
  UrgencyLevel: "URGENCY_LEVELS",
  LevelOfCare: "LEVELS_OF_CARE",
  LegalStatusType: "LEGAL_STATUS_TYPES",
  DocumentType: "DOCUMENT_TYPES",
  DocumentClassificationStatus: "DOCUMENT_CLASSIFICATION_STATUSES",
  EvidenceStatus: "EVIDENCE_STATUSES",
  EvidenceCategory: "EVIDENCE_CATEGORIES",
  CoverageOrder: "COVERAGE_ORDERS",
  CoverageType: "COVERAGE_TYPES",
  SubscriberRelationship: "SUBSCRIBER_RELATIONSHIPS",
  CoverageStatus: "COVERAGE_STATUSES",
  VerificationMethod: "VERIFICATION_METHODS",
  EligibilityStatus: "ELIGIBILITY_STATUSES",
  ServiceType: "SERVICE_TYPES",
  NetworkStatus: "NETWORK_STATUSES",
  AuthorizationStatus: "AUTHORIZATION_STATUSES",
  EducationRecipientType: "EDUCATION_RECIPIENT_TYPES",
  EducationMethod: "EDUCATION_METHODS",
  AcknowledgementStatus: "ACKNOWLEDGEMENT_STATUSES",
  EpisodeStatus: "EPISODE_STATUSES",
  CaseEpisodeRelationship: "CASE_EPISODE_RELATIONSHIPS",
  EpisodeAuthorizationRequirement: "EPISODE_AUTHORIZATION_REQUIREMENTS",
  EpisodeAuthorizationStatus: "EPISODE_AUTHORIZATION_STATUSES",
  AuthorizationReviewType: "AUTHORIZATION_REVIEW_TYPES",
  AuthorizationReviewStatus: "AUTHORIZATION_REVIEW_STATUSES",
  AuthorizationDayOutcome: "AUTHORIZATION_DAY_OUTCOMES",
  DenialReasonCode: "DENIAL_REASON_CODES",
  DocumentationGapCategory: "DOCUMENTATION_GAP_CATEGORIES",
  DocumentationGapStatus: "DOCUMENTATION_GAP_STATUSES",
  PrescreenEncounterStatus: "PRESCREEN_ENCOUNTER_STATUSES",
  PrescreenAssessmentStatus: "PRESCREEN_ASSESSMENT_STATUSES",
  PatientWillingness: "PATIENT_WILLINGNESS_STATES",
  PossiblePathway: "POSSIBLE_PATHWAYS",
  PrescreenReadinessTarget: "PRESCREEN_READINESS_TARGETS",
  PacketRequirementState: "PACKET_REQUIREMENT_STATES",
  AssuranceParticipantRole: "ASSURANCE_PARTICIPANT_ROLES",
  AssuranceApplicabilityStatus: "ASSURANCE_APPLICABILITY_STATUSES",
  AssuranceAuthorityClass: "ASSURANCE_AUTHORITY_CLASSES",
  AssuranceSourceCurrentness: "ASSURANCE_SOURCE_CURRENTNESS",
  AssuranceSourceRightsStatus: "ASSURANCE_SOURCE_RIGHTS",
  AssuranceReferenceKind: "ASSURANCE_REFERENCE_KINDS",
  AssuranceEvidenceStatus: "ASSURANCE_EVIDENCE_STATUSES",
  AssuranceEvaluationResult: "ASSURANCE_EVALUATION_RESULTS",
  AssuranceReviewDecisionType: "ASSURANCE_REVIEW_DECISIONS",
  AssuranceConflictStatus: "ASSURANCE_CONFLICT_STATUSES",
};

const NOT_MIRRORED: Readonly<Record<string, string>> = {
  OrganizationType: "Tenant metadata; no command validates against it.",
  OrganizationStatus: "Tenant metadata; assignee ACTIVE checks read the column directly.",
  UserStatus: "Auth-internal; session revocation reads the column directly.",
  ReviewObjectType: "Generic review scaffolding; no runtime behind it (ADR-0008 uses EvidenceStatus).",
  ReviewDecision: "Generic review scaffolding; evidence review uses its own command set.",
  RuleDomain: "Rule-engine scaffolding; no runtime.",
  RuleSetStatus: "Rule-engine scaffolding; no runtime.",
  RuleOutcome: "Rule-engine scaffolding; no runtime.",
  Severity: "Rule-engine scaffolding; no runtime.",
  DisclaimerStatus: "Benefit-quote disclaimer is enforced structurally, not by enum.",
  ReferralStatus: "Referral packet workflow is documented-only (no service).",
  CustodyPartyType: "Custody handoff is app/ demo logic only.",
  AuditActorType: "Audit envelope defines its own actor-type union in audit.ts.",
};

const KNOWN_DESYNC: Readonly<
  Record<string, { arrayName: string; extraInSchema: readonly string[]; issue: string }>
> = {
  CaseStatus: {
    arrayName: "CASE_STATUSES",
    extraInSchema: ["RETURNED_FOR_MORE_INFORMATION"],
    issue: "#35",
  },
};

const MEMBER_PATTERN = /^([A-Za-z_][A-Za-z0-9_]*)(?:\s+@[^\s@].*)?$/;

export function parseSchemaEnums(source: string): Map<string, string[]> {
  const withoutComments = source
    .split("\n")
    .map((line) => line.replace(/\/\/.*$/, ""))
    .join("\n");

  const enums = new Map<string, string[]>();
  const blockPattern = /^[ \t]*enum\s+(\w+)\s*\{([^}]*)\}/gm;

  for (const match of withoutComments.matchAll(blockPattern)) {
    const name = match[1];
    const body = match[2];
    if (name === undefined || body === undefined) continue;

    const values = body
      .split("\n")
      .map((line) => line.trim())
      .map((line) => MEMBER_PATTERN.exec(line)?.[1])
      .filter((value): value is string => value !== undefined);
    enums.set(name, values);
  }

  return enums;
}

const schemaEnums = parseSchemaEnums(readPrismaSchemaFiles(schemaDirectory));
const contractArrays = contracts as unknown as Record<string, unknown>;

describe("domain-contracts enum arrays mirror the configured Prisma schema", () => {
  it("parses both the foundation and Operating Assurance schema files", () => {
    expect(schemaEnums.size).toBeGreaterThan(40);
    expect(schemaEnums.get("UserRole")).toContain("SYSTEM_ADMIN");
    expect(schemaEnums.get("AssuranceEvaluationResult")).toContain("REVIEW_REQUIRED");
  });

  it("parses members that carry Prisma attributes, and rejects non-members", () => {
    const parsed = parseSchemaEnums(
      [
        "enum Sample {",
        "  PLAIN",
        '  ATTRIBUTED @map("attributed")',
        "  SPACED   @map(\"spaced\")",
        '  @@map("sample")',
        "",
        "}",
      ].join("\n"),
    );
    expect(parsed.get("Sample")).toEqual(["PLAIN", "ATTRIBUTED", "SPACED"]);
  });

  it("recognizes an indented enum declaration", () => {
    const parsed = parseSchemaEnums(["  enum Indented {", "    ONE", "    TWO", "  }"].join("\n"));
    expect(parsed.get("Indented")).toEqual(["ONE", "TWO"]);
  });

  it("classifies every schema enum as mirrored or explicitly not mirrored", () => {
    const unclassified = [...schemaEnums.keys()].filter(
      (name) => !(name in MIRRORED) && !(name in NOT_MIRRORED),
    );
    expect(
      unclassified,
      `Unclassified schema enum(s): ${unclassified.join(", ")}. Add each to MIRRORED or NOT_MIRRORED with rationale.`,
    ).toEqual([]);
  });

  it("references only schema enums that still exist", () => {
    const stale = [...Object.keys(MIRRORED), ...Object.keys(NOT_MIRRORED)].filter(
      (name) => !schemaEnums.has(name),
    );
    expect(stale, `Enum(s) named here no longer exist: ${stale.join(", ")}.`).toEqual([]);
  });

  it("exports every array named in MIRRORED as a string array", () => {
    for (const [enumName, arrayName] of Object.entries(MIRRORED)) {
      const exported = contractArrays[arrayName];
      expect(
        Array.isArray(exported),
        `${arrayName} (mirroring enum ${enumName}) is not an exported array from @clarity/domain-contracts.`,
      ).toBe(true);
      expect((exported as unknown[]).every((v) => typeof v === "string")).toBe(true);
    }
  });

  it.each(Object.entries(MIRRORED))("%s matches %s exactly", (enumName, arrayName) => {
    const schemaValues = [...(schemaEnums.get(enumName) ?? [])].sort();
    const contractValues = [...(contractArrays[arrayName] as string[])].sort();
    const tolerated = KNOWN_DESYNC[enumName]?.extraInSchema ?? [];
    const missingFromContract = schemaValues.filter(
      (v) => !contractValues.includes(v) && !tolerated.includes(v),
    );
    const missingFromSchema = contractValues.filter((v) => !schemaValues.includes(v));
    expect(
      { missingFromContract, missingFromSchema },
      `${arrayName} is out of sync with enum ${enumName}.`,
    ).toEqual({ missingFromContract: [], missingFromSchema: [] });
  });

  it.each(Object.entries(KNOWN_DESYNC))(
    "%s's known desync has not widened",
    (enumName, { arrayName, extraInSchema, issue }) => {
      const schemaValues = schemaEnums.get(enumName) ?? [];
      const contractValues = contractArrays[arrayName] as string[];
      const actualExtra = schemaValues.filter((v) => !contractValues.includes(v)).sort();
      expect(
        actualExtra,
        `The recorded desync for ${enumName} (${issue}) no longer matches reality.`,
      ).toEqual([...extraInSchema].sort());
    },
  );

  it("records a tracking issue for every tolerated desync", () => {
    for (const [enumName, entry] of Object.entries(KNOWN_DESYNC)) {
      expect(entry.issue, `KNOWN_DESYNC.${enumName} must cite a tracking issue.`).toMatch(/^#\d+$/);
      expect(entry.extraInSchema.length).toBeGreaterThan(0);
    }
  });
});
