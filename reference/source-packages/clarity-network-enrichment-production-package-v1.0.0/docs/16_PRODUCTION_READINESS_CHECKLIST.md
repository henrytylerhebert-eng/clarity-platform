# Production Readiness Checklist

## Architecture

- [ ] ADR-0012 accepted or superseded.
- [ ] Canonical entity ownership mapped.
- [ ] No duplicate system of record.
- [ ] Command/query separation reviewed.

## Security

- [ ] Managed identity operational.
- [ ] RLS enabled and denial-tested.
- [ ] Egress allowlist and SSRF controls tested.
- [ ] Secrets stored in approved secret manager.
- [ ] Logs redacted and sampled.
- [ ] Threat model approved.

## Governance

- [ ] Review roles approved.
- [ ] Sensitive field routes approved.
- [ ] Source policy approved.
- [ ] Retention policy approved.
- [ ] Facility configuration approval process documented.

## Reliability

- [ ] Migration rehearsal completed.
- [ ] Backup/restore tested.
- [ ] Health/readiness endpoints verified.
- [ ] Alerts and on-call owner configured.
- [ ] Rollback rehearsal completed.

## Quality

- [ ] Unit, integration, API and security suites pass.
- [ ] Synthetic evaluation passes expected scenarios.
- [ ] Adjudicated pilot dataset reviewed.
- [ ] Thresholds calibrated.
- [ ] No unreviewed candidate can enter operational routing.

## Launch evidence

- [ ] One-tenant pilot approval.
- [ ] Clinical/legal signoff for operational facility criteria.
- [ ] Security signoff.
- [ ] Privacy/compliance signoff.
- [ ] Owner acceptance of remaining risks.
