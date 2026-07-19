# Network enrichment contracts — test manifest

**Suite:** `tests/unit/network-enrichment-contracts.test.ts` (vitest, pure unit
tests, no database). **Result in this session: 26 passed, 0 failed.**

**Module under test:** `packages/domain-contracts/src/networkEnrichment.ts`
(ADR-0014). **Fixtures:** `tests/data/network-enrichment-entity-resolution-scenarios.json`
(12 synthetic scenarios), `tests/data/network-enrichment-valid-candidate-package.json`
— both copied verbatim from the onboarded source package; all data synthetic.

## Covered behaviors

| Area | Tests | What is proven |
|---|---|---|
| Normalization | 1 | Name (legal suffixes, diacritics, `&`), phone (NANP), website host, address key are deterministic |
| Entity resolution | 3 | All 12 fixture scenarios resolve to the expected status/entity; every non-MATCHED outcome requires human review; scores carry named signals |
| Freshness | 2 | Five-state classification incl. UNKNOWN for null/future timestamps; UTC next-review derivation |
| Conflict detection | 2 | Distinct values on one field path are preserved as a conflict; formatting-only differences are not conflicts |
| Review routing | 6 | Sensitive admission/legal/transport/payer/license routing incl. ALL_DISTINCT dual review; payer routing independent of clinical; `HUMAN_CONFIRMED` never agent-creatable or agent-replaceable; sensitive fields must stay `REQUIRES_REVIEW`; reviewer vocabulary is distinct from `UserRole` (only `COMPLIANCE_REVIEWER` overlaps) |
| Source authority | 2 | `DISCOVERY_ONLY` can support nothing; operational use tightens allowed tiers |
| Package validation | 7 | Shipped example validates cleanly end to end; rejects `"Unknown"` strings, missing evidence, non-supporting evidence, discovery-only support, tier mismatch, non-canonical timestamps, `HUMAN_CONFIRMED` agent output; strict schema rejects unknown fields |
| URL safety | 1 | Private/loopback/credentialed/non-allowlisted URLs rejected; allowlisted HTTPS passes |
| Accuracy metrics | 2 (in 1 block + escalation assertion) | Deterministic precision/recall/coverage/conflict/escalation math |

## Honest gaps (not covered, by design of this slice)

- No command service, persistence, audit, idempotency, or concurrency
  behavior exists for network enrichment yet — nothing to test.
- Reviewer-role mapping onto `UserRole` is an open decision; role-gated
  approval flows are untested because they are unimplemented.
- The URL-safety validator is tested as a pure function; no egress exists.
- Entity-resolution thresholds (0.45/0.80/0.15) are package-proposed values
  verified for determinism, not clinically or operationally calibrated.
- The freshness interval table is the package default, not owner-approved
  operating policy.
