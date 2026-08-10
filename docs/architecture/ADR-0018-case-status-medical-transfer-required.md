# ADR-0018: MEDICAL_TRANSFER_REQUIRED transition semantics; RETURNED_FOR_MORE_INFORMATION deferred

- **Status:** Accepted (owner ruling 2026-07-29)
- **Decides:** GitHub issue #35 (`CaseStatus`: schema accepts two statuses the
  domain layer cannot represent)
- **Builds on:** ADR-0013 (prescreen command service — medical-stabilization
  precedence in possible-pathway derivation)

## Context

`prisma/schema.prisma` declared two `CaseStatus` values with no TypeScript
representation anywhere: `MEDICAL_TRANSFER_REQUIRED` and
`RETURNED_FOR_MORE_INFORMATION`. Both were absent from `CASE_STATUSES`, from
`ACTIVE_ORDER`, from every transition rule in
`packages/domain-contracts/src/caseStateMachine.ts`, and from every service.

Provenance: both appear at the same lines in the onboarded source-package
schemas under `reference/source-packages/`, so they were inherited when the
canonical foundation schema was adopted and the contract array was written
without them.

The gap was latent rather than active — nothing writes either value today —
but the database could store a case status the domain layer could neither
validate nor transition. It was found by the Stage 0.4 enum-sync test
(`tests/unit/contract-schema-enum-sync.test.ts`) on its first run, which
converted the "contracts mirror the schema" invariant from a review
convention into a machine check.

Closing the gap required an owner ruling, because deciding which states may
enter each value, which each may reach, whether either is terminal, and
whether a rationale is mandatory is business-rule interpretation.

## Decision

The two values are **not symmetric** and are ruled separately.

### 1. `MEDICAL_TRANSFER_REQUIRED` — mirrored as a diversion state

Added to `CASE_STATUSES`. It records that a case cannot proceed toward
behavioral-health placement until a medical need is addressed.

| Property | Ruling |
|---|---|
| Enterable from | `CLINICAL_REVIEW`, `LEGAL_REVIEW`, `BENEFITS_REVIEW`, `AUTHORIZATION_PREPARATION`, `PACKET_PREPARATION`, `READY_FOR_ROUTING`, `ROUTING_IN_PROGRESS`, `FACILITY_RESPONSE_PENDING` — the review and routing span |
| Not enterable from | intake states (`DRAFT` … `EVIDENCE_REVIEW`), post-acceptance states (`ACCEPTED` onward), the routing-exception states, and all terminal states |
| Exits to | any pipeline state in `ACTIVE_ORDER`, which includes `CLOSED` when placement is abandoned |
| Terminal? | **No.** It is a diversion. `CANCELLED` / `WITHDRAWN` therefore remain available from it, via the existing any-active-case rule |
| In `ACTIVE_ORDER`? | **No.** It sits off the linear pipeline, so the one-step-forward / bounded-step-back arithmetic must not treat it as a neighbour of any pipeline state |
| Rationale | **Mandatory** — added to `RATIONALE_REQUIRED_TRANSITIONS` |
| Role gating | Inherits the existing `TransitionCase` policy (see Consequences — this is a known limitation, not a ruling) |

Re-entry is deliberately not restricted to the state the case diverted from:
a medical episode may change what the case still needs.

Medical-stabilization precedence is already house doctrine — ADR-0013's
prescreen possible-pathway derivation gives it precedence over placement
pathways — so this ruling extends an established principle rather than
introducing one.

### 2. `RETURNED_FOR_MORE_INFORMATION` — deferred, not mirrored

Deliberately **not** added to `CASE_STATUSES`. The name presumes an external
actor returning a previously submitted packet. That actor, its authority to
return, and the receipt lifecycle it implies all belong to the
**cross-organization submission/receipt decision packet**, which remains
open (it is the successor to the role-mapping packet resolved in ADR-0014,
and it already blocks field-originated prescreens).

Until that packet is decided there is no defined sender, no defined return
authority, and therefore no transition semantics to mirror. Ruling it now
would decide a fragment of that open packet by side effect.

It stays pinned in the enum-sync test's `KNOWN_DESYNC` map against issue #35,
so the delta remains asserted exactly and the suite still fails if the gap
widens.

### 3. No migration

The schema already declares both values, so mirroring
`MEDICAL_TRANSFER_REQUIRED` is a contracts-and-service change only. No
migration results from this ADR. `npx prisma validate` and
`npx prisma migrate status` both confirm no drift.

## Consequences

- The database can no longer store `MEDICAL_TRANSFER_REQUIRED` in a form the
  domain layer cannot represent or transition. The `CaseStatus` desync is
  reduced from two values to one, and the remaining one is deferred by an
  explicit ruling rather than by omission.
- **Role gating is a known limitation.** `TransitionCase` is permitted to
  `INTAKE_COORDINATOR` and `ORGANIZATION_ADMIN`, neither of which is a
  clinical role, so a non-clinician can currently set a clinically-flavoured
  status. Narrowing this would require a per-target-status role mechanism
  that does not exist today. Recorded here as an open question rather than
  silently accepted; it is not resolved by this ADR.
- `RETURNED_FOR_MORE_INFORMATION` remains unrepresentable, so no code can
  route a case into it. Issue #35 stays open, now scoped to that one value
  and explicitly blocked on the cross-organization packet.
- Adding a `CaseStatus` value is a widening change; the full root suite,
  typecheck, and lint were re-run to confirm nothing depended on the enum
  being closed at its previous membership.

## Honesty statement

Not claimed: clinical or legal correctness of the diversion semantics; that
`MEDICAL_TRANSFER_REQUIRED` is the right model for medical stabilization in
any real workflow; any approved clinical rule content; production readiness;
HIPAA compliance; or that the role gating described above is appropriate — it
is explicitly flagged as an unresolved limitation. No migration, no UI, no
API surface, and no cross-organization capability results from this ADR. All
data referenced in tests is synthetic.
