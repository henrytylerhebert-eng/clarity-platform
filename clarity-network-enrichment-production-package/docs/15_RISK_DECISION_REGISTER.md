# Risk and Decision Register

| ID | Risk/decision | Status | Required owner/action |
|---|---|---|---|
| ND-1 | Current canonical organization/facility/program ownership model | Needs decision after repo inspection | Product + engineering |
| ND-2 | ADR-0012 API framework/hosting boundary | Open | Tyler/architecture owner |
| ND-3 | Tenant isolation model and RLS activation | Open | Security + architecture |
| ND-4 | Production source allowlist and terms/robots policy | Open | Legal + security |
| ND-5 | Evidence snapshot retention | Open | Security + compliance |
| ND-6 | Entity-resolution production thresholds | Unmeasured | Calibrate on adjudicated set |
| ND-7 | Facility admission-profile approval roles | Requires facility clinical/legal review | Facility governance |
| ND-8 | Transport/legal instrument capability rules | Requires jurisdiction/facility review | Legal + operations |
| ND-9 | Public personnel retention and privacy policy | Open | Privacy + HR/legal |
| ND-10 | Cross-tenant shared directory authority | Open | Product + legal + security |
| ND-11 | Managed identity provider | Open | Security/operations |
| ND-12 | Production monitoring and on-call ownership | Open | Operations |

## Highest risks

1. False merge of similarly named entities.
2. Stale contact or service data used operationally.
3. Public marketing language treated as admission policy.
4. Candidate data bypassing human review.
5. Tenant leakage through search or identifier enumeration.
6. Agent prompt injection or SSRF through source retrieval.
7. Payer participation misrepresented as current coverage.
