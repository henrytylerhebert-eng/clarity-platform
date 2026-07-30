# Decision packet: per-organization policy & procedure index (Phase 2)

**Status:** OPEN — concept captured at owner request 2026-07-29. **No design,
no schema, no implementation.** This packet exists so the idea is recorded
with its constraints and risks before anyone builds toward it.

**Depends on:** Phase 1 regulatory reference acquisition
(`docs/legal/GEMINI_DEEP_RESEARCH_PROMPT_CMS_MEDICARE_MEDICAID.md`), which is
written but **not executed**.

## The concept, as stated by the owner

Most CMS guidance is left to interpretation, and each organization develops
its own policies and procedures custom to that facility. Phase 2 would give an
adopting organization a mechanism to build an **AI-native index** of its own
policies and procedures, comprehensive for the use cases the platform covers,
and **unique to that organization's environment only**.

## Why the sequencing matters

The agreed build sequence in `CLAUDE.md` is: case repository → case command
service → documents → evidence → insurance/benefits → authorization readiness
→ authentication → API → UI → **controlled extraction** → **AI agents**.

This capability sits on the last two steps. It cannot be built before them
without violating the sequence, because it *is* controlled extraction plus
retrieval over a tenant corpus. Recording it now is correct; starting it now
is not.

## What Clarity already has that this would reuse

The platform has a strong precedent for exactly the hard part — binding
interpreted meaning to immutable source text:

- **Evidence items** bind *verbatim source text* to an exact document version
  and are immutable by construction. Corrections touch interpretation only,
  never the original text.
- **Contradiction groups** make conflicting sources visible without resolving
  them automatically.
- **Documents** are versioned, and evidence is bound to the version, not the
  document.
- **Audit** metadata carries hashes and field names — never source text or
  file bytes.
- **Tenancy** appears in every predicate; a record id is never authorization.

A policy index should be built on these primitives rather than inventing a
parallel document/retrieval stack. If it cannot be, that is itself a finding
worth an ADR.

## Hard constraints any design must satisfy

1. **Tenancy is absolute.** `organizationId` in every predicate. One
   organization's policy corpus must be structurally unreachable from another
   tenant's session — not filtered out, unreachable.
2. **One Prisma package.** Only `packages/case-repository` may import
   `@prisma/client`.
3. **Immutability of source.** A policy excerpt must bind to an exact document
   version, and no change-set type may express editing the source text.
4. **Append-only audit** with the restricted-identifier guard. Retrieval
   events, if audited, carry hashes and field names — never policy text.
5. **No PHI in the corpus.** Policies are not patient data, but excerpts,
   examples, and appendices in real P&P documents frequently contain patient
   examples. The ingestion boundary must assume they might.
6. **Fail closed.** Consistent with the prescreen evaluators: absent, stale,
   or ambiguous policy must produce a named gap, never a permissive default.

## The risks that need owner rulings, not engineering judgment

### R1 — Cross-tenant leakage through shared retrieval (highest severity)

"AI-native index" implies embeddings and vector retrieval. A shared vector
store is the classic route to a cross-tenant disclosure, and it defeats the
tenancy invariant in a way that ordinary row-level filtering does not, because
nearest-neighbour search does not naturally respect a tenant predicate. Any
design must state whether the index is physically partitioned per tenant, and
how that is proven by test. **This is the single decision most likely to make
the feature unsafe.**

### R2 — Policy-as-reference versus policy-as-authority

There is a large difference between:

- surfacing *"your policy X.Y says this, here is the verbatim excerpt and its
  version"*, and
- computing *"this placement is / is not permitted under your policy."*

The first is retrieval. The second is a decision, and Clarity's whole design
posture so far is that the system derives **hints and named gaps, never
decisions** (prescreen possible-pathways, readiness with no aggregate score).
The owner should rule which of these Phase 2 is, because the second changes
the platform's regulatory character.

### R3 — Clinical decision support and FDA scope

If the index begins telling clinicians what their organization's policy
requires for a specific patient's placement, that may implicate FDA clinical
decision support software policy (21st Century Cures Act §3060 and the
associated CDS guidance criteria — including whether the basis for a
recommendation is transparent and whether the clinician can independently
review it). This needs research and counsel input before design, not after.
It is a genuine scope question, not a hypothetical.

### R4 — Whose interpretation, and who is accountable

Phase 1's output classifies requirements as BINDING-INTERPRETIVE or
ORG-DISCRETION and enumerates what each organization must decide for itself.
If Clarity ships a *default* interpretation, Clarity has authored clinical or
compliance policy — which the repository's honesty rules currently forbid
claiming. If it ships no default, every tenant faces a blank page. The owner
should rule where on that spectrum this lands.

### R5 — Staleness

Policies are revised; regulations change. An index that confidently returns a
superseded policy version is worse than no index. Any design must state how
version currency is represented and what happens when it is unknown.

## What Phase 1 must deliver before this can be designed

The Phase 1 research prompt is written to produce, as a named closing section,
**"the interpretation map"** — the consolidated list of everything an adopting
organization must decide for itself, grouped by Clarity workflow. That map is
the specification input for Phase 2. Without it, a policy index has no
skeleton and would just be document search.

## Options for the owner (not yet ruled)

These are recorded for a future decision, deliberately unranked:

1. **Defer entirely** until controlled extraction and AI agents are reached in
   the build sequence. Lowest risk; the concept stays captured here.
2. **Phase 1 only, now** — execute the regulatory research, produce the
   interpretation map as a documentation artifact, and stop. No runtime, no
   ingestion. This is the natural next step and does not disturb the build
   sequence.
3. **Design-only spike** — an ADR that answers R1–R5 with no code, so the
   architecture is settled before the sequence reaches it.
4. **Retrieval-as-reference MVP** after the UI step — verbatim excerpt lookup
   with version binding and per-tenant partitioning, explicitly no
   interpretation and no decision output.

Option 2 is the only one that can proceed without disturbing the agreed
sequence, and it is what the Phase 1 prompt was written for.

## What is NOT claimed by this packet

No design, schema, migration, vector-store selection, model selection, or
implementation plan. No claim that a per-tenant policy index is feasible under
the current architecture, that retrieval can be made tenant-safe, that the
feature would be free of FDA CDS implications, or that any of R1–R5 has been
resolved. No production readiness, HIPAA compliance, or approved clinical or
legal rule content.
