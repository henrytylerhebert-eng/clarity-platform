# Security

**Status: requirements documented; controls NOT implemented.** The prototype has no authentication, backend, or server-side persistence. Nothing in this repository is HIPAA-compliant by virtue of documentation.

Full policy: [docs/security/SECURITY_AND_PRIVACY.md](docs/security/SECURITY_AND_PRIVACY.md).

## Rules in force now

1. **Synthetic data only.** No real patient data, member IDs, Medicare identifiers, policy numbers, or credentials anywhere — code, fixtures, tests, logs, or docs. Fixtures must carry `SYNTHETIC_ONLY` flags (enforced by the seed loader).
2. **No live integrations.** No EHR, payer portal, clearinghouse, email, fax, or cloud connection may be added without a formal security review.
3. **No secrets in git.** `.env` is ignored; `.env.example` carries placeholders only. No production credentials exist.
4. **Restricted identifiers never enter audit logs** — structurally enforced by `AppendOnlyAuditLog` and tested in `tests/security/`.
5. **Business-sensitive source material** (`reference/source-documents/clarity-mh-sources/Reporting Metrics Ops and Budget .xlsx` and derivatives) stays local; do not push this repository to any public remote without reviewing that material first (risk R-11).

## Required controls before any real-data pilot

Authentication + MFA, least privilege, tenant isolation, per-case permissions, encryption, secrets management, object-store controls, field masking, append-only audit at the persistence layer, backup/restore, model-provider governance, prompt-injection defense, incident response. Tracked in the [risk register](docs/decisions/RISK_REGISTER.md).

## Reporting

No public issue tracker exists. Report concerns to the repository owner directly.
