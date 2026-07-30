/**
 * The registry of regulatory sources this tool tracks.
 *
 * Scope is derived from the surfaces enumerated in
 * docs/legal/GEMINI_DEEP_RESEARCH_PROMPT_CMS_MEDICARE_MEDICAID.md. The
 * `surface` field cross-references that document's section letters so the
 * corpus and the research prompt stay legible against each other.
 *
 * IMPORTANT: presence in this registry asserts only that the citation is worth
 * TRACKING. It asserts nothing about whether the requirement applies to
 * Clarity, how it should be interpreted, or that anyone has reviewed it.
 * Applicability is `Derived` per docs/discovery/DISCOVERY_CLASSIFICATION_STANDARD.md
 * and requires named human review (OD-2 counsel, OD-3 clinical).
 */

export interface CfrSource {
  readonly kind: "cfr";
  /** Stable id used as the manifest key and in the generated index. */
  readonly id: string;
  readonly title: number;
  readonly part: string;
  /** Omit to track the whole part. */
  readonly section?: string;
  readonly citation: string;
  /** Section letter in the research prompt. */
  readonly surface: string;
  /** Why Clarity tracks it — which workflow it touches. */
  readonly relevance: string;
  /** Non-CMS sources must be labelled so the corpus never implies CMS authority. */
  readonly agency: "CMS" | "SAMHSA" | "OCR" | "ASTP-ONC";
}

export interface FederalRegisterSource {
  readonly kind: "federal-register";
  readonly id: string;
  /** Federal Register document number, e.g. "2024-00895". */
  readonly documentNumber: string;
  readonly citation: string;
  readonly surface: string;
  readonly relevance: string;
  readonly agency: "CMS";
}

export type RegulatorySource = CfrSource | FederalRegisterSource;

/**
 * 42 CFR unless noted. Section-level where the obligation is section-specific,
 * part-level where the whole part is the unit of interest.
 */
export const CFR_SOURCES: readonly CfrSource[] = [
  // A — EMTALA. Highest-consequence surface for a placement platform.
  {
    kind: "cfr",
    id: "cfr-42-489.24",
    title: 42,
    part: "489",
    section: "489.24",
    citation: "42 CFR 489.24",
    surface: "A",
    agency: "CMS",
    relevance:
      "EMTALA: medical screening exam, stabilization, appropriate transfer, recipient-hospital duty to accept. Touches prescreen, packet preparation, routing, transport.",
  },
  {
    kind: "cfr",
    id: "cfr-42-489.20",
    title: 42,
    part: "489",
    section: "489.20",
    citation: "42 CFR 489.20",
    surface: "A",
    agency: "CMS",
    relevance:
      "Provider-agreement responsibilities including the EMTALA-related record, log, and reporting duties.",
  },

  // B — Hospital Conditions of Participation.
  {
    kind: "cfr",
    id: "cfr-42-482.13",
    title: 42,
    part: "482",
    section: "482.13",
    citation: "42 CFR 482.13",
    surface: "B",
    agency: "CMS",
    relevance:
      "Patient rights, including restraint/seclusion standards and death reporting. Touches legal-status workflow and case documentation.",
  },
  {
    kind: "cfr",
    id: "cfr-42-482.24",
    title: 42,
    part: "482",
    section: "482.24",
    citation: "42 CFR 482.24",
    surface: "B",
    agency: "CMS",
    relevance:
      "Medical records: content, authentication/signature, retention. Check against Clarity's append-only correction model.",
  },
  {
    kind: "cfr",
    id: "cfr-42-482.30",
    title: 42,
    part: "482",
    section: "482.30",
    citation: "42 CFR 482.30",
    surface: "B",
    agency: "CMS",
    relevance: "Utilization review plan and who may make determinations. Touches episode-owned UR.",
  },
  {
    kind: "cfr",
    id: "cfr-42-482.43",
    title: 42,
    part: "482",
    section: "482.43",
    citation: "42 CFR 482.43",
    surface: "B",
    agency: "CMS",
    relevance:
      "Discharge planning, including transfer of necessary medical information to the receiving facility. Touches packet preparation and handoff.",
  },
  {
    kind: "cfr",
    id: "cfr-42-482.61",
    title: 42,
    part: "482",
    section: "482.61",
    citation: "42 CFR 482.61",
    surface: "B",
    agency: "CMS",
    relevance:
      "Special medical-record requirements for psychiatric hospitals (B-tags): treatment plans, progress notes.",
  },
  {
    kind: "cfr",
    id: "cfr-42-482.62",
    title: 42,
    part: "482",
    section: "482.62",
    citation: "42 CFR 482.62",
    surface: "B",
    agency: "CMS",
    relevance: "Special staffing requirements for psychiatric hospitals.",
  },

  // C — Medicare coverage and payment for inpatient psychiatric care.
  {
    kind: "cfr",
    id: "cfr-42-424.14",
    title: 42,
    part: "424",
    section: "424.14",
    citation: "42 CFR 424.14",
    surface: "C",
    agency: "CMS",
    relevance:
      "Physician certification and recertification for inpatient psychiatric services: who certifies, when, and what it must state.",
  },
  {
    kind: "cfr",
    id: "cfr-42-412-subpart-N",
    title: 42,
    part: "412",
    citation: "42 CFR 412 (incl. Subpart N, IPF PPS)",
    surface: "C",
    agency: "CMS",
    relevance:
      "Inpatient Psychiatric Facility Prospective Payment System. Part-level because the subpart is the unit of interest.",
  },

  // D — Medicaid, including managed-care authorization.
  {
    kind: "cfr",
    id: "cfr-42-438.210",
    title: 42,
    part: "438",
    section: "438.210",
    citation: "42 CFR 438.210",
    surface: "D",
    agency: "CMS",
    relevance:
      "Managed-care authorization of services: decision timeframes and notice requirements. Touches authorization readiness.",
  },
  {
    kind: "cfr",
    id: "cfr-42-438.404",
    title: 42,
    part: "438",
    section: "438.404",
    citation: "42 CFR 438.404",
    surface: "D",
    agency: "CMS",
    relevance: "Notice of adverse benefit determination — timing and content.",
  },
  {
    kind: "cfr",
    id: "cfr-42-441-subpart-G",
    title: 42,
    part: "441",
    citation: "42 CFR 441 (incl. Subpart G, PRTF)",
    surface: "D",
    agency: "CMS",
    relevance:
      "Psychiatric residential treatment facilities for beneficiaries under 21, if minors are in placement scope.",
  },

  // J — Other provider types.
  {
    kind: "cfr",
    id: "cfr-42-485-subpart-J",
    title: 42,
    part: "485",
    citation: "42 CFR 485 (incl. Subpart J, CMHC)",
    surface: "J",
    agency: "CMS",
    relevance: "Community Mental Health Center conditions — possible tenant or placement target.",
  },

  // H — Privacy and consent. NOT CMS; labelled accordingly.
  {
    kind: "cfr",
    id: "cfr-42-part-2",
    title: 42,
    part: "2",
    citation: "42 CFR Part 2",
    surface: "H",
    agency: "SAMHSA",
    relevance:
      "Confidentiality of substance use disorder patient records: consent content, redisclosure limits. Bears directly on the consent-authority evaluator. NOT a CMS rule.",
  },
  {
    kind: "cfr",
    id: "cfr-45-164",
    title: 45,
    part: "164",
    citation: "45 CFR Part 164",
    surface: "H",
    agency: "OCR",
    relevance:
      "HIPAA Privacy and Security Rules — treatment/coordination disclosures and minimum necessary. NOT a CMS rule.",
  },
  {
    kind: "cfr",
    id: "cfr-45-171",
    title: 45,
    part: "171",
    citation: "45 CFR Part 171",
    surface: "E",
    agency: "ASTP-ONC",
    relevance: "Information blocking and its exceptions. NOT a CMS rule.",
  },
];

/**
 * Federal Register final rules worth tracking as published documents rather
 * than as codified text, because the preamble carries the interpretation.
 *
 * Document numbers are UNVERIFIED placeholders resolved at sync time by
 * searching the Federal Register API — see `resolveDocumentNumber`. They are
 * recorded here as search targets, not as asserted citations.
 */
export const FEDERAL_REGISTER_SEARCHES: readonly {
  readonly id: string;
  readonly query: string;
  /**
   * Regulation Identifier Number. When present it is used INSTEAD of the term
   * search, because a RIN identifies a rulemaking family exactly. Only set a
   * RIN that has been verified against the API — a wrong RIN is a wrong
   * citation, which is worse than an unresolved one.
   */
  readonly rin?: string;
  readonly surface: string;
  readonly relevance: string;
}[] = [
  {
    id: "fr-cms-0057-f",
    query: "Advancing Interoperability and Improving Prior Authorization",
    // Verified live 2026-07-29: returns the proposed rule (2022-26479), the
    // final rule (2024-00895, effective 2024-04-08), and its correction
    // (2024-24801). This is CMS-0057-F.
    rin: "0938-AU87",
    surface: "E",
    relevance:
      "CMS-0057-F. Prior-authorization decision timeframes, specific denial reasons, and the FHIR API requirements. Time-critical: operational provisions believed already in force — confirm against the rule text.",
  },
  {
    id: "fr-cms-3317-f",
    query: "Discharge Planning Requirements Revisions",
    // RIN intentionally unset — not verified. Term search yields candidates for
    // human confirmation rather than an asserted match.
    surface: "B",
    relevance: "CMS-3317-F. Revised discharge-planning CoP. RIN not yet verified.",
  },
  {
    id: "fr-cms-9115-f",
    query: "Interoperability and Patient Access for Medicare Advantage",
    surface: "E",
    relevance:
      "CMS-9115-F. Patient access and payer-to-payer exchange. RIN not yet verified — note that a term search for this phrase surfaces the 0938-AU87 (CMS-0057-F) family, so candidates here need care.",
  },
];

export const ALL_CFR_SOURCE_IDS: readonly string[] = CFR_SOURCES.map((s) => s.id);

/** Guards against a duplicate id silently overwriting a manifest entry. */
export function assertRegistryIsWellFormed(): void {
  const seen = new Set<string>();
  for (const source of CFR_SOURCES) {
    if (seen.has(source.id)) throw new Error(`Duplicate source id: ${source.id}`);
    seen.add(source.id);
  }
  for (const search of FEDERAL_REGISTER_SEARCHES) {
    if (seen.has(search.id)) throw new Error(`Duplicate source id: ${search.id}`);
    seen.add(search.id);
  }
}
