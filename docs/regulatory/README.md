---
status: Development-time reference tool — not a platform runtime capability
version: 0.1.0
data_boundary: public regulatory text only; no patient, tenant, or synthetic case data
---

# Regulatory corpus

Collects federal regulatory text from documented public APIs, stores it, and
detects when it changes. It exists to give the CMS research work
(`docs/legal/GEMINI_DEEP_RESEARCH_PROMPT_CMS_MEDICARE_MEDICAID.md`, OD-13) a
durable, versioned, citable base instead of ad-hoc lookups.

## Scope boundary — read this first

This tool is **development tooling**, deliberately outside the platform runtime:

- It does **not** import `@prisma/client` and never touches the Clarity
  database, so the one-Prisma-package invariant is untouched.
- It handles **no patient data, no tenant data, and no PHI**. Everything it
  retrieves is public federal regulatory text.
- It is **not a deployed worker or service.** It is a CLI you run. Scheduling it
  is a separate owner decision — see "Scheduling" below.
- Nothing it stores is a Clarity rule. Applicability of any requirement to
  Clarity is `Derived` per `docs/discovery/DISCOVERY_CLASSIFICATION_STANDARD.md`
  and is gated on **OD-2** (counsel review) and **OD-3** (clinical licensing).

## Commands

```bash
npm run regulatory:check   # cheap drift detection — amendment dates only
npm run regulatory:sync    # fetch, store, update manifest + index + change log
npm run regulatory:index   # regenerate the index from the existing manifest
npm run regulatory:fr      # resolve Federal Register candidates for review
```

`check` exits `0` when nothing drifted and `2` when a sync is warranted, so a
future scheduled invocation can branch on the exit code without parsing output.

## How update detection works

It does **not** diff text. The eCFR API exposes per-section amendment dates:

```
GET /api/versioner/v1/versions/title-42.json?part=489
    -> content_versions[] with an amendment_date per section
```

A section's `amendment_date` moving is the source's own authoritative statement
that the text changed, so `check` reads only those dates — one request per title
plus one per distinct part, never one per section — and reports drift. That is
what makes it cheap enough to run often.

Changes are classified, and the distinction matters:

| Kind | Meaning |
|---|---|
| `added` | First retrieval of a source |
| `amended` | The source's own amendment date moved — authoritative |
| `content-changed` | Hash moved but the amendment date did not. Usually editorial or an API formatting change; **verify before treating as substantive** |
| `removed` | In the previous manifest but not retrieved this run |
| `unchanged` | No change |

Conflating `amended` with `content-changed` would make the change log
untrustworthy, so they are reported separately.

## Storage layout

| Path | Tracked? | Contents |
|---|---|---|
| `docs/regulatory/corpus-manifest.json` | **yes** | Per-source citation, URL, amendment date, SHA-256, byte size, retrieval time |
| `docs/regulatory/CORPUS_INDEX.md` | **yes** | Generated human-readable index, grouped by research-prompt surface |
| `docs/regulatory/CHANGE_LOG.md` | **yes** | Append-only log, one section per sync that detected a change |
| `.regulatory-cache/` | **no** (gitignored) | Raw XML payloads plus a readable text rendering, content-addressed |

Committing the full text would add megabytes that churn on every amendment and
bury real changes. Committing hashes plus an index keeps `git diff` meaningful —
**a changed hash is the signal** — while the text stays one command away. This
follows the existing `.local-object-storage/` precedent for untracked local
bytes.

The cached XML is the source of record. The `.txt` rendering beside it is
deliberately lossy and exists so a human can read a diff, not so anything can
parse it.

## Fetch policy

1. **API-first, and API-only where one exists.** eCFR and the Federal Register
   both publish documented APIs, so no page is scraped for either.
2. **robots.txt is honoured, and enforced locally.** `cms.gov` publishes
   `Disallow: /*?`, so this tool refuses any `cms.gov` URL carrying a query
   string before the request is sent. Disallowed path prefixes for `ecfr.gov`
   (`/search`, `/recent-changes`, `/on/`, `/compare/`, …) and `cms.gov` are
   likewise refused locally. All verified against each host's robots.txt on
   2026-07-29 and covered by tests.
3. **Honest identification and per-host rate limiting** — a descriptive
   User-Agent and a minimum interval between requests to the same host.
4. **Retries only on idempotent GETs, only for 429/5xx**, with capped backoff. A
   404 is never retried.

## Federal Register: candidates, not conclusions

The tool does **not** decide which final rule corresponds to a shorthand like
"CMS-0057-F". A term search for that rule returns 254 results topped by
unrelated payment rules, so an automatic pick would be a guess presented as a
citation.

Where a **Regulation Identifier Number** is known and verified, it is used
instead, and it is exact: RIN `0938-AU87` returns precisely the CMS-0057-F
family — proposed rule `2022-26479`, final rule `2024-00895` (effective
2024-04-08), and correction `2024-24801`.

Only `0938-AU87` is asserted, because only it was verified live. The other
entries fall back to fuzzy term search and print candidates for a human to
confirm. A wrong RIN is a wrong citation, which is worse than an unresolved one.

## Scheduling

Deliberately not implemented. `CLAUDE.md`'s standing constraint is that no
worker or deployment control is added before server authorization and audit
boundaries exist, and a scheduled crawler is a worker.

`check`'s exit code makes scheduling a small step whenever the owner decides to
take it — cron, a CI job on a timer, or a manual cadence. Choosing that belongs
with OD-13.

## Extending the registry

Sources live in `scripts/regulatory-corpus/sources.ts`. Adding one requires a
citation, a surface letter cross-referencing the research prompt, a relevance
note naming the Clarity workflow it touches, and an agency label. Non-CMS
sources (SAMHSA, OCR, ASTP/ONC) **must** be labelled as such so the corpus never
implies CMS authority for a rule CMS did not issue. Duplicate ids are rejected
at startup.

## Not claimed

Retrieval is not review. This tool makes no claim that the registry is complete,
that any requirement applies to Clarity, that any interpretation is correct, or
that the platform conforms to anything. No CMS compliance, HIPAA compliance,
survey readiness, certification readiness, or production readiness is claimed or
implied.
