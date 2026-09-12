---
status: Pending
owner: Tyler Hebert
created: 2026-07-29
charter: docs/agents/PRESCREEN_INVARIANT_VERIFIER_CHARTER.md
charter_version: 0.2.0
charter_content_hash: Pending
work_package_id_and_hash: Pending
runner_id_and_config_hash: Pending
model_provider_and_service: Pending
model_id_and_version: Pending
inference_runtime_and_tool_harness_version: Pending
reasoning_and_sampling_configuration: Pending
system_developer_role_prompt_bundle_sha256: Pending
tool_manifest_sha256: Pending
hash_algorithm: SHA-256
sanitized_context_sha256: Pending
evaluation_manifest_id: Pending
evaluation_manifest_sha256: Pending
evaluation_manifest_scope: Corpus A archive; Corpus B archive; revision holdout archive; all gold and scoring keys; prompt-injection canary; score sheets
scope: Historical blind replay only; read-only repository-review tooling
decision: Not decided
---

# DEV-R1 Prescreen Invariant Verifier Approval

> Recovered proposal, 2026-09-12. The accepted ADR-0017 operating model
> remains authoritative. DEV-R1 is a candidate amendment requiring OD-18 and
> OD-21 disposition; this recovery grants no execution authority. See
> [recovery disposition](../../docs/developer-handoff/GOVERNANCE_DOCUMENT_RECOVERY_2026-09-12.md).

This is the required governance record for the proposed DEV-R1 charter. `Pending`
means the verifier may not run.

## Decision required

Choose one:

- [ ] Approve the historical blind replay only.
- [ ] Revise the charter or evaluation design before approval.
- [ ] Reject the experiment.

Decision date:

Decision rationale:

## Required named owners

- Product/human authority:
- Technical integration owner:
- Independent verifier and gold-set custodian:
- Evaluation reviewer:
- Security reviewer:

No field may remain blank for approval.

## Approval boundary

Approval, if granted, covers only:

- The exact charter version named above.
- The exact charter, work-package, and runner/config content hashes recorded
  above.
- The exact provider-exposed model identity, inference runtime/tool-harness
  version, reasoning/sampling configuration, prompt-bundle hash, and
  tool-manifest hash recorded above. Any provider field that cannot be exposed
  must be `Unknown` with the reproducibility limitation explicitly accepted;
  the result may not be represented as an exact same-model replay.
- The exact sanitized-context hash and evaluation-manifest ID/hash recorded
  above. The manifest must bind every Corpus A, Corpus B, and revision-holdout
  base/head archive plus every gold/scoring key, prompt-injection canary, and
  score sheet; all answer-bearing material stays outside DEV-R1's readable
  scope.
- A runner-enforced standalone two-commit repository, read-only filesystem,
  no-network, no-credential, and restricted-Git boundary.
- Stage 1 historical scoring, revision/stop bands, and human review.

Approval does not cover:

- A live PR trial.
- Code, test, configuration, schema, migration, or documentation edits by DEV-R1.
- Database-backed commands.
- Subagents, bridge dispatch, network/account actions, or external messages.
- Product AI, case data, clinical/legal content, deployment, or production use.
- Any later charter/prompt revision; each revision needs a new approval entry.
- Final experiment acceptance. Stage 1 can only make DEV-R1 eligible to request a
  separately approved live trial.

## Evidence required before status may become Approved

- [ ] OD-18 records the decision and all owners above.
- [ ] OD-21 selects one canonical governance and evaluation model.
- [ ] The charter and work package contain no unresolved authority fields.
- [ ] The independent verifier has sealed the gold labels outside DEV-R1's
      readable paths.
- [ ] A sanitized corpus-era context package has been prepared so benchmark
      answers are not revealed by current risks, decisions, or fix commits.
- [ ] The revision holdout and prompt-injection canary are sealed outside DEV-R1's
      readable paths.
- [ ] A context-reconstruction dry run reaches the same synthetic base/head,
      scope, contracts, and stop rules; the verifier confirms the external
      source-tree mapping.
- [ ] Each corpus is an ephemeral standalone repository with exactly two
      synthetic commits, no remote, no source-repository object store, no
      other/unreachable objects, and no PR metadata or network access.
- [ ] The runner proves DEV-R1 cannot write, dispatch, access credentials/secrets,
      follow embedded instructions as authority, or use a database.
- [ ] Charter, work package, sanitized context, and runner configuration hashes
      are recorded above before sign-off.
- [ ] One sealed evaluation manifest enumerates and hashes every Corpus A,
      Corpus B, and revision-holdout base/head archive, all gold/scoring keys,
      the prompt-injection canary, and every score sheet; its ID and SHA-256
      are recorded above and independently verified.
- [ ] Provider/model identity, runtime/tool-harness version,
      reasoning/sampling configuration, prompt-bundle hash, and tool-manifest
      hash are recorded above; any `Unknown` reproducibility limitation is
      explicitly accepted.
- [ ] The accepted-run record location is reserved as
      `governance/prompt-approvals/runs/DEV-R1-<run-id>.md`; the gold source remains
      external.

## Sign-off

- Product owner:
- Technical integration owner:
- Independent verifier:
- Evaluation reviewer:
- Security reviewer:
