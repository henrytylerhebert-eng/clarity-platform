---
status: OWNER_REVIEW
discovery_id: DISC-20260719-PC-001
version: 0.1.0
data_boundary: synthetic only
---

# Discovery Ledger

This ledger is append-only. The entries below record the source prompt,
owner-authorized synthetic inferences, and derived workflow choices. They do
not become runtime state or qualified domain evidence.

| Record ID | Question / elicitation | Answer | Owner | Timestamp | Workflow | Evidence | Classification | Status | Supersedes | Superseded By |
|---|---|---|---|---|---|---|---|---|---|---|
| `DL-20260719-0001` | What does MAR mean? | Medication Administration Record | Human project owner | `2026-07-19T09:00:00-05:00` | Medication reconciliation | Owner clarification | `Owner Defined` | `ACCEPTED` | - | - |
| `DL-20260719-0002` | What is the PEC issue time? | `2026-07-18T14:00:00-05:00` | Human project owner | `2026-07-19T09:01:00-05:00` | Protective-custody source capture | Owner-authorized synthetic inference | `Assumed` | `ACCEPTED` | - | - |
| `DL-20260719-0003` | What is the PEC expiration? | `2026-07-21T14:00:00-05:00`, exactly 72 hours after issue | Human project owner | `2026-07-19T09:02:00-05:00` | Legal-source clock | Derived from DL-0002 and stated 72-hour duration | `Derived` | `ACCEPTED` | - | - |
| `DL-20260719-0004` | What facility timezone is used? | `America/Chicago` from `tzcfg-olf-20260719-v1` | Human project owner | `2026-07-19T09:03:00-05:00` | Admission service date | Owner-authorized synthetic facility configuration | `Assumed` | `ACCEPTED` | - | - |
| `DL-20260719-0005` | What identifies the custody source? | `PEC-SYN-20260718-001`, with coroner source `COR-SYN-20260718-001` | Officer Peralta / Dr. Jim Halpert role labels | `2026-07-19T09:04:00-05:00` | Protective-custody source capture | Synthetic scenario prompt | `Source Reported` | `ACCEPTED` | - | - |
| `DL-20260719-0006` | Which unit sends the patient? | Lafayette General Emergency Department | Ron Swanson role label | `2026-07-19T09:05:00-05:00` | Sending handoff | Owner-authorized synthetic inference | `Assumed` | `ACCEPTED` | - | - |
| `DL-20260719-0007` | Which program receives the patient? | Oceans of Lafayette Geriatric Behavioral Health, Unit G-3, bed G-312 | April Ludgate / Dr. Angela Martin role labels | `2026-07-19T09:06:00-05:00` | Placement and admission | Owner-authorized synthetic inference | `Assumed` | `ACCEPTED` | - | - |
| `DL-20260719-0008` | Who records facility acceptance? | April records central-intake acceptance at `2026-07-18T18:20:00-05:00`; Angela records receiving psychiatrist acceptance at `2026-07-18T18:35:00-05:00` | Human project owner | `2026-07-19T09:07:00-05:00` | Routing and acceptance | Owner-authorized synthetic inference | `Owner Defined` | `ACCEPTED` | - | - |
| `DL-20260719-0009` | What does "Aetna Amanda" mean? | Aetna is a contact/payer reference; Amanda is the synthetic contact name; no fourth active coverage is created | Human project owner | `2026-07-19T09:08:00-05:00` | Benefits verification | Owner-authorized interpretation | `Assumed` | `ACCEPTED` | - | - |
| `DL-20260719-0010` | How is coverage ordered for the exercise? | Medicare Part A primary; Humana secondary; Medicaid coordination record | Susan Lucci role label / owner scenario | `2026-07-19T09:09:00-05:00` | Benefits verification | Owner-authorized synthetic inference | `Assumed` | `ACCEPTED` | - | - |
| `DL-20260719-0011` | How is the benefit narrative represented? | Raw narrative retained; normalized fields are 60 full days, 30 coinsurance days, 60 lifetime-reserve days, and 190 lifetime psychiatric days | Susan Lucci role label | `2026-07-19T09:10:00-05:00` | Benefits verification | Derived from owner-provided narrative | `Derived` | `ACCEPTED` | - | - |
| `DL-20260719-0012` | What medication candidates enter reconciliation? | Exelon 9.5 mg/24-hour patch daily; Cymbalta 60 mg PO daily; Abilify 10 mg PO daily | Judy Booty role label | `2026-07-19T09:11:00-05:00` | MAR intake | Owner-authorized synthetic inference | `Assumed` | `ACCEPTED` | - | - |
| `DL-20260719-0013` | What allergies and last doses are available? | No known drug allergies reported; Exelon patch changed 2026-07-18 08:00; Cymbalta and Abilify last accepted 2026-07-17 08:00 and were refused 2026-07-18 08:00 | Judy Booty role label | `2026-07-19T09:12:00-05:00` | MAR intake | Owner-authorized synthetic fixture value | `Assumed` | `ACCEPTED` | - | - |
| `DL-20260719-0014` | What medical-screening facts support the walkthrough? | Synthetic screening packet records stable vital signs, no acute injury, no intoxication, and no identified medical instability; values require clinical review | Ron Swanson role label | `2026-07-19T09:13:00-05:00` | Medical screening | Owner-authorized synthetic inference | `Assumed` | `ACCEPTED` | - | - |
| `DL-20260719-0015` | How is the safety narrative captured? | Passive death wish is recorded as reported; no plan or intent is assumed for the fixture; aggression and refusal incidents remain separate evidence items | Qualified clinical reviewer role | `2026-07-19T09:14:00-05:00` | Clinical evidence | Owner-authorized synthetic inference | `Assumed` | `ACCEPTED` | - | - |
| `DL-20260719-0016` | Who may perform UR? | Victor may perform social-work coordination and episode-owned UR for this synthetic scenario | Human project owner | `2026-07-19T09:15:00-05:00` | Post-admission UR | Owner scenario rule; not verified Medicare guidance | `Owner Defined` | `ACCEPTED` | - | - |
| `DL-20260719-0017` | What happens to pre-admission authorization readiness? | Existing pre-admission behavior remains unchanged and separate from post-admission episode-owned UR | Human project owner | `2026-07-19T09:16:00-05:00` | Authorization | Binding S1 decision | `Owner Defined` | `ACCEPTED` | - | - |
| `DL-20260719-0018` | When is the episode admitted? | `2026-07-18T20:10:00-05:00` after source acceptance and transport arrival | Janis Joplin / April Ludgate role labels | `2026-07-19T09:17:00-05:00` | Admission handoff | Owner-authorized synthetic inference | `Assumed` | `ACCEPTED` | - | - |
| `DL-20260719-0019` | What is the initial post-admission authorization outcome? | `PENDING`; risk flags separately include documentation gap and due-date exposure | Victor Bermudez role label | `2026-07-19T09:18:00-05:00` | Episode-owned UR | Owner-authorized synthetic workflow state | `Assumed` | `ACCEPTED` | - | - |
| `DL-20260719-0020` | Which governed events are used? | Existing `ADMISSION_RECORDED.v1`, `AUTHORIZATION_DAY_DECISION_RECORDED.v1`, and `DOCUMENTATION_GAP_RECORDED.v1`; no new event type | Human project owner / technical reviewer | `2026-07-19T09:19:00-05:00` | Event discovery | Existing vocabulary and S2 boundary | `Owner Defined` | `ACCEPTED` | - | - |
| `DL-20260719-0021` | What remains review-gated after inference? | Clinical, legal, payer, medication, facility, security, and production-readiness promotion | Human project owner | `2026-07-19T09:20:00-05:00` | Implementation readiness | Existing Clarity governance | `Owner Decision Required` | `BLOCKED` | - | - |

## Correction Rule

No record in this first session has been corrected. Any later change must add a
new record, set `supersedes` to the prior record, and preserve the original.
