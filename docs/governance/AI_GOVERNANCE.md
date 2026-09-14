---
status: Integrated draft
owner: TBD (requires compliance review)
version: 0.10.0
last_integrated: 2026-07-29
source_artifacts:
  - MASTER_ARCHITECTURE.md §19–20, §24 (partial package)
  - reference/source-packages/clarity-ai-database-artifact/docs/AUDIT_RULES.md
  - reference/source-packages/clarity-mh-architecture/prompts/ (13 governed prompt files)
  - docs/agents/PRESCREEN_INVARIANT_VERIFIER_CHARTER.md
  - governance/prompt-approvals/DEV_R1_PRESCREEN_INVARIANT_VERIFIER_APPROVAL.md
  - docs/decisions/OPEN_DECISIONS.md (OD-15, OD-18)
unresolved_conflicts: "07-agent-architecture/ contracts missing from package"
related_requirements: REQ matrix AI rows
related_adrs: ADR-0001
---

# AI Governance

## Principles (from the master build prompt, binding)

Source before summary; structured evidence before narrative; deterministic rules before model judgment; workflow before autonomous agents; human approval before external action; every material mutation creates an audit event; missing information stays visible; contradictions are never silently resolved; all model outputs validate against schemas.

## Agent contracts

Every product/runtime agent must ship with: contract, allowlisted tools, output schema, source requirements, prohibited actions, validation, and human-review rule. **No product/runtime agent may run without a contract.** The package's product/runtime contract files are missing locally; the 13 Jul 8 prompt files under `reference/source-packages/clarity-mh-architecture/prompts/` are the only concrete product/runtime prompt artifacts and move through `governance/prompt-approvals/` before production use. Currently **zero product/runtime agents are implemented or running**.

The proposed
[Prescreen Invariant Verifier](../agents/PRESCREEN_INVARIANT_VERIFIER_CHARTER.md)
is read-only repository-review tooling, not a product AI agent. Its charter is
an unapproved preparation artifact until OD-15 and
[`governance/prompt-approvals/DEV_R1_PRESCREEN_INVARIANT_VERIFIER_APPROVAL.md`](../../governance/prompt-approvals/DEV_R1_PRESCREEN_INVARIANT_VERIFIER_APPROVAL.md)
are approved; it does not change the zero-product/runtime-agent state or
authorize code, case-data, clinical, legal, external, or production action.
Every DEV-R1 output and approval record must capture the exact
provider-exposed model identifier/version, inference runtime/tool-harness
version, reasoning/sampling configuration, source archive/tree and
sanitized/live context hashes, historical evaluation-manifest ID/hash, and
prompt/tool-manifest hashes. If an immutable provider build or setting is
unavailable, it is recorded as `Unknown` and the run is not represented as
exactly reproducible.

## Versioning and audit

Prompt, rule, model, and source versions are recorded on every generated output; model contribution is visible in the UI; rejected model output is an audited event (REQ-014 `MODEL_OUTPUT_REJECTED`).

## Retrieval

Organization-scoped, case-scoped for patient data, permission-aware, date-aware, source-type-aware, citation-producing, auditable. Prompt-injection defense is a required control (SECURITY_AND_PRIVACY).

## Evaluation

Target suites (§24): extraction accuracy, citation support, contradiction detection, prohibited-language (clinical/legal/benefits/payment), tenant isolation, prompt injection, workflow integrity, human factors, fairness. See `docs/testing/EVALUATION_STRATEGY.md`.
