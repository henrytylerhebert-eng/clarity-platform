/**
 * Regulatory corpus CLI.
 *
 *   npm run regulatory:check    cheap update detection — no full-text fetches
 *   npm run regulatory:sync     fetch, store, update manifest/index/change log
 *   npm run regulatory:index    regenerate the index from the existing manifest
 *   npm run regulatory:fr       resolve Federal Register candidates for review
 *
 * SCOPE BOUNDARY: this is a development-time reference tool. It reads PUBLIC
 * federal regulatory APIs and writes local files. It does not import
 * @prisma/client, touch the Clarity database, handle patient or tenant data, or
 * run as a deployed worker. Scheduling it is a separate owner decision — see
 * docs/regulatory/README.md.
 */

import { mkdirSync, writeFileSync } from "node:fs";

import { PolicyFetcher } from "./fetchPolicy.js";
import {
  amendmentDateForSource,
  buildFullTextUrl,
  fetchFullText,
  fetchPartSectionVersions,
  fetchTitleStatuses,
  xmlToReadableText,
} from "./ecfr.js";
import { searchByRin, searchCandidates } from "./federalRegister.js";
import {
  CFR_SOURCES,
  FEDERAL_REGISTER_SEARCHES,
  assertRegistryIsWellFormed,
  type CfrSource,
} from "./sources.js";
import {
  appendChangeLog,
  actionableChanges,
  detectChanges,
  loadManifest,
  renderIndex,
  saveManifest,
  sha256,
  writeCache,
  type Change,
  type ManifestEntry,
} from "./store.js";

const ROOT = process.cwd();

function log(message: string): void {
  process.stdout.write(`${message}\n`);
}

/** Group sources by (title, part) so one versions call serves every section in it. */
function groupByPart(sources: readonly CfrSource[]): Map<string, CfrSource[]> {
  const groups = new Map<string, CfrSource[]>();
  for (const source of sources) {
    const key = `${source.title}:${source.part}`;
    const bucket = groups.get(key) ?? [];
    bucket.push(source);
    groups.set(key, bucket);
  }
  return groups;
}

interface PartVersionLookup {
  readonly amendmentDates: Map<string, string | undefined>;
  readonly titleUpToDate: Map<number, string>;
}

/**
 * One request per title plus one per distinct part — never per section. This is
 * what keeps `check` cheap enough to run often.
 */
async function loadAmendmentDates(fetcher: PolicyFetcher): Promise<PartVersionLookup> {
  const titles = await fetchTitleStatuses(fetcher);
  const titleUpToDate = new Map<number, string>();
  for (const [number, status] of titles) titleUpToDate.set(number, status.upToDateAsOf);

  const amendmentDates = new Map<string, string | undefined>();
  for (const group of groupByPart(CFR_SOURCES).values()) {
    const first = group[0];
    if (first === undefined) continue;
    log(`  reading versions for title ${first.title} part ${first.part}`);
    const versions = await fetchPartSectionVersions(fetcher, first.title, first.part);
    for (const source of group) {
      amendmentDates.set(source.id, amendmentDateForSource(source, versions));
    }
  }
  return { amendmentDates, titleUpToDate };
}

function reportChanges(changes: readonly Change[]): number {
  const actionable = actionableChanges(changes);
  if (actionable.length === 0) {
    log("\nNo changes detected. Corpus is current against the source APIs.");
    return 0;
  }
  log(`\n${actionable.length} change(s) detected:`);
  for (const change of actionable) log(`  [${change.kind}] ${change.id} — ${change.detail}`);
  return actionable.length;
}

/** Cheap detection: amendment dates only, no full-text fetches. */
async function commandCheck(): Promise<void> {
  const fetcher = new PolicyFetcher();
  const previous = loadManifest(ROOT);
  if (previous === undefined) {
    log("No manifest found. Run `npm run regulatory:sync` first to establish a baseline.");
    process.exitCode = 1;
    return;
  }

  log("Checking amendment dates against the source APIs...");
  const { amendmentDates } = await loadAmendmentDates(fetcher);

  const drifted: string[] = [];
  for (const source of CFR_SOURCES) {
    const recorded = previous.entries[source.id];
    const live = amendmentDates.get(source.id);
    if (recorded === undefined) {
      drifted.push(`${source.id}: not in manifest (new source in the registry)`);
      continue;
    }
    if (recorded.amendmentDate !== live) {
      drifted.push(
        `${source.id}: manifest ${recorded.amendmentDate ?? "unknown"} -> live ${live ?? "unknown"}`,
      );
    }
  }

  if (drifted.length === 0) {
    log("\nNo amendment-date drift. A sync would fetch nothing new.");
    return;
  }
  log(`\n${drifted.length} source(s) drifted — run \`npm run regulatory:sync\`:`);
  for (const line of drifted) log(`  ${line}`);
  // Non-zero so a future scheduled invocation can branch on it.
  process.exitCode = 2;
}

async function commandSync(): Promise<void> {
  const runAt = new Date().toISOString();
  const fetcher = new PolicyFetcher();
  const previous = loadManifest(ROOT);

  log("Resolving amendment dates...");
  const { amendmentDates, titleUpToDate } = await loadAmendmentDates(fetcher);

  const entries: Record<string, ManifestEntry> = {};
  const failures: string[] = [];

  for (const source of CFR_SOURCES) {
    const onDate = titleUpToDate.get(source.title);
    if (onDate === undefined) {
      failures.push(`${source.id}: no up-to-date date for title ${source.title}`);
      continue;
    }
    try {
      log(`  fetching ${source.citation}`);
      const xml = await fetchFullText(fetcher, source, onDate);
      const hash = sha256(xml);
      writeCache(ROOT, source.id, hash, "xml", xml);
      writeCache(ROOT, source.id, hash, "txt", xmlToReadableText(xml));
      entries[source.id] = {
        id: source.id,
        citation: source.citation,
        agency: source.agency,
        surface: source.surface,
        sourceUrl: buildFullTextUrl(source, onDate),
        amendmentDate: amendmentDates.get(source.id),
        contentSha256: hash,
        bytes: Buffer.byteLength(xml, "utf8"),
        retrievedAt: runAt,
        relevance: source.relevance,
      };
    } catch (error) {
      failures.push(`${source.id}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  const changes = detectChanges(previous, entries);
  const manifest = { schemaVersion: 1 as const, generatedAt: runAt, entries };
  saveManifest(ROOT, manifest);
  writeFileIndex(manifest);
  appendChangeLog(ROOT, runAt, changes);

  log(`\nStored ${Object.keys(entries).length}/${CFR_SOURCES.length} sources.`);
  reportChanges(changes);

  if (failures.length > 0) {
    // Loud and non-zero: a partial corpus that looks complete is the failure
    // mode most likely to mislead someone later.
    log(`\n${failures.length} source(s) FAILED and are absent from the corpus:`);
    for (const failure of failures) log(`  ${failure}`);
    process.exitCode = 1;
  }
}

function writeFileIndex(manifest: Parameters<typeof renderIndex>[0]): void {
  mkdirSync("docs/regulatory", { recursive: true });
  writeFileSync("docs/regulatory/CORPUS_INDEX.md", `${renderIndex(manifest)}\n`, "utf8");
}

function commandIndex(): void {
  const manifest = loadManifest(ROOT);
  if (manifest === undefined) {
    log("No manifest found. Run `npm run regulatory:sync` first.");
    process.exitCode = 1;
    return;
  }
  writeFileIndex(manifest);
  log(`Regenerated docs/regulatory/CORPUS_INDEX.md from ${Object.keys(manifest.entries).length} entries.`);
}

/**
 * Federal Register candidates require human confirmation, so this only reports.
 * It never writes a document number into the registry.
 */
async function commandFederalRegister(): Promise<void> {
  const fetcher = new PolicyFetcher();
  log("Federal Register candidates — CONFIRM BY HAND before citing any of these.\n");

  for (const search of FEDERAL_REGISTER_SEARCHES) {
    const mode =
      search.rin !== undefined ? `RIN ${search.rin} (exact)` : `term "${search.query}" (fuzzy)`;
    log(`## ${search.id} — ${mode}`);
    log(`   ${search.relevance}`);
    try {
      const candidates =
        search.rin !== undefined
          ? await searchByRin(fetcher, search.rin)
          : await searchCandidates(fetcher, search.query);
      if (candidates.length === 0) {
        log("   no candidates returned\n");
        continue;
      }
      for (const doc of candidates.slice(0, 5)) {
        const rin = doc.regulationIdNumbers.join(", ") || "no RIN";
        log(`   - ${doc.documentNumber} (${doc.publicationDate}, ${doc.type}, ${rin})`);
        log(`     ${doc.title.slice(0, 150)}`);
        log(`     effective: ${doc.effectiveOn ?? "not stated"}`);
      }
      log("");
    } catch (error) {
      log(`   FAILED: ${error instanceof Error ? error.message : String(error)}\n`);
      process.exitCode = 1;
    }
  }
}

async function main(): Promise<void> {
  assertRegistryIsWellFormed();
  const command = process.argv[2] ?? "check";

  switch (command) {
    case "check":
      await commandCheck();
      return;
    case "sync":
      await commandSync();
      return;
    case "index":
      commandIndex();
      return;
    case "federal-register":
      await commandFederalRegister();
      return;
    default:
      log(`Unknown command: ${command}`);
      log("Expected one of: check | sync | index | federal-register");
      process.exitCode = 1;
  }
}

// Not top-level await: the package is not ESM-typed, so tsx transforms this to
// CJS where top-level await is unavailable.
main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.stack ?? error.message : String(error)}\n`);
  process.exitCode = 1;
});
