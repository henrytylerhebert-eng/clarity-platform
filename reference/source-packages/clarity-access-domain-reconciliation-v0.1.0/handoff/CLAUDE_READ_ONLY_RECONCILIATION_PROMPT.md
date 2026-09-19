# Claude Read-Only Local Reconciliation Prompt

Perform a forensic, read-only assessment of this local Clarity workspace against `origin/main`.

Do not edit files. Do not commit. Do not push. Do not merge or rebase. Do not delete branches, worktrees, stashes, databases, migrations, generated files, or untracked files. Do not run destructive Prisma commands. Do not reveal `.env` values, secrets, credentials, PHI, PII, or private source-document contents.

First establish the exact workspace identity:
- current directory;
- Git remote;
- current branch;
- current HEAD;
- `origin/main` HEAD;
- dirty state;
- ahead/behind state;
- whether this checkout matches `henrytylerhebert-eng/clarity-platform`.

Inventory:
- local branches;
- remote branches;
- worktrees;
- stashes;
- untracked files;
- ignored but project-relevant files;
- local-only commits;
- commits not reachable from `origin/main`;
- branches with work not represented on current main.

Identify every local artifact potentially related to:
- Access;
- Crisis Ops;
- intake;
- Prescreen;
- patient journey;
- referral;
- facility routing;
- Learning & Practice;
- liaison/referral-development training;
- Freedom Behavioral role/workflows;
- Operating Assurance;
- workforce education;
- any role/scenario architecture.

For every potentially valuable local-only item report:
- source path/branch;
- evidence of age/state;
- capability;
- equivalent on main;
- newer/older/divergent/duplicate/unknown;
- preservation recommendation.

Inspect local development database state without modification:
- migration status;
- migrations present locally but absent from main;
- ledger entries absent from current main;
- whether historical issue #24 synthetic residue still exists;
- whether historical issue #31 migration contention still exists.

Compare local state against:
- `IMPLEMENTATION_STATUS.md`;
- `CLAUDE.md`;
- `AGENTS.md`;
- ADRs;
- open PRs;
- this Access Reconciliation package.

Disposition values only:
- CURRENT MAIN
- PRESERVE AND REVIEW
- CANDIDATE TO INTEGRATE
- SUPERSEDED
- DUPLICATE
- UNKNOWN — OWNER DECISION REQUIRED

Execute none of the proposed cleanup.
