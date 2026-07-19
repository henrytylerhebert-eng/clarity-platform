# Public Safety & Crisis Resource Directory Research

**Target Geography:** Louisiana (Emphasis on Lafayette Parish / Acadiana / Region 4)
**Scope:** Discovery and directory architecture only. No production claims or placements.

---

## 1. Executive Summary

Clarity is researching a governed coordination directory encompassing law enforcement, mobile crisis response, and elder protection. The Acadiana region (Region 4) offers strong examples of existing coordination, notably the Lafayette Parish Sheriff’s Office (LPSO) Crisis Intervention Team (CIT) and the state-level Louisiana Crisis Hub, which dispatches mobile crisis responders. This packet serves as source-backed seed intelligence to validate Clarity's CRM directory model, testing fit for prescreen, field handoff, and adult protective services workflows.

---

## 2. Source-Grounded Agency Directory

See the accompanying `clarity_public_safety_crisis_directory_table.csv` for the structured tabular data.

---

## 3. Law Enforcement Mental Health / Crisis Units

### Lafayette Parish Sheriff's Office (LPSO)
- **Jurisdiction:** Lafayette Parish
- **Website:** [lafayettesheriff.com](https://www.lafayettesheriff.com/divisions/uniformed-patrol/crisis-intervention-team/)
- **Main Phone:** 337-232-9211
- **Crisis Unit:** Crisis Intervention Team (CIT)
- **Unit Description:** Operates a co-response model. Specially trained crisis intervention specialists respond alongside deputies to de-escalate behavioral health crises and divert from the correctional center when appropriate.
- **Evidence/Sources:** Officially confirmed via the LPSO website. Funded partially by a federal grant to enhance training and staffing.

### Lafayette Police Department
- **Jurisdiction:** City of Lafayette
- **Unit Description:** [Unknown] - No explicit confirmation of a dedicated co-responder unit matching LPSO's scale was found in this brief search, though individual officers likely have CIT training.

---

## 4. Mobile Crisis and Behavioral Health Providers

### The Ness Center
- **Service Area:** Acadiana / Region 4 (Acadia, Evangeline, Iberia, Lafayette, St. Landry, St. Martin, Vermilion).
- **Crisis Contact:** 337-417-9260 (Mon-Fri 8:30am - 5:00pm)
- **Services:** Mobile Crisis Response (MCR) for adults and youth. Stabilization in community settings.
- **Referral Path:** Dispatched via the Louisiana Crisis Hub or direct.
- **Source:** [Louisiana Crisis Hub](https://louisianacrisisconnect.org)

### Youth Mobile Crisis Response (The Extra Mile)
- **Service Area:** Region 4
- **Crisis Contact:** 337-362-8899 (24/7)
- **Services:** Youth-specific (ages 0-20) crisis stabilization.

---

## 5. Elderly and Vulnerable Adult Protection Resources

### Office of Aging and Adult Services (OAAS) - Region 4
- **Agency Name:** Louisiana Department of Health, OAAS
- **Scope:** Adult Protective Services (APS) for vulnerable adults ages 18-59. Also manages waiver programs.
- **Service Area:** Lafayette Parish and surrounding Region 4 parishes.
- **Contact:** 337-262-1635 (Local), 1-800-898-4910 (Abuse Reporting Hotline)
- **Location:** 128 Demanade Drive, Suite 104, Lafayette, LA

### Elderly Protective Services (EPS)
- **Scope:** Abuse, neglect, or exploitation reporting for adults 60+.
- **Contact:** 1-833-577-6532 (EPS direct) or the main 1-800-898-4910 hotline.

---

## 6. Existing Programs, Tools, and Partnerships

- **Co-Responder Models:** LPSO has an active co-responder model pairing specialists with uniformed deputies.
- **988 Integration:** Louisiana Crisis Hub integrates closely with 988 dispatch, though exact CAD/EMR technical integration with local law enforcement is [Unknown].
- **Statewide Hotline:** Elder and vulnerable adult protection heavily relies on a centralized state hotline (1-800-898-4910). Local coordination software is [Unknown].

---

## 7. Grant and Funding Opportunities

See the detailed `clarity_grant_opportunities_for_crisis_coordination.md` packet. Key recent grants include SAMHSA's SM-26-029 Mobile Crisis Team Partnerships and the BJA Justice and Mental Health Collaboration Program (JMHCP).

---

## 8. Clarity Fit Analysis

### Police / Sheriff Departments (e.g., LPSO)
- **Problem:** Officers need fast, secure capture of field facts and a reliable handoff path to mobile crisis or ERs without losing context.
- **Workflow:** Prescreen / Law Enforcement Handoff.
- **Data Governance Needs:** High. Must restrict custody details and criminal history from non-authorized civilian receivers.
- **Human Approval Required:** Always. Officers must explicitly choose to refer/hand-off.
- **Cannot be Automated:** The decision to divert from jail vs. transport to the ER.

### Mobile Crisis Agencies (e.g., The Ness Center)
- **Problem:** Teams arrive on scene blind if law enforcement cannot share prior interaction history or safety risks.
- **Workflow:** Mobile Crisis Triage.
- **Integrations Needed:** Needs a portal to receive structured prescreen packets from 911/CAD or law enforcement officers in the field.

### Elderly Protective Services / APS
- **Problem:** Mandated reporters (like ER nurses or police) often use a phone hotline and lack visibility into whether the state actually intervened.
- **Workflow:** Elder Protection / Case Management.
- **Data Governance Needs:** Extremely high. APS cases are highly confidential investigations.

---

## 9. Recommended CRM Data Model Additions

The `Special Units` tab added to our Apps Script CRM correctly captures the nuance that an agency (LPSO) is separate from its operational unit (CIT). We should ensure the backend Prisma `FacilityProfile` model can support this `Parent -> Unit -> Service Line` hierarchy.

---

## 10. Open Questions / Unknowns

- Does LPSO currently use a specific software vendor (like Julota or Bamboo Health) for their CIT data collection? [Unknown]
- Can Mobile Crisis units (like The Ness Center) accept digital packets from external EHRs, or do they only accept phone dispatch from the Louisiana Crisis Hub? [Unknown]

---

## 11. Source Index

1. **LPSO CIT:** [https://www.lafayettesheriff.com/divisions/uniformed-patrol/crisis-intervention-team/](https://www.lafayettesheriff.com/divisions/uniformed-patrol/crisis-intervention-team/)
2. **Louisiana Crisis Hub:** [https://louisianacrisisconnect.org](https://louisianacrisisconnect.org)
3. **OAAS Region 4:** [https://ldh.la.gov/page/280](https://ldh.la.gov/page/280)
4. **Louisiana Abuse Hotline:** [https://www.shreveportla.gov](https://www.shreveportla.gov) / [la.gov](https://la.gov)
