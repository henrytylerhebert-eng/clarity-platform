# ADR-0014: Prescreen role mapping and the same-organization API slice

- **Status:** Accepted (owner ruling 2026-07-19)
- **Decides:** `docs/decisions/PRESCREEN_ROLE_MAPPING_DECISION_PACKET.md`
- **Builds on:** ADR-0011 (authentication), ADR-0012 (API architecture,
  accepted in part), ADR-0013 (prescreen command service, Phase 2)

## Context

Phase 2 of the prescreen slice (ADR-0013) deliberately shipped with an
injected role policy and only `SYNTHETIC_`-prefixed role codes, because the
source package's actor taxonomy (crisis-response officers, external
prescreen assessors, Central Intake coordinators, authorized practitioners,
sending nurses) does not exist in the repository's `UserRole` enum and the
approved constraint was "do not invent new production roles." That left the
prescreen commands reachable only from tests. Exposing them over HTTP
required an owner ruling on how real, database-sourced roles map onto
prescreen authority.

## Decision

### 1. Role equivalences (Option 3 of the packet, applied narrowly)

Exactly two equivalences are ruled, and only for the same-organization
slice:

| Package actor | Repository `UserRole` | Basis |
|---|---|---|
| Central Intake coordinator | `INTAKE_COORDINATOR` | Package matrix row `CENTRAL_INTAKE_COORDINATOR`: create/edit/supplement/review = Y |
| Authorized practitioner (physician/PMHNP) | `PHYSICIAN_REVIEWER` | Signer authority; PMHNP scope is configured policy, not enum membership |

External and field actors (crisis-response officer, law-enforcement
officer, external prescreen assessor, sending nurse) are **deferred, not
mapped**. They become expressible only with the cross-organization
submission/receipt design, which stays an open decision packet. No
`UserRole` enum change and no migration result from this ADR.

### 2. Production prescreen role policy

`packages/prescreen-service` gains a production policy constant keyed on
real `UserRole` values, derived fail-closed from the package's
`contracts/role-permission-matrix.csv`:

| Command | Permitted roles | Matrix basis |
|---|---|---|
| StartPrescreenEncounter | `INTAKE_COORDINATOR` | Central Intake `create_prescreen = Y` |
| SaveAssessmentDraft | `INTAKE_COORDINATOR` | Central Intake `edit_draft = Y` |
| AttestAssessment | `PHYSICIAN_REVIEWER` | Attestation is the clinical sign-off; Central Intake's `attest = conditional` is excluded fail-closed |
| CreateAssessmentSupplement | `INTAKE_COORDINATOR` | Central Intake `supplement = Y`; practitioner `supplement = N` |
| SubmitPrescreen | `INTAKE_COORDINATOR` | Submission-as-intent belongs to the coordinating role |
| UpdatePacketRequirement | `INTAKE_COORDINATOR` | Requirement resolution is a Central Intake review capability |
| EvaluateTargetReadiness (read-only) | `INTAKE_COORDINATOR`, `PHYSICIAN_REVIEWER` | Both ruled roles need the derived readiness view |

Conditional capabilities in the matrix are treated as **not granted**
(fail-closed), consistent with the privacy-regime precedent in ADR-0013.
In this slice attestation authority is held by the authorized practitioner;
the external assessor's attest capability arrives with the cross-org
design. No other repository role (including `SYSTEM_ADMIN` and
`ORGANIZATION_ADMIN`) receives any prescreen capability — the package's
"no implicit clinical/case bypass" rule for system administrators is
preserved.

The injected-policy design of ADR-0013 is unchanged: the production policy
is one more explicit constructor input, the synthetic test policy remains,
and nothing in the service hard-codes a taxonomy.

### 3. Same-organization API slice

The prescreen commands and the readiness view are exposed on the existing
`node:http` API service (the ADR-0012 thin-Fastify adapter direction is
accepted but not yet executed; this slice extends the current server and
migrates with it):

```
POST /api/prescreen/encounters                                StartPrescreenEncounter
POST /api/prescreen/encounters/{id}/draft                     SaveAssessmentDraft
POST /api/prescreen/encounters/{id}/attest                    AttestAssessment
POST /api/prescreen/encounters/{id}/supplements               CreateAssessmentSupplement
POST /api/prescreen/encounters/{id}/submit                    SubmitPrescreen
POST /api/prescreen/encounters/{id}/requirements              UpdatePacketRequirement
GET  /api/prescreen/encounters/{id}/readiness?target=…        EvaluateTargetReadiness
```

Invariants, identical in kind to the ADR-0011/0012 vertical slice:

- `organizationId` and role codes come **only** from the verified
  principal (`AuthenticationService.authenticate` → `principalToActor`).
  No request field can supply either; unknown body fields are a 400.
- **`receivingOrganizationId` is not caller-suppliable.** The server
  derives it from the principal's organization, so a cross-organization
  submission is structurally inexpressible over HTTP until the cross-org
  model is designed and approved.
- **`occurredAt` is server-stamped.** Callers cannot backdate or postdate
  command envelopes through the API.
- Failures are uniform and content-free: 401 authentication, 403 policy,
  404 non-revealing not-found (absent and cross-tenant are
  indistinguishable), 409 version/idempotency conflicts, 400 validation.

### 4. What this slice does NOT change

- The gateway remains the Phase 2 **in-memory** implementation. Prescreen
  state is process-local and non-durable; persistence is Phase 3 work
  behind the separately gated provider-backed Cloud SQL/RLS verification.
- Submission remains recorded intent only — no acknowledgement, review,
  acceptance, admission, transport authority, or cross-organization
  access is expressible.
- No UI, no event delivery, no cross-organization collaboration, no
  clinical/legal approval of rule content, no production readiness.

### 5. Idempotency fingerprint refinement (Phase 2 amendment)

Because the API server-stamps `occurredAt`, the Phase 2 idempotency
fingerprint — which covered the whole command body — would have turned
every legitimate HTTP retry into an `IDEMPOTENCY_KEY_REUSED` conflict.
`occurredAt` is now excluded from the fingerprint: the key identifies the
command's **intent**, and the arrival time of a retry is not intent.
Nested-body changes under a reused key still conflict (the ADR-0013
canonical-fingerprint guarantee is unchanged), and first write wins for
all stored timestamps. Covered by a dedicated unit test in both
directions.

## Consequences

- The prescreen workflow becomes exercisable end-to-end over authenticated
  HTTP by hospital-tenant staff: a coordinator starts and drafts, a
  practitioner attests, the coordinator submits within the organization.
- The deferred external roles mean field-originated prescreens are not yet
  representable — accepted, because inventing tenancy semantics for
  external organizations before the cross-org design would prejudge it.
- Two ruled equivalences enter the compatibility surface; renaming or
  repurposing either role now touches prescreen authorization.
- When the ADR-0012 Fastify adapter is executed, these routes migrate with
  the rest of the API surface.

## Honesty statement

Not claimed: persistence or restart durability for prescreen state,
migrations, UI, event delivery, cross-organization workflows, production
role taxonomy beyond the two ruled equivalences, clinical/legal approval
of any rule content, production readiness, HIPAA compliance. Synthetic
data only.
