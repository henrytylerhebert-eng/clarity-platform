/**
 * Compatibility barrel for network enrichment contracts.
 *
 * This file re-exports the network-enrichment contract kernel adopted by
 * ADR-0019. The kernel keeps candidate/entity-resolution contracts and
 * human-review workflow contracts in sibling modules so every package-root
 * import can use one stable surface:
 *
 *   networkEnrichmentShared.ts     genuinely shared primitives only
 *   networkEnrichmentResolution.ts entity resolution, evidence, freshness,
 *                                  conflict detection
 *   networkEnrichmentReview.ts     review commands, persistence-facing
 *                                  contracts, audit
 *
 * No exported symbol name collides between the sibling modules. Adjacent
 * concepts that are not actually identical (review-state enums,
 * reviewer-role vocabularies, evidence shapes, and conflict records) remain
 * local to their owning module rather than being collapsed by name.
 */
export * from "./networkEnrichmentShared.js";
export * from "./networkEnrichmentResolution.js";
export * from "./networkEnrichmentReview.js";
