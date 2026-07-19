# Source and Assumption Register

| Statement | Classification | Treatment |
|---|---|---|
| Clarity has React/TypeScript, domain contracts, service packages, Prisma and a narrow authenticated API slice. | Confirmed by supplied snapshot | Preserve patterns; Codex must reverify live tree. |
| The production API/hosting boundary is unresolved under ADR-0012. | Confirmed by supplied snapshot | Do not expand routes until reconciled or explicitly approved. |
| Existing evidence workflows are human-driven, source-linked, tenant-scoped and audited. | Confirmed by supplied snapshot | Reuse their command and gateway pattern. |
| Live product agents and external integrations are not implemented. | Confirmed by supplied snapshot | This package supplies contracts and a reference implementation, not deployment proof. |
| Facility admission profiles need per-facility acceptance, lab, inclusion/exclusion and documentation rules. | Confirmed requirement | Keep candidate-only until facility governance review. |
| A shared-schema tenant model is the likely pilot shape. | Proposed in ADR-0012 | Requires owner acceptance and RLS verification. |
| Fastify is the recommended production HTTP adapter. | Proposed in ADR-0012 | Codex must not silently treat it as accepted. |
| Public web research can improve network data quality. | Proposed product hypothesis | Measure with synthetic and later adjudicated datasets. |
| Any real-world accuracy percentage is established. | Unknown | No measurements found. |
| Public payer participation proves current-patient benefits. | Rejected | Always require current-patient verification. |
| Public admission criteria can be enforced automatically. | Rejected | Requires facility, clinical and sometimes legal review. |
