# Navigation and Role Map

| Navigation item | Assessor | Central Intake | Clinical reviewer | Legal authority | Transport | Onboarding | Auditor |
|---|---:|---:|---:|---:|---:|---:|---:|
| My Prescreens | Y | Y | scoped | scoped | assigned only | N | read-only |
| Start Prescreen | Y | Y | N | N | N | N | N |
| Central Intake | N | Y | assigned review | assigned review | N | N | read-only |
| Packets | assigned | Y | assigned | assigned | minimum necessary | N | read-only |
| Communications & Tasks | assigned | Y | assigned | assigned | assigned trip | N | read-only |
| Facility Responses | read response | Y | assigned | N | N | N | read-only |
| Transport & Custody | read/coordinate | Y | N | scoped | assigned trip | N | read-only |
| Configuration | N | N | approver | approver | provider admin | draft/approve | read-only |
| Operational Trends | limited | scoped | scoped | scoped | scoped | N | scoped |

Frontend visibility is not authorization. The API returns only fields and actions permitted for the verified principal.
