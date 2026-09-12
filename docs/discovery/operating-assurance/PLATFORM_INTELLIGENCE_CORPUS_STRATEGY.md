---
recovered_at: 2026-09-12
acceptance_provenance: Historical July source record; not newly accepted by recovery
status: Proposed - corpus governance and rights review required
owner: Tyler Hebert
version: 0.1.0
date: 2026-07-30
stage: product-intelligence
data_boundary: Pattern-level strategy only; no source document, client name, finding, PHI, PII, credential, licensed text, or completed record copied into the repository
related_artifacts:
  - docs/discovery/SHARED_DRIVE_OPERATING_PATTERN_AUDIT.md
  - docs/discovery/operating-assurance/CONSULTING_PORTFOLIO_EVIDENCE.md
  - docs/discovery/operating-assurance/PRODUCT_INTELLIGENCE_BRIEF.md
  - docs/discovery/operating-assurance/FIRST_RELEASE_SCOPE_PROPOSAL.md
---

# Platform Intelligence Corpus Strategy

> Recovered dated source record. Read the [recovery index](README.md) for
> current ID mapping, paused scope, and verification limits. Historical
> acceptance/verification labels below describe the July source record; no
> implementation, corpus use, pilot, or product-home decision is granted here.


## Strategic conclusion

**[Reported]** The owner states that the consulting tools, workflows, evidence
methods, and plans of correction have been used in delivery since 2020 and
have contributed to building the consulting business.

**[Documented]** The audited collections contain dated operating artifacts
from 2019 through 2026, with substantial annual/version segmentation from 2022
through 2025, recent 2026 material, 1,476 explicitly organized delivery assets,
and recurring policy, evidence, survey, training, action, and closeout
families.

**[Inferred]** This is strong evidence that the underlying consulting method
has operational adoption and practical value. The opportunity is therefore
the productization and scaling of a used operating system, not the invention
of a hypothetical workflow.

**[Unknown]** The existing evidence does not yet establish adoption of a
client-operated software product, software willingness to pay, consultant
leverage after digitization, or the correctness and current applicability of
every historical decision.

## The proprietary asset

The strategic asset is not simply a large document collection. It is the
combination of:

1. longitudinal examples of real operating work;
2. the consulting firm's reusable methods and templates;
3. evidence collected against specific questions or obligations;
4. human-authored findings and plans of correction;
5. reviewer decisions, revisions, follow-up, and closure artifacts;
6. policy, SOP, training, and annual-cycle changes over time; and
7. the consultants who can explain why an action was selected and whether it
   was accepted.

Together, those materials can inform a domain ontology, workflow logic,
human-review rules, reusable patterns, retrieval, evaluation, and eventually
assistive generation.

Raw historical files are a **candidate corpus**, not automatically authorized
model-training data.

## Logic available in the corpus

| Historical artifact family | Platform-intelligence signal |
|---|---|
| Authority, standard, or requirement reference | Source identity, jurisdiction, version, currentness, and the question being answered |
| Policy and SOP versions | How an organization translates an obligation into governed operating instructions |
| Audit, tracer, checklist, log, or evidence packet | What evidence was requested, supplied, missing, stale, or contradictory |
| Finding, risk assessment, or gap analysis | How humans classified the observed condition and expressed uncertainty |
| Plan of correction or corrective action | How a gap became an action, owner, due date, expected evidence, and escalation |
| Reviewer comments, revisions, or approvals | Which reasoning or language a qualified human accepted, rejected, or changed |
| Closure evidence and follow-up | What humans treated as sufficient evidence to close, reopen, or continue an action |
| Committee minutes and after-action reviews | Decisions, accountability, exceptions, and lessons that altered later work |
| Training, competency, or communication artifacts | How approved operational changes were translated for specific roles |
| Annual/version history | Temporal logic, supersession, recurring cadence, and change propagation |

The core learnable pattern is:

```text
authority and context
  -> expected evidence
  -> observed evidence
  -> supported statement or explicit gap
  -> human rationale
  -> corrective-action pattern
  -> reviewer decision
  -> closure evidence
  -> policy, SOP, training, or next-cycle change
```

## Governed corpus layers

### Layer 0 - Quarantine or prohibited use

Material stays outside any shared intelligence process when ownership,
contractual reuse rights, source licensing, tenant identity, PHI/PII,
privilege, confidentiality, currentness, or provenance is unresolved.

### Layer 1 - Reusable consulting intellectual property

Firm-owned generic templates, field definitions, workflow instructions,
rubrics, taxonomies, checklists, and training methods may inform the product
after ownership and version review.

### Authoritative-source reference lane

Current public or properly licensed regulations and standards remain
versioned, cited references checked at use time. Each reference needs its
stable source URI, edition/version or hash, amendment/effective date, retrieval
and verified-as-of dates, jurisdiction, licensing scope, currentness check, and
qualified applicability review. It must not be learned or repeated as timeless
model knowledge, and its presence does not decide applicability.

### Layer 2 - De-identified derived patterns

Client-specific work may contribute only abstracted structures or patterns
when contractual authority permits it and client identity, sensitive facts,
source text, and unique identifiers have been removed or transformed under an
approved de-identification standard and residual-risk review.

### Layer 3 - Client-private knowledge

Authorized client policy, SOP, evidence, finding, and action records remain
inside that client's boundary. They may support tenant-private retrieval or
assistance but must not train shared behavior or become cross-client examples
without explicit authority.

### Layer 4 - Human-reviewed evaluation cases

A small, high-quality set of permissioned cases should test:

- exact citation and version handling;
- supported, partially supported, conflicting, and unverified statements;
- missing evidence;
- stale or superseded sources;
- applicability boundaries;
- safe refusal or `Unknown`;
- plan-of-correction structure;
- reviewer return, revision, approval, closure, and reopen behavior; and
- cross-tenant and source-rights failures.

Evaluation cases should preserve the qualified review decision and rationale.
Volume without trusted labels is less useful than a smaller governed set.
Held-out cases must not be used for training or prompt exemplars and should be
separated by tenant and time to reduce memorization and temporal leakage.
Copied, near-duplicate, version-family, and related-case detection must prevent
the same underlying matter from appearing across training and evaluation
splits.

Evaluation coverage should be reported by tenant, segment, year, workflow
stage, reviewer, outcome, and support state, including `supported`, `gap`,
`conflicting`, missing evidence, failed closure, reopen, and unknown—not only
well-documented or successful cases.

### Layer 5 - Approved training examples

Only permissioned, de-identified, provenance-complete, human-reviewed examples
may become shared training or fine-tuning data. Synthetic cases derived from
approved patterns are preferable when real content adds privacy, contractual,
licensing, or memorization risk without adding unique learning value.

A plan of correction is a drafting and workflow example unless it is linked to
qualified approval, implementation state, reviewed closure evidence, and any
known recurrence or outcome. Without that linkage, it is not a label of
effective remediation.

## Recommended order of use

1. **Domain model:** derive the objects, statuses, relationships, and
   vocabulary the product must represent.
2. **Workflow logic:** identify recurring transitions, decision points,
   exceptions, reviewer authority, and closure patterns.
3. **Template system:** turn recurring structures into configurable,
   versioned product templates.
4. **Evaluation system:** create human-reviewed positive, gap, conflict,
   supersession, and refusal cases before any generative feature.
5. **Tenant-private retrieval:** retrieve exact authorized client sources with
   citations and currentness controls.
6. **Assistive intelligence:** suggest classifications, missing fields,
   similar patterns, draft rationales, or plan-of-correction components for
   human review.
7. **Model training or fine-tuning:** consider only when the governed example
   set, rights, evaluation results, and expected advantage justify it.

The first high-value use is structured intelligence and evaluation, not
immediate bulk model training.

## Required record for each intelligence example

Before an example is eligible for shared learning or evaluation, record:

- stable artifact ID and assurance-case ID;
- source and tenant owner;
- content hash and immutable source/version reference;
- `derived-from` chain and extraction/transformation history;
- contractual reuse authority;
- confidentiality and privacy classification;
- source license and allowed use;
- authority, policy, and SOP versions;
- jurisdiction and pre-approved applicability posture;
- evidence state and exact locators;
- finding or gap classification;
- human rationale;
- action and expected closure evidence, when present;
- reviewer identity by role, authority scope, and decision;
- outcome or later revision, when known;
- verified-as-of date and supersession status;
- dataset release/version and train, validation, held-out-test, or
  evaluation-only split assignment;
- permitted intelligence uses;
- downstream index, prompt, dataset, model, and output dependencies; and
- retention, deletion, and audit requirements.

Missing rights, provenance, authority, or currentness means `Unknown` and
exclusion from shared training.

## Artifact-to-model lineage and correction

Every derived record must retain a machine-resolvable chain from original
artifact through transformation, normalized assurance case, dataset release,
index or model version, and affected output. Correction, revocation,
supersession, client deletion, or license expiration must identify every
downstream dependency and support removal, rebuild, re-evaluation, and
rollback.

No production feedback, reviewer edit, client correction, or newly uploaded
artifact may automatically update shared behavior. Feedback enters quarantine
first and is promoted only through qualified adjudication, a versioned corpus
release, leakage checks, evaluation, approval, and rollback planning. Silent
online or cross-client learning is prohibited.

## De-identification and external processors

Removing direct names is insufficient. A permitted derived example needs:

- a named de-identification standard and reviewer;
- residual reidentification and mosaic-risk assessment;
- review of rare events, distinctive facility facts, dates, locations, and
  unique combinations;
- documented purpose limitation; and
- validation that the transformed example cannot reasonably be linked back to
  a client, facility, person, or event.

Every external model, API, storage, labeling, or evaluation processor requires
purpose-specific approval covering provider retention, provider training,
subprocessors, data location, contractual protections, deletion, security, and
HIPAA/BAA posture when applicable. Approval for one processor or purpose does
not authorize another.

## First-release relationship

The first-release hypothesis may use a small set of synthetic or explicitly
permissioned, source-sanitized exemplars to:

- pre-seed the authority-policy-SOP-evidence chain;
- define the structured answer and support classifications;
- supply the explicit-gap case;
- provide the superseded/conflicting adversarial replay; and
- evaluate whether the answer remains cited, human-reviewed, and fail-closed.

The first release does not require bulk ingestion, embeddings, generative Q&A,
fine-tuning, or cross-client learning. Historical corpus preparation is a
parallel product-data workstream for requirements planning, not runtime scope
expansion.

## What the history proves and does not prove

| Evidence conclusion | Current posture |
|---|---|
| The consulting method and tools have been used repeatedly | **[Reported]** since 2020 and consistent with the dated artifact history |
| Recurring delivery structures span many engagement-like workspaces and scope families | **[Documented]** by portfolio metadata; cross-engagement method use is owner-reported |
| The corpus contains useful workflow and decision examples | **[Documented]** at the pattern level; content-level eligibility not yet audited |
| Every historical answer or plan of correction is correct and current | **[Unknown]** |
| The firm may reuse every client or licensed document for shared model training | **[Unknown]** until rights review |
| Clients will adopt the software interface | **[Unknown]** until product use |
| Platform intelligence will reduce consultant effort or improve outcomes | **[Unknown]**; No measurements found |

## Product advantage hypothesis

The potential moat is a compounding system:

```text
longitudinally adopted consulting method
  + governed longitudinal corpus
  + qualified reviewer labels
  + client-private operating context
  + evidence-linked feedback
  = increasingly useful platform intelligence
```

The defensible advantage is not document volume. It is permissioned,
version-aware, human-reviewed operating logic that can explain what source and
evidence support each statement and preserve uncertainty. It may improve from
corrections only through the adjudicated, versioned corpus-release process
above, without leaking one client's content into another's workspace.

## Decisions required before corpus implementation

- Resolve OD-27's permitted-use model.
- Confirm ownership and contractual reuse rights by artifact class.
- Define client-private, firm-owned, derived, evaluation-only, and prohibited
  corpus tiers.
- Name privacy/security, legal/licensing, operational/compliance, and product
  reviewers.
- Decide whether the initial intelligence strategy is structured rules,
  tenant-private retrieval, model-assisted drafting, fine-tuning, or a staged
  combination.
- Define deletion, correction, supersession, and downstream model/update
  behavior.
- Approve an evaluation set before any generative or training implementation.

No corpus ingestion, extraction, model training, or runtime intelligence is
authorized by this strategy.
