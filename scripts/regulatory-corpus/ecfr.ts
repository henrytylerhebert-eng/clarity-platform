/**
 * eCFR API client.
 *
 * Uses the documented public API only — no page scraping. Endpoints verified
 * live on 2026-07-29:
 *   GET /api/versioner/v1/titles.json
 *       -> per-title `latest_amended_on` and `up_to_date_as_of`
 *   GET /api/versioner/v1/versions/title-{n}.json?part={part}
 *       -> `content_versions[]` with a per-SECTION `amendment_date`
 *   GET /api/versioner/v1/full/{date}/title-{n}.xml?part={part}[&section={s}]
 *       -> the codified text as XML
 *
 * The second endpoint is what makes cheap change detection possible: a section's
 * `amendment_date` moving is authoritative, so nothing has to diff text to know
 * something changed.
 */

import type { PolicyFetcher } from "./fetchPolicy.js";
import type { CfrSource } from "./sources.js";

const ECFR_BASE = "https://www.ecfr.gov/api/versioner/v1";

export interface TitleStatus {
  readonly number: number;
  readonly name: string;
  readonly latestAmendedOn: string;
  readonly upToDateAsOf: string;
}

interface RawTitlesResponse {
  titles?: {
    number?: number;
    name?: string;
    latest_amended_on?: string;
    up_to_date_as_of?: string;
    reserved?: boolean;
  }[];
}

export async function fetchTitleStatuses(fetcher: PolicyFetcher): Promise<Map<number, TitleStatus>> {
  const raw = await fetcher.getJson<RawTitlesResponse>(`${ECFR_BASE}/titles.json`);
  const result = new Map<number, TitleStatus>();

  for (const entry of raw.titles ?? []) {
    const { number, name, latest_amended_on: amended, up_to_date_as_of: upToDate } = entry;
    if (number === undefined || amended === undefined || upToDate === undefined) continue;
    result.set(number, {
      number,
      name: name ?? `Title ${number}`,
      latestAmendedOn: amended,
      upToDateAsOf: upToDate,
    });
  }

  if (result.size === 0) {
    throw new Error("eCFR titles.json returned no usable titles — API shape may have changed");
  }
  return result;
}

export interface SectionVersion {
  readonly identifier: string;
  readonly name: string;
  readonly amendmentDate: string;
}

interface RawVersionsResponse {
  content_versions?: {
    identifier?: string;
    name?: string;
    amendment_date?: string;
    date?: string;
  }[];
}

/**
 * Latest amendment date per section within a part. The API returns one row per
 * historical version, so we keep the maximum date per identifier.
 */
export async function fetchPartSectionVersions(
  fetcher: PolicyFetcher,
  title: number,
  part: string,
): Promise<Map<string, SectionVersion>> {
  const url = `${ECFR_BASE}/versions/title-${title}.json?part=${encodeURIComponent(part)}`;
  const raw = await fetcher.getJson<RawVersionsResponse>(url);

  const latest = new Map<string, SectionVersion>();
  for (const row of raw.content_versions ?? []) {
    const identifier = row.identifier;
    const amendmentDate = row.amendment_date ?? row.date;
    if (identifier === undefined || amendmentDate === undefined) continue;

    const existing = latest.get(identifier);
    if (existing === undefined || amendmentDate > existing.amendmentDate) {
      latest.set(identifier, {
        identifier,
        name: (row.name ?? identifier).replace(/\s+/g, " ").trim(),
        amendmentDate,
      });
    }
  }
  return latest;
}

/**
 * The amendment date that represents a whole source: the section's own date for
 * a section-scoped source, or the newest section date in the part otherwise.
 * Returns undefined when the API knows nothing about it, which the caller must
 * treat as a gap rather than as "unchanged".
 */
export function amendmentDateForSource(
  source: CfrSource,
  sectionVersions: Map<string, SectionVersion>,
): string | undefined {
  if (source.section !== undefined) {
    return sectionVersions.get(source.section)?.amendmentDate;
  }
  let newest: string | undefined;
  for (const version of sectionVersions.values()) {
    if (newest === undefined || version.amendmentDate > newest) newest = version.amendmentDate;
  }
  return newest;
}

export function buildFullTextUrl(source: CfrSource, onDate: string): string {
  const params = new URLSearchParams({ part: source.part });
  if (source.section !== undefined) params.set("section", source.section);
  return `${ECFR_BASE}/full/${onDate}/title-${source.title}.xml?${params.toString()}`;
}

export async function fetchFullText(
  fetcher: PolicyFetcher,
  source: CfrSource,
  onDate: string,
): Promise<string> {
  return fetcher.getText(buildFullTextUrl(source, onDate));
}

/**
 * Minimal, dependency-free readable rendering of eCFR section XML.
 *
 * Deliberately lossy and deliberately NOT authoritative: the cached XML remains
 * the source of record. This exists so a human can read a diff, not so anything
 * can parse it. Structural tags become blank lines; the rest is de-tagged and
 * entity-decoded.
 */
export function xmlToReadableText(xml: string): string {
  return xml
    .replace(/<\?xml[^>]*\?>/g, "")
    .replace(/<\/(P|HEAD|DIV\d|FP|CITA|SECTNO|SUBJECT)>/g, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)))
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .split("\n")
    .map((line) => line.trim())
    .join("\n")
    .trim();
}
