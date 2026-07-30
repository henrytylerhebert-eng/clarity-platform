/**
 * Corpus storage and change detection.
 *
 * Split deliberately:
 *   - TRACKED   docs/regulatory/corpus-manifest.json — small, reviewable, diffable
 *               metadata: citation, URL, amendment date, content hash, byte size.
 *   - TRACKED   docs/regulatory/CORPUS_INDEX.md      — generated human-readable index.
 *   - TRACKED   docs/regulatory/CHANGE_LOG.md        — append-only detected changes.
 *   - UNTRACKED .regulatory-cache/                   — raw payloads, content-addressed.
 *
 * Rationale: committing the full regulatory text would add megabytes that churn
 * on every amendment and bury real changes. Committing hashes plus an index
 * keeps `git diff` meaningful — a changed hash IS the signal — while the text
 * stays one command away locally. The cache follows the existing
 * `.local-object-storage/` precedent of untracked local bytes.
 */

import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";

export const CACHE_DIR = ".regulatory-cache";
export const MANIFEST_PATH = "docs/regulatory/corpus-manifest.json";
export const INDEX_PATH = "docs/regulatory/CORPUS_INDEX.md";
export const CHANGE_LOG_PATH = "docs/regulatory/CHANGE_LOG.md";

export interface ManifestEntry {
  readonly id: string;
  readonly citation: string;
  readonly agency: string;
  readonly surface: string;
  readonly sourceUrl: string;
  /** Authoritative amendment date from the source API, when it provides one. */
  readonly amendmentDate: string | undefined;
  readonly contentSha256: string;
  readonly bytes: number;
  readonly retrievedAt: string;
  readonly relevance: string;
}

export interface Manifest {
  readonly schemaVersion: 1;
  /** Set by the caller, never by clock access inside this module. */
  readonly generatedAt: string;
  readonly entries: Readonly<Record<string, ManifestEntry>>;
}

export function emptyManifest(generatedAt: string): Manifest {
  return { schemaVersion: 1, generatedAt, entries: {} };
}

export function sha256(content: string): string {
  return createHash("sha256").update(content, "utf8").digest("hex");
}

export function loadManifest(root: string): Manifest | undefined {
  const path = join(root, MANIFEST_PATH);
  if (!existsSync(path)) return undefined;
  const parsed = JSON.parse(readFileSync(path, "utf8")) as Manifest;
  if (parsed.schemaVersion !== 1) {
    throw new Error(`Unsupported manifest schemaVersion: ${String(parsed.schemaVersion)}`);
  }
  return parsed;
}

export function saveManifest(root: string, manifest: Manifest): void {
  const path = join(root, MANIFEST_PATH);
  mkdirSync(dirname(path), { recursive: true });
  // Sorted keys so the tracked diff is stable across runs.
  const sorted = Object.fromEntries(
    Object.entries(manifest.entries).sort(([a], [b]) => a.localeCompare(b)),
  );
  writeFileSync(path, `${JSON.stringify({ ...manifest, entries: sorted }, null, 2)}\n`, "utf8");
}

/** Content-addressed so an unchanged fetch is a no-op write. */
export function cachePathFor(root: string, id: string, hash: string, extension: string): string {
  return join(root, CACHE_DIR, id, `${hash.slice(0, 16)}.${extension}`);
}

export function writeCache(
  root: string,
  id: string,
  hash: string,
  extension: string,
  content: string,
): string {
  const path = cachePathFor(root, id, hash, extension);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, content, "utf8");
  return path;
}

export type ChangeKind = "added" | "amended" | "content-changed" | "removed" | "unchanged";

export interface Change {
  readonly id: string;
  readonly kind: ChangeKind;
  readonly detail: string;
}

/**
 * Compares a previous manifest against freshly fetched entries.
 *
 * `amended` outranks `content-changed`: an amendment date moving is the
 * source's own authoritative statement that the text changed, whereas a hash
 * change without a date change is worth reporting separately — it usually means
 * an editorial or API-formatting change rather than a substantive amendment,
 * and conflating the two would make the change log untrustworthy.
 */
export function detectChanges(
  previous: Manifest | undefined,
  current: Readonly<Record<string, ManifestEntry>>,
): readonly Change[] {
  const before = previous?.entries ?? {};
  const changes: Change[] = [];

  for (const [id, entry] of Object.entries(current)) {
    const old = before[id];
    if (old === undefined) {
      changes.push({
        id,
        kind: "added",
        detail: `first retrieval (amendment date ${entry.amendmentDate ?? "unknown"})`,
      });
      continue;
    }
    if (old.amendmentDate !== entry.amendmentDate) {
      changes.push({
        id,
        kind: "amended",
        detail: `amendment date ${old.amendmentDate ?? "unknown"} -> ${entry.amendmentDate ?? "unknown"}`,
      });
      continue;
    }
    if (old.contentSha256 !== entry.contentSha256) {
      changes.push({
        id,
        kind: "content-changed",
        detail: `content hash changed with no amendment-date change (${old.contentSha256.slice(0, 12)} -> ${entry.contentSha256.slice(0, 12)}); likely editorial or API formatting, verify before treating as substantive`,
      });
      continue;
    }
    changes.push({ id, kind: "unchanged", detail: "no change" });
  }

  for (const id of Object.keys(before)) {
    if (current[id] === undefined) {
      changes.push({
        id,
        kind: "removed",
        detail: "present in the previous manifest but not retrieved in this run",
      });
    }
  }

  return changes;
}

export function actionableChanges(changes: readonly Change[]): readonly Change[] {
  return changes.filter((c) => c.kind !== "unchanged");
}

/** Appends a dated section; never rewrites history. */
export function appendChangeLog(root: string, runAt: string, changes: readonly Change[]): void {
  const actionable = actionableChanges(changes);
  if (actionable.length === 0) return;

  const path = join(root, CHANGE_LOG_PATH);
  mkdirSync(dirname(path), { recursive: true });

  const lines = actionable.map((c) => `- **${c.id}** — \`${c.kind}\`: ${c.detail}`).join("\n");
  const section = `## ${runAt}\n\n${lines}\n`;

  const existing = existsSync(path)
    ? readFileSync(path, "utf8")
    : `# Regulatory corpus change log\n\nAppend-only. Each section below is one \`sync\` run that detected a change,\noldest first. Generated by \`scripts/regulatory-corpus\` — do not hand-edit.\n`;

  const separator = existing.endsWith("\n") ? "\n" : "\n\n";
  writeFileSync(path, `${existing}${separator}${section}`, "utf8");
}

export function renderIndex(manifest: Manifest): string {
  const entries = Object.values(manifest.entries).sort((a, b) => a.id.localeCompare(b.id));
  const bySurface = new Map<string, ManifestEntry[]>();
  for (const entry of entries) {
    const bucket = bySurface.get(entry.surface) ?? [];
    bucket.push(entry);
    bySurface.set(entry.surface, bucket);
  }

  const lines: string[] = [
    "# Regulatory corpus index",
    "",
    "Generated by `scripts/regulatory-corpus` — do not hand-edit.",
    "",
    `Manifest generated: ${manifest.generatedAt}`,
    `Sources tracked: ${entries.length}`,
    "",
    "**What this is:** a tracked index of regulatory sources retrieved from",
    "documented public APIs, with content hashes so amendments are visible in",
    "`git diff`. Full text lives in the untracked `.regulatory-cache/`.",
    "",
    "**What this is not:** it asserts nothing about whether a requirement applies",
    "to Clarity, how it should be interpreted, or that anyone has reviewed it.",
    "Applicability is `Derived` and gated on OD-2 (counsel) and OD-3 (clinical).",
    "Surface letters cross-reference",
    "`docs/legal/GEMINI_DEEP_RESEARCH_PROMPT_CMS_MEDICARE_MEDICAID.md`.",
    "",
  ];

  for (const surface of [...bySurface.keys()].sort()) {
    lines.push(`## Surface ${surface}`, "");
    lines.push("| Citation | Agency | Amended | Hash | Bytes |");
    lines.push("|---|---|---|---|---|");
    for (const entry of bySurface.get(surface) ?? []) {
      lines.push(
        `| [${entry.citation}](${entry.sourceUrl}) | ${entry.agency} | ${entry.amendmentDate ?? "unknown"} | \`${entry.contentSha256.slice(0, 12)}\` | ${entry.bytes.toLocaleString("en-US")} |`,
      );
    }
    lines.push("");
    for (const entry of bySurface.get(surface) ?? []) {
      lines.push(`- **${entry.citation}** — ${entry.relevance}`);
    }
    lines.push("");
  }

  return lines.join("\n");
}
