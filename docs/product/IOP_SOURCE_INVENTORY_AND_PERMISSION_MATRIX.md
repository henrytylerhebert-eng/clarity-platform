---
status: approved-for-synthetic-implementation
approval_basis: product-owner instruction recorded 2026-09-08
data_boundary: synthetic-only
---

# IOP source inventory and permission matrix

## Approved synthetic source inventory

| Integration key | Scope | Authority | Import status |
|---|---|---|---|
| `SYNTHETIC_IOP_PROGRAM` | Enrollment, plan version/frequency, attendance, note audit, charge, EMR billable reference | Synthetic fixture only | Approved for this implementation slice |
| `[Unknown] EHR_PROGRAM_SOURCE` | Enrollment, plan, attendance | EHR/program system | Requires source-owner confirmation |
| `[Unknown] DOCUMENTATION_AUDIT_SOURCE` | Note and independent audit status | Documentation/audit system | Requires source-owner confirmation |
| `[Unknown] RCM_BILLING_SOURCE` | Charge and EMR billable status | Charge/EMR/RCM system | Requires revenue-cycle confirmation |

No real system identifier, credential, PHI payload, or note body is approved for this slice.

## Approved synthetic permission matrix

| Repository user role | View | Import | Review exception | Close reconciliation |
|---|---:|---:|---:|---:|
| `ORGANIZATION_ADMIN` | Yes | Yes | Yes | Yes |
| `UTILIZATION_REVIEWER` | Yes | No | Yes | No |
| `COMPLIANCE_REVIEWER` | Yes | No | Yes | No |
| All other roles | No | No | No | No |

This matrix is a synthetic implementation policy. It is not a clinical delegation, revenue-cycle policy, or production RBAC approval. A future IOP director role and program-level scope require operational and security review before real data use.
