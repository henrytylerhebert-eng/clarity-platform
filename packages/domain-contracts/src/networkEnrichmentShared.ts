/**
 * Network enrichment — genuinely shared primitives only.
 *
 * This module exists to hold the small set of types that both
 * `networkEnrichmentResolution.ts` (candidate/entity-resolution semantics)
 * and `networkEnrichmentReview.ts` (human review/persistence workflow)
 * agree on without disagreement. It is deliberately not a dumping ground:
 * most of what looks similar between the two layers (review-state enums,
 * reviewer-role vocabularies, evidence shapes, conflict records) turned out
 * on inspection to differ in literal values, shape, or enforcement status
 * once the two contract files were compared line-by-line, and those stay
 * local to their owning module. See the reconciliation report for the full
 * conflict map.
 *
 * Nothing here does I/O, persistence, or canonical mutation.
 */

/**
 * The enrichment package wire-format version. Originally declared in the
 * entity-resolution contracts (the PR #29 stream); moved here because it is
 * the version tag a future stitching layer will use to check compatibility
 * between what resolution produced and what review/persistence consumes.
 * Literal value and export name are unchanged from the original declaration.
 */
export const NETWORK_ENRICHMENT_SCHEMA_VERSION = "clarity.network-enrichment.v1" as const;
export type NetworkEnrichmentSchemaVersion = typeof NETWORK_ENRICHMENT_SCHEMA_VERSION;

/**
 * Documentation-only type aliases (both are `string` today; no branding is
 * introduced here). Both files currently type these fields as plain
 * `string`/`DOMAIN_ID_SCHEMA` inline; these aliases are additive and do not
 * change any existing exported schema, field name, or validation behavior
 * in either module. Introducing real nominal branding would be a design
 * change beyond this reconciliation and is intentionally not done here.
 */
export type NetworkOrganizationId = string;
export type NetworkFieldPath = string;
export type NetworkIsoTimestamp = string;
