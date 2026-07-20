# Decision packet: prescreen role mapping (blocks API/UI, not Phase 2)

**Status:** RESOLVED 2026-07-19 — owner ruling recorded below (Option 3,
narrow scope). Full rationale and consequences: ADR-0014.

## Owner ruling (2026-07-19)

The owner selected **Option 3, applied narrowly**, with a **same-organization
only** first API slice:

1. **`INTAKE_COORDINATOR` ≡ Central Intake coordinator.** Explicit
   equivalence ruled for the same-organization slice.
2. **`PHYSICIAN_REVIEWER` ≡ authorized practitioner (physician/PMHNP).**
   PMHNP signer authority is configured policy, not a new enum value.
   In this slice the authorized practitioner holds prescreen attestation
   authority; Central Intake's matrix-conditional attest capability is
   excluded fail-closed.
3. **External/field roles are deferred**, not invented: crisis-response
   officer, law-enforcement officer, external prescreen assessor, sending
   nurse. They arrive only with the cross-organization submission/receipt
   design, which remains a future decision packet.
4. **First API slice is same-organization only.** `receivingOrganizationId`
   is not caller-suppliable over HTTP; it is derived from the authenticated
   principal's organization, so cross-org submission is structurally
   inexpressible until the cross-org model is designed and approved.

No `UserRole` enum change and no migration result from this ruling.

---

*Original packet as recorded 2026-07-19, before resolution:*

**Status (superseded):** OPEN — owner decision required before any API/UI
exposure of prescreen commands. Recorded 2026-07-19 as a Phase 2 deliverable
per the approved constraint "do not invent new production roles."

## Problem

The prescreen package describes external and hospital actors that do not
exist in the repository's `UserRole` enum (`packages/domain-contracts/src/roles.ts`,
mirrored by `prisma/schema.prisma`):

| Package actor (role-permission matrix) | Closest existing UserRole | Assessment |
|---|---|---|
| Crisis-response officer (field) | — none | New concept; law-enforcement/field actor, likely external to the hospital tenant |
| Prescreen assessor (public/private team) | — none | New concept; external assessor organization |
| Central Intake coordinator | `INTAKE_COORDINATOR` | Plausible but not identical: package scopes it to receiving-hospital Central Intake |
| Authorized practitioner (physician/PMHNP) | `PHYSICIAN_REVIEWER` | Partial: PMHNP signer authority is a restricted-capability rule, not just a role |
| Sending nurse / facility staff | `FACILITY_REVIEWER`? | Unclear; package treats them as requirement-resolution owners |

Phase 2 therefore runs on an injected policy with `SYNTHETIC_`-prefixed role
codes and asserts no production taxonomy.

## Interacting constraints

- Tenancy: field organizations submitting to hospital Central Intake implies
  cross-organization actors; the current model is single-tenant per actor and
  the approved Phase 2 slice is same-organization only.
- Authentication (ADR-0011) sources roles from the database `User` model —
  new roles are a Prisma enum change (migration + ADR).
- The package's 11-role model includes restricted-capability signer rules
  (PMHNP scope) that are policy configuration, not enum membership.

## Options for the owner

1. **Extend `UserRole`** with prescreen-specific roles (e.g.
   `PRESCREEN_FIELD_ASSESSOR`, `CENTRAL_INTAKE_COORDINATOR`) via migration +
   ADR when the API slice is approved. Clean, but grows the global enum.
2. **Per-service role-code table** (roles as data, not enum) for external
   actors, keeping `UserRole` for hospital staff. Matches the package's
   configured-rule style; larger design change.
3. **Map onto existing roles** where genuinely equivalent
   (`INTAKE_COORDINATOR` for Central Intake) and add only the truly new field
   roles. Middle path; requires an explicit equivalence ruling from the owner
   per role.

No recommendation is executed here; Phase 2 is deliberately inert on this
question. The cross-organization submission/receipt model (grants, receipt
workflow, packet visibility) is part of the same future decision.

## What unblocks

Resolving this packet (plus OD-5/ADR-0012 API architecture) unblocks the
prescreen API/UI slice. Until then, prescreen commands are reachable only
from tests with the synthetic policy.

*(Resolved — see the owner ruling at the top of this file and ADR-0014.
The cross-organization submission/receipt model remains open.)*
