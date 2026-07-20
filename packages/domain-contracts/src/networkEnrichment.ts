/**
 * Compatibility barrel for network enrichment contracts.
 *
 * This file used to contain the review-workflow contracts directly (the
 * `codex/om/sync-main` packets 1-16 stream). It now re-exports three
 * modules split out during reconciliation with the independently-developed
 * PR #29 entity-resolution stream, so every existing import of
 * `@clarity/domain-contracts` (which is how every current consumer reaches
 * these types — see the reconciliation report) keeps working unchanged:
 *
 *   networkEnrichmentShared.ts     genuinely shared primitives only
 *   networkEnrichmentResolution.ts entity resolution, evidence, freshness,
 *                                  conflict detection (PR #29 stream)
 *   networkEnrichmentReview.ts     review commands, persistence-facing
 *                                  contracts, audit (sync-main stream)
 *
 * No exported symbol name collides between the two streams, so this
 * `export *` barrel compiles without ambiguity today. See the
 * reconciliation report's conflict map for the places where the two
 * streams model adjacent-but-different concepts under different names
 * (review-state enums, reviewer-role vocabularies, evidence and conflict
 * shapes) — those were deliberately not merged.
 */
export * from "./networkEnrichmentShared.js";
export * from "./networkEnrichmentResolution.js";
export * from "./networkEnrichmentReview.js";
