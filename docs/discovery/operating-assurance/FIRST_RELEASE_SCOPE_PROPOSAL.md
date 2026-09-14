---
status: Accepted input to Product Requirements Planning - no implementation authorization
owner: Tyler Hebert
version: 0.3.0
date: 2026-07-30
suite: product-build-skill-suite@1.0.0
stage: product-intelligence
data_boundary: One synthetic or source-sanitized facility context; no PHI, PII, client records, licensed source text, or compliance determination
---

# First-Release Hypothesis - Reviewed Assurance Answer

## Status and lifecycle boundary

This artifact narrows the first useful product release defined in Product
Intelligence. The owner accepted the underlying productization thesis and
longitudinal operating-value evidence on 2026-07-30. It is not a PRD,
requirements set, architecture, build plan, pilot plan, or implementation
authorization.

It is accepted as an input to Product Requirements Planning. That stage has
not started.

## First-release hypothesis

**[Proposed]** In one facility workspace, a client compliance/quality owner
can use pre-seeded, immutable references to an exact authority, the client's
approved policy, and the related SOP; obtain one evidence response; and publish
one consultant-reviewed, source-linked answer or explicit gap.

The descriptive question is:

> What approved policy, SOP, and evidence are linked to this requirement, what
> does each source support, and what remains unverified as of the stated date?

The product must not answer whether the facility is compliant. Applicability,
regulatory interpretation, legal sufficiency, clinical judgment, and
compliance remain decisions for qualified humans.

## Test context

- One synthetic or source-sanitized facility workspace.
- One nonclinical administrative requirement.
- One current authority reference, one client policy reference, and one SOP
  reference, all pre-seeded with version and as-of information.
- One pre-approved applicability posture and rationale supplied by a named,
  qualified operational/compliance authority, with its scope and as-of date.
  The product and walkthrough participants do not invent or broaden it.
- One evidence request and one evidence response or explicit missing state.
- One adversarial replay of the same question with a clearly superseded or
  conflicting reference to test whether publication stops or the conflict
  remains explicit.
- No segment-specific product claim. The first design partner may be a
  hospital, behavioral-health facility, or RHC based on availability and
  authority to participate.

The portfolio evidence supports multiple healthcare segments but does not
establish which segment has the strongest initial demand.

## Three participating actors

| Actor | Role in the hypothesis |
|---|---|
| Client compliance, quality, or program owner (`USR-OA-01`) | Opens the question, confirms context, and owns the client-side answer; does not change applicability unless separately named as the qualified authority |
| Policy/SOP or evidence contributor (`USR-OA-02` or `USR-OA-03`) | Supplies one evidence link or explicitly records that evidence is missing |
| Assigned consultant reviewer (`USR-OA-09`) | Checks source lineage, named applicability authority, support classifications, gaps, and answer wording; publishes or returns the answer, and decides applicability only if that authority is explicitly assigned |

No consulting administrator, executive dashboard, external surveyor, or
cross-client user is required for this test.

## One end-to-end workflow

1. The three actors enter one facility context with scoped access.
2. The client owner asks the descriptive question against pre-seeded
   authority, policy, and SOP references.
3. The workspace shows each exact source identifier or URI, version or hash,
   permitted excerpt or locator, the pre-approved applicability rationale and
   named authority, and the verified-as-of date.
4. The contributor links one evidence response or marks it missing.
5. The client owner prepares a structured answer. Each material statement has
   a source locator and a support classification such as `supported`,
   `partially supported`, `conflicting`, or `unverified`.
6. The assigned consultant reviews under named reviewer authority and either
   publishes the answer, returns it, or preserves an explicit gap.
7. The reviewed result records its as-of date and audit history. A gap may
   receive a simple follow-up owner and due date, but need not be resolved in
   this release.

The same question is replayed once with a source explicitly marked superseded
or conflicting. The product must block publication or preserve the conflict in
the explicit-gap branch. This tests one adversarial condition without adding a
second workflow or a broader source-management capability.

## What this hypothesis can validate

This release tests only the reviewed-answer contract: client participation,
exact lineage, named human authority, claim-level support, consultant review,
and fail-closed answer/gap behavior.

It does not validate production tenant isolation, multi-client consultant
leverage, portfolio queues, corrective-action closure, or a sustainable market
differentiator. Those remain separate later discovery gates before any scale,
security, or competitive claim.

## Historical-corpus contribution

The historical consulting corpus strengthens the first release without
expanding its runtime scope. Firm-owned or explicitly permissioned,
source-sanitized exemplars may be used during requirements planning to:

- define the authority-policy-SOP-evidence relationships;
- derive support and gap classifications;
- shape the reviewed-answer structure;
- supply synthetic positive, missing-evidence, conflict, and supersession
  cases;
- identify common plan-of-correction fields for later capability planning; and
- create a held-out, human-reviewed evaluation set.

Raw client artifacts, licensed source text, cross-client learning, live
retrieval, embeddings, and model training remain excluded. Corpus eligibility
is governed by
`docs/discovery/operating-assurance/PLATFORM_INTELLIGENCE_CORPUS_STRATEGY.md`.

## Completion branches

### Reviewed-answer branch

The result states what the linked records support, preserves source/version
lineage for every material statement, names any limitation, and records the
consultant review authority and as-of date.

### Explicit-gap branch

The result names the missing, stale, conflicting, unauthorized, or
inapplicable support and does not generate a compliance-like conclusion. A
follow-up owner and due date are optional; corrective-action management and
closure are later capabilities.

Both branches count as completion. First value is a defensible reviewed answer
or a visible gap, not forced closure of the underlying issue.

## Included capability boundary

- one facility workspace;
- three scoped actor roles;
- pre-seeded immutable source references;
- exact authority-policy-SOP-evidence lineage;
- one evidence request and response or missing state;
- claim-level support classification;
- consultant publish/return review;
- reviewed answer or explicit gap with as-of date; and
- minimal attributable history for the walkthrough.

## Explicitly excluded

- multi-client portfolio views or consulting-firm control plane;
- production tenancy administration;
- authority, policy, or SOP authoring and lifecycle management;
- a shadow repository for client-controlled policy or SOP content;
- bulk ingestion, OCR, embeddings, retrieval, generative Q&A, or regulatory
  feeds;
- automated applicability, legal, clinical, survey, or compliance
  determinations;
- corrective-action, closure, re-open, or change-propagation engines;
- survey packets, exports, dashboards, metrics, and committee workflows;
- LMS, training, credentialing, incident, EHR, email, or messaging
  capabilities;
- integrations with Drive or incumbent document/policy systems;
- real client content, licensed source text, PHI, or PII;
- formal requirements, acceptance criteria, nonfunctional requirements,
  architecture, work packages, implementation, pilot, or deployment.

## Source-of-truth ownership

This is a product-semantics boundary, not an integration design.

| Record or decision | System or human that remains authoritative |
|---|---|
| External authority text and official status | The issuing authority or an authorized licensed source |
| Client policy/SOP content, approval, and current version | The client's existing approved document or policy system |
| Applicability, interpretation, compliance, clinical, and legal conclusions | The qualified human with authority for that decision |
| Immutable source reference, version/hash, locator, verified-as-of date, lineage, evidence-review state, reviewed answer, follow-up state, and audit history | Operating Assurance Workspace |

The workspace references governed content and records how it was used. It does
not become the unapproved master copy of a client's policies or procedures.

## Conceptual trust boundary

The product definition must preserve this authority order before a formal PRD
is accepted:

1. platform operator;
2. consulting service organization;
3. client tenant;
4. facility context;
5. assigned consultant principal;
6. an explicit, scoped grant to the participating user; and
7. cross-client templates owned by the consulting firm without client content.

This hierarchy defines who may act on whose records. It does not prescribe a
technical tenancy or authorization architecture.

## Validation evidence to define during Product Requirements Planning

The PRD should define one facilitated, role-based walkthrough, one adversarial
replay, and one direct incumbent-workflow comparison to test:

- whether each actor can complete their own task without the facilitator doing
  it for them;
- whether every material answer statement remains traceable to an exact
  reference, locator, version, and as-of date;
- whether missing or conflicting support remains explicit;
- whether the client owner sees meaningful value over the current
  folder/spreadsheet method;
- how many consultant touches and how much review time the walkthrough uses,
  recorded only as discovery evidence and not as proof of scale;
- whether the client source system can remain authoritative without duplicate
  policy administration; and
- whether an incumbent product already completes this job adequately or an
  integration wedge is more credible than a standalone build.

No baseline, target, or result currently exists. **No measurements found.**

## Decision rules

### Advance

The Product Intelligence gate is passed and this hypothesis may enter formal
Product Requirements Planning when that work is authorized. The PRD must
preserve the three-actor boundary and define how the walkthrough, adversarial
replay, traceability, fail-closed behavior, client self-service, consultant
touches, and build/buy/integrate comparison will be evaluated before pilot or
value claims.

### Iterate

Remain in Product Intelligence when participants see value but roles, source
ownership, answer fields, status meanings, reviewer authority, or the
standalone-versus-integration posture remain materially ambiguous.

### Stop or park

Stop or park the release when current tools already complete the job
adequately, upkeep exceeds the perceived coordination value, the consultant
must perform the client's routine steps during the walkthrough, or useful
completion requires unlicensed/protected content or an automated compliance
determination.

## Decisions carried into Product Requirements Planning

Requirements planning must confirm or refine:

1. the reviewed-answer-or-gap outcome;
2. the three participating actors;
3. the single-facility and pre-seeded-reference boundary;
4. the source-of-truth ownership model; and
5. the available design-partner context for the walkthrough.
