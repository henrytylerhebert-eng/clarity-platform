/**
 * Federal Register API client.
 *
 * Documented public API only. Verified live 2026-07-29:
 *   GET /api/v1/documents.json?conditions[agencies][]=...&conditions[term]=...
 *   GET /api/v1/documents/{document_number}.json
 *
 * Deliberate design choice: this module does NOT try to decide which final rule
 * corresponds to a shorthand like "CMS-0057-F". A term search for that rule
 * returns 254 results whose newest entries are unrelated payment rules, so any
 * automatic pick would be a guess presented as a citation. Instead it returns
 * ranked CANDIDATES for human confirmation, and only a document number that a
 * human has written into the registry is treated as resolved.
 */

import type { PolicyFetcher } from "./fetchPolicy.js";

const FR_BASE = "https://www.federalregister.gov/api/v1";
const CMS_AGENCY_SLUG = "centers-for-medicare-medicaid-services";

export interface FederalRegisterDocument {
  readonly documentNumber: string;
  readonly title: string;
  readonly type: string;
  readonly publicationDate: string;
  readonly effectiveOn: string | undefined;
  readonly htmlUrl: string;
  readonly regulationIdNumbers: readonly string[];
}

interface RawDocument {
  document_number?: string;
  title?: string;
  type?: string;
  publication_date?: string;
  effective_on?: string | null;
  html_url?: string;
  regulation_id_numbers?: string[];
}

interface RawSearchResponse {
  count?: number;
  results?: RawDocument[];
}

const REQUESTED_FIELDS = [
  "document_number",
  "title",
  "type",
  "publication_date",
  "effective_on",
  "html_url",
  "regulation_id_numbers",
] as const;

function toDocument(raw: RawDocument): FederalRegisterDocument | undefined {
  const { document_number: number, title, html_url: htmlUrl } = raw;
  if (number === undefined || title === undefined || htmlUrl === undefined) return undefined;
  return {
    documentNumber: number,
    title: title.replace(/\s+/g, " ").trim(),
    type: raw.type ?? "Unknown",
    publicationDate: raw.publication_date ?? "unknown",
    effectiveOn: raw.effective_on ?? undefined,
    htmlUrl,
    regulationIdNumbers: raw.regulation_id_numbers ?? [],
  };
}

export function buildSearchUrl(term: string, options: { finalRulesOnly?: boolean } = {}): string {
  const params = new URLSearchParams();
  params.set("per_page", "10");
  params.set("order", "relevance");
  params.append("conditions[agencies][]", CMS_AGENCY_SLUG);
  params.set("conditions[term]", term);
  if (options.finalRulesOnly !== false) params.append("conditions[type][]", "RULE");
  for (const field of REQUESTED_FIELDS) params.append("fields[]", field);
  return `${FR_BASE}/documents.json?${params.toString()}`;
}

/** Ranked candidates for a human to confirm. Never treated as a resolved citation. */
export async function searchCandidates(
  fetcher: PolicyFetcher,
  term: string,
): Promise<readonly FederalRegisterDocument[]> {
  const raw = await fetcher.getJson<RawSearchResponse>(buildSearchUrl(term));
  return (raw.results ?? [])
    .map(toDocument)
    .filter((doc): doc is FederalRegisterDocument => doc !== undefined);
}

/**
 * Regulation Identifier Number lookup — precise where a term search is not.
 * Verified 2026-07-29: RIN 0938-AU87 returns exactly 3 documents (the proposed
 * rule, the final rule, and its correction), whereas the equivalent term search
 * returns 254 results topped by unrelated payment rules.
 */
export function buildRinSearchUrl(rin: string): string {
  const params = new URLSearchParams();
  params.set("per_page", "20");
  params.set("order", "oldest");
  params.set("conditions[regulation_id_number]", rin);
  for (const field of REQUESTED_FIELDS) params.append("fields[]", field);
  return `${FR_BASE}/documents.json?${params.toString()}`;
}

/** The full rulemaking family for a RIN, oldest first. */
export async function searchByRin(
  fetcher: PolicyFetcher,
  rin: string,
): Promise<readonly FederalRegisterDocument[]> {
  const raw = await fetcher.getJson<RawSearchResponse>(buildRinSearchUrl(rin));
  return (raw.results ?? [])
    .map(toDocument)
    .filter((doc): doc is FederalRegisterDocument => doc !== undefined);
}

export function buildDocumentUrl(documentNumber: string): string {
  const params = new URLSearchParams();
  for (const field of REQUESTED_FIELDS) params.append("fields[]", field);
  return `${FR_BASE}/documents/${encodeURIComponent(documentNumber)}.json?${params.toString()}`;
}

export async function fetchDocument(
  fetcher: PolicyFetcher,
  documentNumber: string,
): Promise<FederalRegisterDocument> {
  const raw = await fetcher.getJson<RawDocument>(buildDocumentUrl(documentNumber));
  const doc = toDocument(raw);
  if (doc === undefined) {
    throw new Error(`Federal Register document ${documentNumber} returned an unusable payload`);
  }
  return doc;
}
