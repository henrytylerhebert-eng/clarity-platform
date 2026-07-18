# Role, Permission, and Visibility Matrix

## Prototype matrix

| Demo role | Product Studio visibility | Allowed in this slice | Not implied |
| --- | --- | --- | --- |
| All workspaces | Internal synthetic registry | Read, filter, inspect, switch lenses | Authentication or authorization |
| Program Director | Internal synthetic registry | Read, filter, inspect, switch lenses | Product approval or release authority |
| Other operational roles | Existing role-scoped operational workspaces | No Studio route in this slice | Denial enforced by a backend policy |

## Future production matrix

| Audience | Projection | Required server-side controls |
| --- | --- | --- |
| Platform owner | Full product and decision context | Verified principal, organization scope, audited decision command |
| Product operations | Registry hygiene and feedback administration | Object policy, moderation policy, export controls |
| Engineering | Build mapping and delivery evidence | Technical detail policy, repository adapter permissions |
| Clinical or operational advisor | Sanitized workflow and structured feedback | Audience membership, PHI warning and moderation |
| Public viewer | Approved roadmap projection only | Publication approval, sanitization, revocation and audit |

The current role selector is demo-only. Hidden navigation is not a security control. Production readiness requires backend denial tests for cross-tenant access, publication, feature-flag changes, release approval, export, and security detail access.
