# Clarity Operating Assurance — VS-OA-001 Product Acceptance handoff

**Purpose:** independent Product Acceptance handoff  
**Current package:** TWP-OA-007 — Acceptance Handoff Package  
**TWP-OA-007 starting point:** `2cc25abc85e0148a946e6b15e9d4ab729e0c7818`  
**Acceptance baseline:** the final `main` commit recorded in Clarity governance after this handoff merges. Do not accept an older commit by substitution.

## 1. What this handoff does

This package transfers implementation evidence for VS-OA-001 to a separate Product Acceptance reviewer.

It does **not**:

- perform Product Acceptance;
- waive any safety-critical fixture;
- authorize production deployment;
- convert implementation CI into independent acceptance evidence;
- change runtime code, persistence, API behavior, permissions, UI behavior, tests, or fixtures.

## 2. Accepted product outcome

The reviewer is evaluating one bounded product outcome:

> Clarity safely connects a pre-approved applicability posture to current/permitted authority, organization policy/SOP, expected evidence, contributed evidence, bounded source-linked assistance, and qualified human review while failing closed under missing, stale, conflicting, restricted, or otherwise insufficient support.

The reviewer is **not** evaluating a generic compliance platform or broad regulatory-knowledge product.

## 3. Governing semantic rules

The following are controlling and must not be softened during acceptance:

1. `SUPPORTED` is not a universal compliance determination.
2. Applicability is human-approved.
3. Evidence submission is not evidence acceptance.
4. Machine assistance and human review are separate states/records.
5. Final review requires:
   - same-organization authenticated principal;
   - global `COMPLIANCE_REVIEWER`;
   - active case-scoped `QUALIFIED_REVIEWER` assignment;
   - non-empty `authorityBasis`.
6. `SYSTEM_ADMIN` alone does not bypass qualified-review authority.
7. Restricted rights, stale/superseded source, unresolved source conflict, missing evidence, or insufficient metadata fail closed.
8. Historical evidence/evaluations/reviews remain inspectable after replay.
9. No cross-tenant evidence path is permitted.
10. No machine result named `Compliant` exists in this slice.

## 4. Required source documents for the acceptance reviewer

Read before issuing any verdict:

- accepted PRP/acceptance criteria from Clarity governance;
- `docs/testing/OPERATING_ASSURANCE_TEST_MANIFEST.md`;
- `docs/implementation/OPERATING_ASSURANCE_VS_OA_001.md`;
- this handoff;
- current changed-path/diff state for the Product Acceptance candidate baseline;
- any new defect or change-control record created after this handoff.

Implementation evidence is informative but not dispositive.

## 5. Accepted fixtures to evaluate

### FIX-OA-001 — Happy path
Approved applicability + current permitted source + linked policy/SOP + sufficient evidence.

Expected:
- bounded machine `SUPPORTED` or accepted fixture-equivalent;
- human review still required;
- qualified reviewer may accept;
- source/evidence/machine/human history is attributable.

### FIX-OA-002 — Missing evidence
Expected:
- `MISSING_EVIDENCE` / review-required behavior;
- no positive authoritative output.

### FIX-OA-003 — Applicability pending
Expected:
- `APPLICABILITY_PENDING` / review-required behavior;
- no positive authoritative output.

### FIX-OA-004 — Rights restricted
Expected:
- restricted source is not silently used;
- `RIGHTS_RESTRICTED` / review-required behavior.

### FIX-OA-005 — Stale/superseded replay
Start with an accepted bounded result, change source trust state to stale/superseded, re-evaluate.

Expected:
- prior result/review remain historical;
- current result fails closed;
- no silent carry-forward of prior support.

### FIX-OA-006 — Source conflict
Introduce unresolved material source conflict.

Expected:
- `CONFLICT` / review-required behavior;
- earlier historical result remains inspectable.

### FIX-OA-007 — Human reviewer disagrees
Machine result is positive/partially positive, qualified reviewer rejects or requests more evidence.

Expected:
- reviewer decision remains separate and attributable;
- machine output does not overwrite human decision.

### FIX-OA-008 — Evidence revision
Submit evidence, revise it.

Expected:
- prior evidence provenance remains inspectable;
- current submission is distinguishable.

### FIX-OA-009 — Unauthorized reviewer
Attempt final review without both required grants.

Expected:
- action denied;
- `SYSTEM_ADMIN` alone remains insufficient.

### FIX-OA-010 — Missing/unknown source metadata
Expected:
- `UNKNOWN` / review-required behavior;
- no positive authoritative support.

Safety-critical: 002, 003, 004, 005, 006, 007, 009, 010.

No critical fixture may be waived informally.

## 6. Acceptance criteria checklist

The independent reviewer must explicitly report pass/fail for:

- **AC-OA-001** complete inspectable trace;
- **AC-OA-002** applicability gate;
- **AC-OA-003** current-source support behavior;
- **AC-OA-004** missing-evidence fail-closed behavior;
- **AC-OA-005** submitted ≠ accepted;
- **AC-OA-006** rights gate;
- **AC-OA-007** stale-source replay;
- **AC-OA-008** unresolved conflict;
- **AC-OA-009** human reviewer authority;
- **AC-OA-010** machine/human separation;
- **AC-OA-011** historical preservation;
- **AC-OA-012** no machine `Compliant` state;
- **AC-OA-013** tenant isolation;
- **AC-OA-014** audit/history reconstruction.

## 7. Recommended independent verification commands

Use a clean checkout/worktree at the final Product Acceptance candidate baseline.

```bash
npm ci
npx prisma validate
npx prisma generate
npx prisma migrate deploy
npm run lint
npm run typecheck
npm test
npm run test:app
npm --workspace app run build
npm run test:oa-e2e
npm audit --audit-level=high
```

Optional bounded local integration re-run with disposable PostgreSQL:

```bash
npm run test:ephemeral -- npx vitest run \
  tests/integration/assurance-gateway.test.ts \
  tests/integration/assurance-tenant-isolation.test.ts \
  tests/integration/assurance-command-service.test.ts \
  tests/integration/assurance-review-safety.test.ts \
  tests/integration/assurance-api.test.ts \
  tests/integration/assurance-replay.test.ts

npm run test:oa-e2e:ephemeral
```

The reviewer may author additional black-box tests. It must not weaken or rewrite the accepted product contract to make an implementation pass.

## 8. Implementation evidence available

TWP-OA-006 protected CI run #181 passed:

- root: **73 files / 758 tests**;
- replay integration: **3/3**;
- app: **21 files / 140 tests**;
- OA workspace: **8/8**;
- desktop/mobile Playwright: **6/6**;
- app build: passed;
- migrations: all 24 passed;
- lint/typecheck: passed;
- dependency audit: 0 vulnerabilities.

Treat these as historical implementation evidence only.

## 9. Post-baseline delta that must be included in acceptance

After `2cc25abc…`, PR #75 advanced `main` and changed Operating Assurance command envelopes to strict Zod schemas parsed before tenant reads. It also completed a broader native-Fastify routing migration for older routes.

TWP-OA-007 itself is authored from the authorized `2cc25abc…` baseline, but its pull request is merged into the then-current `main`. Therefore Product Acceptance must use the **post-handoff merged main commit recorded in Clarity governance**, which includes any compatible intervening main changes and their protected-CI re-verification.

If any later main change modifies OA semantics, fixtures, authorization, persistence, API behavior, or UI trust semantics before Product Acceptance runs, the reviewer must either:

- include that change in its independent scope and re-verify affected criteria; or
- stop and request lifecycle/change-control reconciliation.

## 10. Known limitations / non-scope

Do not treat absence of defects in VS-OA-001 as proof of:

- production regulatory coverage;
- legal/regulatory correctness beyond the synthetic fixture;
- clinical correctness;
- live PHI/PII safety;
- production RLS completeness;
- production deployment readiness;
- external integration readiness;
- cross-browser certification;
- load/performance readiness;
- accessibility certification;
- survey/accreditation outcome improvement;
- commercial viability or willingness to pay.

## 11. Required acceptance report structure

The Product Acceptance reviewer should produce a separate lifecycle artifact containing:

1. candidate commit SHA;
2. reviewer identity/role and independence statement;
3. source materials reviewed;
4. commands/tests executed;
5. AC-OA-001…014 pass/fail table;
6. FIX-OA-001…010 results;
7. defects with severity and reproduction steps;
8. unresolved risks/limitations;
9. scope-drift statement;
10. one lifecycle verdict permitted by the Product Acceptance process.

Implementation authors must not pre-write the verdict.

## 12. Handoff condition

TWP-OA-007 is complete when these handoff documents are reviewed, merged, and the exact final `main` SHA is recorded in Clarity governance as the Product Acceptance candidate.

Only then may the lifecycle state transition from **Controlled Implementation** to **Product Acceptance**.

Transitioning the lifecycle state authorizes independent acceptance work; it does not mean the product has been accepted.