# Governance document recovery — 2026-09-12

Status: documentation recovery and reconciliation; no agent launch or product implementation.

## Evidence and authority

This recovery starts from `origin/main` at
`35f16eb63ae0953b15802edb62fdfeb6f8795bfa`. It preserves the uncommitted
July proposal from `codex/ai-agent-readiness`, based on
`8399eddad4cb8575d94f9b31db27eb00f73e4bcf`, without replacing newer canonical
status, Rev Ops decisions, or accepted ADRs. The original worktree is unchanged.

The recovered [preparation packet](AI_NATIVE_DOMAIN_AGENT_REPOSITORY_PREPARATION.md)
is historical source evidence. Its findings, test counts, open-PR statements,
and suggested role gates describe its dated assessment. They are not fresh
validation results. The [charter](../agents/PRESCREEN_INVARIANT_VERIFIER_CHARTER.md)
and [approval record](../../governance/prompt-approvals/DEV_R1_PRESCREEN_INVARIANT_VERIFIER_APPROVAL.md)
remain proposed and Pending respectively. The template's proposed execution
contract is available for review, not enacted as a new global gate.

## Current disposition

| Subject | Evidence inspected on 2026-09-12 | Recovery consequence |
|---|---|---|
| Canonical development-agent model | Accepted [ADR-0017](../architecture/ADR-0017-agent-operating-model-and-bridge-retirement.md) and [AI operating plan](../governance/AI_OPERATING_MODEL_PLAN.md); PR #33 merged August 23 | Preserve the accepted model. DEV-R1 is an optional proposed amendment, not a competing accepted topology. |
| Bridge retirement | ADR-0017 accepts retirement; operating-plan frontmatter records physical quarantine as held | Do not reactivate, relocate, delete, or dispatch through the bridge in this recovery. OD-19 tracks the remaining execution disposition. |
| Prescreen Phase 3 | PR #32 merged August 10; `packages/api-service/src/devMain.ts` wires `PrismaPrescreenGateway` | Historical claims that the current API uses only an in-memory gateway are superseded. The in-memory adapter remains a separate test/source surface. |
| Large older lane | PR #30 remains open; its broad scope and conflicts are held for separate disposition | No merge, closure, or acceptance of that lane is implied. |
| Shared CaseStatus vocabulary | `tests/unit/contract-schema-enum-sync.test.ts` still lists exactly `RETURNED_FOR_MORE_INFORMATION` in `KNOWN_DESYNC.CaseStatus` | Retain OD-20; no enum, schema, or migration changes. This inspection does not claim a fresh test pass. |
| Medical-diversion authority | ADR-0018 and `packages/case-service/src/permissions.ts` retain the existing command roles | Retain OD-22 for qualified role-policy review; no clinical approval is inferred. |
| Local runtime versus production | `server.ts` uses Fastify; `devMain.ts` wires authentication, case, prescreen, Rev Ops, and IOP reconciliation adapters | Correct obsolete no-backend/API/auth prose. Production deployment, managed identity, and PHI readiness are not established by this inspection. |
| CI and remote | Git origin is configured; `.github/workflows/ci.yml` has a `verify` job with Node 24, ephemeral Postgres, lint, typecheck, tests, and audit | Correct obsolete no-remote/no-CI claims. Presence of the workflow is not a passing current run. |

## Decision and risk migration

Canonical Rev Ops OD-15, OD-16, and OD-17 retain their existing meanings.

| July preparation ID | Recovered canonical ID | Current question |
|---|---|---|
| OD-15 | OD-18 | Whether to approve the exact historical DEV-R1 evaluation |
| OD-16 | OD-19 | Complete the already-decided bridge retirement safely |
| OD-17 | OD-20 | Resolve or formally retain the remaining CaseStatus tolerance |
| OD-18 | OD-21 | Whether the accepted model should adopt any DEV-R1 proposal |
| OD-19 | OD-22 | Medical-diversion target-role authority |

The recovered preparation risks retain R-13 through R-24. Their canonical
mitigation wording is reconciled to current source evidence; historical
findings are not silently promoted into new defects. Old branch-local IDs in
other worktrees are historical and must not be interpreted through the new
register without this mapping. The source worktrees and external recovery
archive retain their original bytes.

## Material held for separate work

- The source lane's changes to `packages/api-service/package.json`,
  `packages/prescreen-service/package.json`, and
  `packages/prescreen-service/src/commands.ts` are not included here. Runtime
  or package-resolution changes need their own reviewed implementation slice.
- Source-era verification claims and broad status replacements are retained
  as historical context, not pasted over current `IMPLEMENTATION_STATUS.md`
  or `CLAUDE.md` records.
- DEV-R1 owners, sealed corpus, enforced runner boundary, acceptance thresholds,
  and approval remain incomplete. No evaluation ran.
- Graph output and graph policy belong to a separate housekeeping change.

## Verification boundary

This documentation-only recovery checks changed YAML/frontmatter, local
Markdown links, canonical decision/risk cross-references, protected Rev Ops
rows, sensitive-pattern indicators, and diff whitespace. Runtime tests, database
migrations, browser journeys, deployment, and the DEV-R1 experiment are not run
by this slice. Historical source claims and commercial/clinical evidence are
not independently revalidated. No measurements found for DEV-R1 effectiveness.

The next action is review of this recovered documentation. Product, clinical,
security, and agent-launch decisions remain with their named human owners.
