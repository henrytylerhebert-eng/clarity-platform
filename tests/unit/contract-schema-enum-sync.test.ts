import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import * as contracts from "@clarity/domain-contracts";

/**
 * Enforces the architecture invariant that `packages/domain-contracts` enum
 * arrays mirror `prisma/schema.prisma` (CLAUDE.md, "Contracts live in
 * packages/domain-contracts ... enum arrays mirror prisma/schema.prisma — keep
 * in sync").
 *
 * Until now that invariant was enforced only by review and by comments inside
 * the contract files, so a desync was silent and system-wide. Stage 0.4 of
 * docs/governance/AI_OPERATING_MODEL_PLAN.md converts it to a machine check.
 *
 * Two deliberate design choices:
 *
 * 1. Every schema enum must be classified as either MIRRORED or NOT_MIRRORED.
 *    A new schema enum therefore fails this suite until someone decides which
 *    it is. That friction is the point: forgetting to mirror is the failure
 *    mode being closed.
 * 2. Membership is compared as a set. Declaration order is intentionally NOT
 *    asserted — Zod enum and Prisma enum semantics are both order-independent,
 *    and asserting order would produce churn without protecting anything.
 */

const schemaPath = new URL("../../prisma/schema.prisma", import.meta.url);

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
};

/**
 * Schema enums with no contract array, each for a stated reason. Adding an
 * entry here is a decision, not a workaround — it asserts that no service
 * validates against this enum through domain-contracts.
 */
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

/**
 * Desyncs that exist today, each pinned to its exact delta and a tracking issue.
 *
 * This is not a skip. The delta is asserted to be EXACTLY what is recorded, so
 * the suite still fails if the gap widens — only the already-known, already-filed
 * difference is tolerated. Removing an entry once the owner rules on it should be
 * the whole fix.
 */
const KNOWN_DESYNC: Readonly<
  Record<string, { arrayName: string; extraInSchema: readonly string[]; issue: string }>
> = {
  CaseStatus: {
    arrayName: "CASE_STATUSES",
    // Present in prisma/schema.prisma:73-74, inherited from the source-package
    // schema, but absent from CASE_STATUSES, ACTIVE_ORDER, every transition rule
    // and every service. The database can therefore store a case status the
    // domain layer cannot represent or transition. Adding them requires an owner
    // ruling on their transition semantics, so it is not done here.
    extraInSchema: ["MEDICAL_TRANSFER_REQUIRED", "RETURNED_FOR_MORE_INFORMATION"],
    issue: "#35",
  },
};

function parseSchemaEnums(source: string): Map<string, string[]> {
  const withoutComments = source
    .split("\n")
    .map((line) => line.replace(/\/\/.*$/, ""))
    .join("\n");

  const enums = new Map<string, string[]>();
  const blockPattern = /^enum\s+(\w+)\s*\{([^}]*)\}/gm;

  for (const match of withoutComments.matchAll(blockPattern)) {
    const name = match[1];
    const body = match[2];
    if (name === undefined || body === undefined) continue;

    const values = body
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => /^[A-Za-z_][A-Za-z0-9_]*$/.test(line));
    enums.set(name, values);
  }

  return enums;
}

const schemaEnums = parseSchemaEnums(readFileSync(schemaPath, "utf8"));
const contractArrays = contracts as unknown as Record<string, unknown>;

describe("domain-contracts enum arrays mirror prisma/schema.prisma", () => {
  it("parses the schema (guards against a silently-empty test)", () => {
    expect(schemaEnums.size).toBeGreaterThan(30);
    expect(schemaEnums.get("UserRole")).toContain("SYSTEM_ADMIN");
  });

  it("classifies every schema enum as mirrored or explicitly not mirrored", () => {
    const unclassified = [...schemaEnums.keys()].filter(
      (name) => !(name in MIRRORED) && !(name in NOT_MIRRORED),
    );

    expect(
      unclassified,
      `Unclassified schema enum(s): ${unclassified.join(", ")}. Add each to MIRRORED ` +
        `in tests/unit/contract-schema-enum-sync.test.ts (with the exported ` +
        `domain-contracts array that mirrors it), or to NOT_MIRRORED with the reason ` +
        `no contract array is needed.`,
    ).toEqual([]);
  });

  it("references only schema enums that still exist", () => {
    const stale = [...Object.keys(MIRRORED), ...Object.keys(NOT_MIRRORED)].filter(
      (name) => !schemaEnums.has(name),
    );

    expect(
      stale,
      `Enum(s) named here no longer exist in prisma/schema.prisma: ${stale.join(", ")}. ` +
        `Remove the stale entr(ies).`,
    ).toEqual([]);
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

  it.each(Object.entries(MIRRORED))(
    "%s matches %s exactly",
    (enumName, arrayName) => {
      const schemaValues = [...(schemaEnums.get(enumName) ?? [])].sort();
      const contractValues = [...(contractArrays[arrayName] as string[])].sort();

      const tolerated = KNOWN_DESYNC[enumName]?.extraInSchema ?? [];
      const missingFromContract = schemaValues.filter(
        (v) => !contractValues.includes(v) && !tolerated.includes(v),
      );
      const missingFromSchema = contractValues.filter((v) => !schemaValues.includes(v));

      expect(
        { missingFromContract, missingFromSchema },
        `${arrayName} is out of sync with enum ${enumName}. ` +
          `In the schema but not the contract: [${missingFromContract.join(", ")}]. ` +
          `In the contract but not the schema: [${missingFromSchema.join(", ")}].`,
      ).toEqual({ missingFromContract: [], missingFromSchema: [] });
    },
  );

  it.each(Object.entries(KNOWN_DESYNC))(
    "%s's known desync has not widened",
    (enumName, { arrayName, extraInSchema, issue }) => {
      const schemaValues = schemaEnums.get(enumName) ?? [];
      const contractValues = contractArrays[arrayName] as string[];
      const actualExtra = schemaValues.filter((v) => !contractValues.includes(v)).sort();

      expect(
        actualExtra,
        `The recorded desync for ${enumName} (${issue}) no longer matches reality. ` +
          `Recorded: [${[...extraInSchema].sort().join(", ")}]. Actual: [${actualExtra.join(", ")}]. ` +
          `If the gap closed, delete the KNOWN_DESYNC entry. If it widened, that is a new ` +
          `desync — do not extend the entry without an owner ruling.`,
      ).toEqual([...extraInSchema].sort());
    },
  );

  it("records a tracking issue for every tolerated desync", () => {
    for (const [enumName, entry] of Object.entries(KNOWN_DESYNC)) {
      expect(entry.issue, `KNOWN_DESYNC.${enumName} must cite a tracking issue.`).toMatch(
        /^#\d+$/,
      );
      expect(entry.extraInSchema.length).toBeGreaterThan(0);
    }
  });
});
