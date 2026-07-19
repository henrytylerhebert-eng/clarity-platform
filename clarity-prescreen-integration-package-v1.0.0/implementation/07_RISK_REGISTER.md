# Risk Register

| ID | Risk | Impact | Mitigation | Owner |
|---|---|---|---|---|
| R-01 | Orientation gate is mistaken for universal capacity law | Unsafe status routing | Label as prescreen gate; authorized review; configurable/approved rule | Clinical/legal |
| R-02 | Facility criteria are treated as universal truth | Wrong blocking/acceptance behavior | Versioned facility profiles with source and approval | Product/facility |
| R-03 | External users see excess PHI | Privacy breach | Minimum-necessary projections, access grants, RLS, audit | Security/privacy |
| R-04 | Attested assessment is silently changed | Clinical/legal integrity loss | Immutable versions and supplements | Engineering |
| R-05 | Phone request remains unowned | Delay/lost referral | Structured task with one owner, due time, acknowledgement | Operations |
| R-06 | Broker is mistaken for actual transporter | Custody/accountability failure | Separate arranger and actual carrier | Transport ops |
| R-07 | Stale provider credentials remain selectable | Unsafe/unauthorized transport | Expiring verification and dispatch-time recheck | Transport admin |
| R-08 | “Secured” implies restraint | Rights/safety issue | Separate restraint authority and records | Clinical/legal |
| R-09 | Parent/guardian treated as universal signer | Invalid consent/disclosure | Document-specific rule matrix | Legal/privacy |
| R-10 | AI-extracted policy auto-publishes | Incorrect enforcement | Candidate-only extraction and multi-owner approval | Governance |
| R-11 | Client role lens becomes authorization | Cross-tenant/role exposure | Server policy and field-filtered projections | Security |
| R-12 | Source-form PHI enters repository/tests | Privacy breach | Synthetic fixtures only; source image excluded | All |
| R-13 | API expansion precedes architecture decision | Rework/security inconsistency | Reconcile ADR-0012 first | Owner/architecture |
| R-14 | Analytics trends are used as patient predictions | Regulated/autonomous decision risk | Aggregate operational use only; purpose limitation | Product/governance |
| R-15 | Integration mapping silently changes meaning | Data-quality/safety issue | Versioned mapping, rejects, reconciliation | Integration |
| R-16 | Offline field data is exposed/lost | Privacy and continuity risk | Do not ship offline until encrypted/device controls approved | Security/product |
| R-17 | Legal/profile effective dates drift | Wrong rule applied | Expiry alerts, effective-time evaluation, counsel review | Legal/config |
| R-18 | Packet completeness is read as acceptance | Workflow misunderstanding | Target-specific readiness language | UX/product |
