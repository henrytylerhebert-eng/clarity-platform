# Private Remote and Branch Protection Guide

**Status update (2026-07-11, later the same day):** the private remote now exists — `github.com/henrytylerhebert-eng/clarity-platform` — with all branches and the `clarity-foundation-v0.1` tag pushed and `main` protected (created under the owner's explicit directive; pre-push history secret-scan came back clean). Sections 1–2 below are retained as the record of the procedure. Section 3a documents the **temporary solo-maintainer review policy** now in force. GitHub secret scanning could not be enabled (unavailable for private free-plan repositories); the manual history scan stands in until the plan changes or the repo joins an organization with Advanced Security.

**Original status (2026-07-11, morning):** No Git remote exists for this repository (verified: `git remote -v` is empty; nothing has ever been pushed). This guide records the exact steps a human with GitHub organization access should follow to create a private remote and push safely. Automated tooling must not create the remote or push without explicit authorization.

## 1. Create the private repository

Using the GitHub CLI (recommended, from the repository root):

```bash
gh repo create <org>/clarity-platform --private --disable-wiki \
  --description "Clarity behavioral-health case intelligence platform (synthetic data only)"
```

Or via the GitHub UI: New repository → Owner: your organization → **Private** → do **not** initialize with a README/.gitignore/license (this repository already has history).

Decisions to make first:
- **Owner:** an organization, not a personal account — branch protection and required reviews need org-level settings.
- **Name:** `clarity-platform` (matches `package.json`).

## 2. Configure the remote and push

```bash
git remote add origin git@github.com:<org>/clarity-platform.git
git push -u origin chore/clarity-master-package-integration
git push -u origin feat/tenant-scoped-case-repository
git push -u origin feat/case-command-service
git push -u origin chore/case-foundation-hardening-and-documents
git push origin --tags        # pushes clarity-foundation-v0.1 once it exists
```

Then create `main` from the most complete reviewed branch (via a PR, not a direct push):

```bash
git checkout -b main chore/case-foundation-hardening-and-documents
git push -u origin main
```

## 3. Protect `main`

GitHub → Settings → Branches → Add branch protection rule for `main`:

- **Require a pull request before merging** — at least 1 approving review; dismiss stale approvals on new commits.
- **Require status checks to pass** — once CI exists, require at minimum: `typecheck`, `lint`, `test` (unit + workflow; database-backed integration tests need a CI PostgreSQL service before they can be required).
- **Require conversation resolution before merging.**
- **Block force pushes** and **block deletions**.
- **Do not allow bypassing the above settings** (including administrators), or document who may bypass and why.
- Direct pushes to `main` are prohibited — all changes land via PR.

## 3a. Temporary solo-maintainer review policy (in force as of 2026-07-11)

**Decision (owner, 2026-07-11):** while this repository has a single maintainer, `main` requires PRs but the **required approving-review count is 0**. Rationale: GitHub forbids approving one's own PR, so a 1-review requirement with one authorized account is a deadlock, and a one-review requirement does not create real separation of duties when the only authorized reviewer is also the author. This is a temporary solo-maintainer control, **not** a removal of code review — every PR still receives a documented self-review (a review comment recording what was verified) before merge.

What stays in force: PR-only flow (no direct pushes), force-push and deletion blocks, conversation-resolution requirement, admin enforcement, and required status checks once CI exists.

The exact change (run by the maintainer, not automated tooling):

```bash
gh api -X PUT repos/henrytylerhebert-eng/clarity-platform/branches/main/protection --input - << 'EOF'
{
  "required_status_checks": null,
  "enforce_admins": true,
  "required_pull_request_reviews": { "required_approving_review_count": 0, "dismiss_stale_reviews": true },
  "restrictions": null,
  "allow_force_pushes": false,
  "allow_deletions": false,
  "required_conversation_resolution": true
}
EOF
```

**Restore the required approving-review count to at least 1 when any of the following occurs:**

- A second human maintainer receives merge access.
- An independent review bot is approved as a formal gate.
- The repository begins handling production deployments, real patient information, regulated workflows, or other materially higher-risk operations.
- External contributors begin submitting changes.

## 4. Migration review requirement

Any PR touching `prisma/schema.prisma` or adding a directory under `prisma/migrations/` must:
1. Be reviewed by someone other than the author.
2. Include the output of `prisma validate` and `prisma migrate status` run against a local `clarity_dev`.
3. State the rollback plan (Prisma migrations are forward-only; rollback means a new down-migration or a documented restore).
4. Never be applied to any shared/hosted database as part of the PR itself (OD-6: database hosting is an open decision).

## 5. Secret scanning and exclusions

- Enable **GitHub secret scanning** and **push protection** (Settings → Code security and analysis) before the first push.
- `.gitignore` already excludes `.env` (verify with `git check-ignore .env` before pushing — it must print `.env`).
- The local object-storage directory (`.local-object-storage/`, added in the document-repository work) must remain ignored; it holds synthetic file bytes that do not belong in history.
- Before the first push, run a history scan (e.g. `gitleaks detect` or `trufflehog git file://.`) — the history was authored locally and has never been screened by hosted scanning.

## 6. What must never be pushed

- `.env` or any file containing `DATABASE_URL` with credentials.
- Real patient data, real insurance identifiers, real facility rosters. Everything in `data/` must stay synthetic (`SYNTHETIC_ONLY` flags).
- Local storage/blob directories, `node_modules/`, build outputs.

## 7. After the remote exists

- Update `IMPLEMENTATION_STATUS.md` to record the remote and the protected-branch configuration.
- Convert per-branch work to PRs targeting `main`; stop long-running local branch chains.
- Revisit OD-9 (CI/toolchain): wire `lint`, `typecheck`, and the non-database test subset as required checks; add a PostgreSQL service container so the integration suite can also become required.
