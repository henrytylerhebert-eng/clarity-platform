---
status: Parking lot - source-derived planning artifact
owner: Tyler / product owner
created: 2026-07-19
source_status: user-provided info dump plus current official regulatory reference anchors
implementation_status: Documented only
review_required:
  - requires operational review
  - requires clinical review
  - requires legal/compliance review
  - requires security/privacy review before any real data use
---

# Inpatient Behavioral Hospital Operations Parking Lot

This is a future-product reference for the Clarity inpatient behavioral-hospital operations piece. It preserves the bucketed org structure, role inventory, dashboard/KPI ideas, regulatory-compliance task scaffolding, and software-module implications from the July 19, 2026 parking-lot info dump.

This document is not an approved operating model, staffing model, compliance program, budget, or implementation authorization. It is a structured holding place for later roadmap work.

## Evidence Labels

- `source-derived`: captured from the user-provided info dump and attachments in this session.
- `reference-checked`: current official reference entry points were checked on 2026-07-19 for orientation only.
- `requires operational review`: role ownership, handoffs, staffing assumptions, data entry cadence, and dashboard usefulness need operator validation.
- `requires clinical review`: clinical responsibilities and KPI definitions need qualified clinical validation.
- `requires legal/compliance review`: Joint Commission, CMS, Louisiana Department of Health, HIPAA, EMTALA, credentialing, incident reporting, and record-retention requirements must be verified by qualified compliance/legal reviewers.
- `No measurements found`: no Clarity performance, staffing, budget, outcome, or ROI measurement exists for this parking-lot item.

## Source Inputs

User-provided source context:

- Current prompt: org hierarchy, roles, software modules, staffing annualized estimates, and department/KPI examples.
- `/Users/tylerhebert/.codex/attachments/22aa6b7a-6d25-4092-afcc-6036e2fe55c1/pasted-text.txt`
- `/Users/tylerhebert/.codex/attachments/ffb676ed-e0c5-4e3f-b261-d85f7374a102/pasted-text.txt`

Current official regulatory reference anchors checked on 2026-07-19:

- Louisiana Department of Health hospital standards entry point: <https://ldh.la.gov/health-standards-section/hospitals>
- Louisiana behavioral health service provider regulations PDF entry point: <https://ldh.la.gov/assets/medicaid/hss/docs/BHS/BHSP_regs_as_of_3-14-22.pdf>
- CMS psychiatric hospitals page: <https://www.cms.gov/medicare/health-safety-standards/certification-compliance/psychiatric-hospitals>
- CMS inpatient psychiatric facility CFR entry point: <https://www.cms.gov/medicare/payment/prospective-payment-systems/inpatient-psychiatric-facility/code-federal-regulations-related-inpatient-psychiatric-care>
- Joint Commission psychiatric hospital accreditation entry point: <https://www.jointcommission.org/en-us/accreditation/hospital/psychiatric-hospitals>

## Future Product Fit

This material belongs to Clarity's future inpatient operations and analytics layer, after the case spine, admission/episode, UR/authorization, audit, and governance foundations are ready.

Potential product surfaces:

- Operations command center by facility, department, shift, census, acuity, staffing, blockers, incidents, and compliance status.
- Department dashboards for executive, revenue, intake, personnel, cash flow, revenue cycle, administrative operations, quality/safety, clinical care, ancillary services, and vendors.
- Role-based task queues with daily data-entry points that can later roll up into KPIs.
- Compliance evidence workspace for policies, training, credentialing, incident tracking, audits, corrective actions, drills, infection-prevention monitoring, and record readiness.
- Vendor oversight workspace for outsourced pharmacy, laboratory, radiology, dietary, housekeeping, laundry, transportation, IT, and billing/coding services.

Non-goals for this parking-lot artifact:

- No production data model.
- No API or integration contract.
- No staffing recommendation.
- No salary validation.
- No compliance signoff.
- No autonomous clinical, legal, admission, discharge, placement, or payer decision.

## Software Module Map

| Module | Department fit | Candidate function | Review gate |
|---|---|---|---|
| EMR / clinical record integration | Intake, nursing, clinical, pharmacy, lab, radiology, quality | Patient demographics, assessments, treatment plan references, medication reconciliation, clinical documentation pointers | Requires clinical, legal/compliance, security review |
| Accounting / ERP integration | CFO, cash flow, AP, AR, revenue cycle | AP, AR, budgets, invoices, cash forecast, payment posting, department expense rollups | Requires finance and security review |
| CRM / referral management | Marketing, business development, community liaisons, intake | Referral sources, campaign activity, community outreach, lead/referral conversion, complaint/feedback routing | Requires privacy and operational review |
| Business intelligence | All departments | Department dashboards, KPI trends, exceptions, work queues, audit evidence, staff/service productivity views | Requires data-governance review |
| Staff training modules | HR, education, clinical educators, non-clinical educators, compliance | Training plans, competency evidence, annual requirements, policy acknowledgements, corrective training | Requires compliance and HR review |
| Regulatory compliance workspace | Compliance, risk, quality, infection prevention, emergency management, credentialing | Policy library, audit schedule, incident logs, corrective actions, survey readiness, credential files, drill evidence | Requires legal/compliance review |

## Master Wire Org

The source material contains both corporate-level roles and local hospital operating roles. Future modeling should decide whether each role is corporate shared service, facility staff, outsourced vendor, or hybrid.

### Executive C-Suite

| Position | Job description | Core responsibilities | Five KPI data entry points | Candidate compliance tasks |
|---|---|---|---|---|
| CEO | Accountable executive for strategy, culture, financial performance, and enterprise governance. | Set enterprise goals; lead executive team; approve strategic priorities; oversee financial/operational performance; ensure governance accountability. | Monthly revenue; operating margin; executive action-item closure; employee retention; patient/family satisfaction trend. | Maintain board/governance reporting; ensure compliance program resourcing; review enterprise risk register; approve corrective-action oversight; ensure mandatory training accountability. |
| COO | Senior operating executive for day-to-day hospital and enterprise operations. | Coordinate operating departments; manage resource allocation; monitor throughput and bottlenecks; enforce operating cadence; align budgets with operational priorities. | Census vs staffed capacity; overtime hours; operational costs vs budget; project/on-time completion; unresolved operational blockers. | Monitor operations policy adherence; maintain operational audit schedule; track corrective actions; ensure emergency/continuity readiness; escalate regulatory operating risks. |
| CMO - Medical | Senior physician leader for medical governance and clinical quality. | Lead medical staff standards; oversee clinical policy; guide quality-of-care expectations; supervise physician performance processes; advise on patient safety concerns. | Clinical outcome trend; medical staff review completion; adverse event reviews; guideline adherence; patient safety incident rate. | Maintain medical staff bylaws alignment; support credentialing/privileging review; oversee peer review process; review sentinel/adverse events; approve clinical policy changes with compliance review. |
| CFO | Senior financial executive for financial health, reporting, and revenue/cost controls. | Manage financial planning; oversee cash position; supervise revenue-cycle financial controls; monitor risks/opportunities; report financial performance. | Cash on hand; revenue growth; margin; days in AR; budget variance. | Ensure financial controls; oversee billing/coding compliance reporting; review payer/audit exposure; maintain financial record retention; support fraud/waste/abuse controls. |
| CNO | Senior nursing executive for nursing practice, staffing, and patient-care operations. | Oversee nursing services; manage nursing policy; monitor nursing staffing and acuity; supervise nurse leadership; drive nursing quality improvement. | Nurse staffing variance; medication administration exceptions; restraint/seclusion review count if applicable; nursing satisfaction; nursing quality audit score. | Validate nursing competency evidence; review nursing policy adherence; monitor required documentation; support infection/safety compliance; escalate unsafe staffing risks. |
| CIO | Senior technology executive for systems, security posture, data reliability, and IT service. | Manage IT strategy; maintain infrastructure; coordinate system uptime; oversee cybersecurity program; support reporting/data availability. | System uptime; helpdesk resolution time; cybersecurity events; access review completion; IT budget variance. | Maintain HIPAA/security controls; coordinate access reviews; document incident response; oversee vendor/security review; maintain system audit/logging evidence. |
| CHRO | Senior HR executive for workforce, culture, recruitment, retention, and employee relations. | Lead hiring/retention; manage employee relations; oversee HR policy; support workforce planning; coordinate HR compliance. | Turnover; time-to-fill; training completion; employee relations case closure; vacancy rate. | Maintain personnel files; track mandatory training; ensure background/licensure checks by policy; manage workplace investigations; support labor/employment compliance. |
| CQO | Senior quality executive for quality management and continuous improvement. | Oversee quality program; coordinate performance improvement; supervise quality metrics; align departments on improvement priorities; report quality risks. | Quality project completion; patient safety incidents; audit findings open; outcome metric trend; corrective-action closure. | Maintain QAPI evidence; coordinate survey readiness; track quality audits; document corrective actions; escalate unresolved quality risks. |
| CLO | Senior legal executive or counsel lead for legal risk and regulatory interpretation. | Provide legal guidance; manage litigation/contracts; advise on regulatory risk; review governance questions; coordinate external counsel. | Legal matters open; contract review cycle time; litigation exposure trend; compliance review requests; legal spend vs budget. | Review legal/regulatory interpretations; advise on incident disclosures; oversee contract compliance; guide retention/e-discovery; support board/legal risk reporting. |
| Chief Marketing Officer | Enterprise marketing leader for referral growth, brand position, and market intelligence. | Build marketing strategy; manage campaign performance; support business development; monitor referral market; oversee brand/reputation. | Referral volume; campaign ROI; referral-source engagement; market share estimate; reputation/feedback trend. | Ensure compliant marketing claims; review privacy boundaries; maintain outreach documentation; monitor complaint routing; coordinate referral-source policy adherence. |

### Revenue: Marketing And Business Development

| Position | Job description | Core responsibilities | Five KPI data entry points | Candidate compliance tasks |
|---|---|---|---|---|
| Business Development Director | Owns referral growth, partner relationships, and business-development execution. | Develop referral strategy; manage community liaison team; identify growth opportunities; maintain partner relationships; coordinate handoff to intake. | New referrals by source; active referral-source touches; referral-to-admission conversion; campaign/outreach cost; partnership pipeline status. | Use compliant outreach language; document referral-source interactions; avoid inducement/privacy issues; route complaints appropriately; maintain approved materials log. |
| Community Liaisons | Field-facing relationship builders for referral sources and community partners. | Visit referral sources; educate community on services; capture partner needs; communicate availability/process; route leads/referrals to intake. | Outreach visits; referral-source follow-ups; events attended; qualified referrals generated; source satisfaction. | Use approved education materials; document contacts; protect patient privacy; escalate unsafe/inappropriate referral requests; complete annual compliance training. |

### Intake

| Position | Job description | Core responsibilities | Five KPI data entry points | Candidate compliance tasks |
|---|---|---|---|---|
| Lead RN | Clinical intake lead responsible for intake flow, initial clinical triage, and intake quality. | Oversee intake queue; review referral completeness; coordinate initial assessment; assign intake work; escalate clinical/legal blockers. | Referral response time; intake completion time; missing-document count; handoff accuracy; abandoned/declined referral reason. | Ensure intake documentation completeness; follow legal-status policy; route medical clearance gaps; protect PHI; maintain triage escalation evidence. |
| LPN Nurses | Intake nursing staff supporting referral intake and initial assessment under appropriate supervision. | Gather referral facts; assist screening; coordinate with RN/clinical staff; document intake details; communicate status updates. | Intake records completed; assessment data completeness; callbacks completed; errors corrected; escalation count. | Work within scope; follow documentation policy; protect PHI; document supervisor review where required; complete competency/training requirements. |
| Secretaries | Administrative intake support for scheduling, records, communication, and queue hygiene. | Manage calls; schedule assessments; collect administrative data; maintain intake records; route messages/tasks. | Calls answered; records attached; scheduling cycle time; data-entry error count; pending administrative tasks. | Follow privacy/minimum-necessary practices; maintain record-handling procedure; use approved scripts; track releases/authorizations where required; complete compliance training. |
| Case Managers | Intake follow-up and referral coordination staff connecting patients/referral sources to appropriate next steps. | Follow referral status; coordinate collateral; communicate with referral sources; help route non-accepted referrals; support discharge/transfer continuity where assigned. | Follow-up tasks closed; collateral received; referral resolution time; alternate placement/referral actions; communication attempts documented. | Protect PHI; document referral decisions and reasons; maintain handoff records; avoid unauthorized placement decisions; escalate clinical/legal concerns. |

### Personnel

| Position | Job description | Core responsibilities | Five KPI data entry points | Candidate compliance tasks |
|---|---|---|---|---|
| Director of Administrative Services | Leader for administrative services, back-office coordination, and facility support functions. | Manage administrative workflows; supervise support teams; coordinate HR/finance/IT/housekeeping touchpoints; monitor service quality; support executive reporting. | Administrative task backlog; service request cycle time; budget variance; department audit score; staff vacancy count. | Maintain administrative policies; track required records; coordinate privacy/security procedures; monitor vendor documentation; support corrective actions. |
| Director of Education and Training | Owner of staff education, onboarding, recurring training, and competency programs. | Design training plans; manage annual education calendar; coordinate instructors; track completions; update training based on incidents/audits. | Training completion; overdue competencies; post-test scores; new-hire onboarding completion; corrective training assignments. | Maintain training evidence; align education with regulatory requirements; track policy acknowledgements; document competency validation; support survey-readiness files. |
| Clinical Educators | Clinical training staff for nursing, clinical, safety, and patient-care competencies. | Deliver clinical education; assess competencies; support onboarding; update clinical training materials; reinforce practice standards. | Clinical competency completion; simulation/checkoff pass rate; remediation count; training attendance; post-training quality indicator trend. | Validate scope-specific competencies; document attendance; maintain clinical policy alignment; escalate unsafe practice gaps; support infection/safety training requirements. |
| Non-Clinical Educators | Training staff for administrative, environmental, service, safety, and non-clinical workflows. | Deliver non-clinical training; manage safety/service modules; support onboarding; document completion; update materials. | Required module completion; test score; overdue training; service-error trend; new-hire training completion. | Maintain training records; coordinate privacy/security training; document environment-of-care training; manage policy attestations; support corrective training. |
| Credentialing Coordinator | Staff owner for licensed/certified staff credential verification and file maintenance. | Verify credentials; maintain licensure files; track expirations; coordinate renewals; support audit/survey requests. | Credentials verified; expiring credentials; missing file elements; verification cycle time; audit exceptions. | Maintain credentialing files; verify licensure/certification per policy; track background/OIG/exclusion checks where required; escalate expired credentials; support privileging records. |
| Medical Staff Services Coordinator | Coordinator for medical staff files, bylaws/processes, meetings, and privileging support. | Manage medical staff appointments; support credentialing/privileging; coordinate medical staff meetings; track bylaws requirements; maintain provider files. | Appointment/reappointment status; privilege file completeness; meeting minutes completed; peer-review items tracked; expiring documents. | Maintain medical staff records; follow bylaws; support peer-review confidentiality; document privilege approvals; prepare survey evidence. |

### Cash And Cash Flow

| Position | Job description | Core responsibilities | Five KPI data entry points | Candidate compliance tasks |
|---|---|---|---|---|
| Billing | Billing function responsible for claim preparation and billing output. | Prepare bills/claims; verify charge accuracy; coordinate with coding and AR; correct billing errors; report billing status. | Claims submitted; clean claim rate; billing error count; days to bill; billed charges. | Follow billing rules; document corrections; monitor claim compliance; protect PHI; support audits and refund workflows. |
| Accounts Payable | Finance staff responsible for vendor invoices, payment timing, and expense controls. | Process invoices; verify approvals; schedule payments; reconcile vendor statements; support cash forecasting. | Invoices processed; payment cycle time; late payment count; cash forecast accuracy; vendor dispute count. | Maintain approval controls; retain invoice records; support anti-fraud controls; follow vendor/payment policy; document exceptions. |
| Accounts Receivable | Finance staff responsible for receivables, collections, and cash application coordination. | Monitor outstanding balances; follow up on unpaid accounts; coordinate payment posting; reconcile AR; report collection performance. | Days in AR; cash collected; aging balance; follow-ups completed; write-off/adjustment requests. | Follow collection rules; document payment activity; protect patient financial data; manage adjustment approvals; support audit trails. |
| Medical Coding | Coding staff responsible for accurate code assignment and documentation alignment. | Review clinical documentation; assign codes; query providers where appropriate; support claim accuracy; monitor coding trends. | Coding accuracy; charts coded; query rate; denials tied to coding; revenue per encounter. | Follow coding guidelines; document queries; monitor upcoding/downcoding risk; maintain coding credentials/training; support payer audits. |

### Revenue Cycle Department Org Chart

| Position | Job description | Core responsibilities | Five KPI data entry points | Candidate compliance tasks |
|---|---|---|---|---|
| Director of Revenue Cycle Management | Senior revenue-cycle leader accountable for end-to-end revenue operations. | Manage RCM strategy; supervise revenue-cycle teams; monitor cash/denials; coordinate with CFO; drive process improvement. | Net collection rate; days in AR; denial rate; clean claim rate; cash collected. | Maintain RCM compliance program; monitor payer audit risk; ensure billing/coding training; approve corrective actions; report material revenue-cycle risk. |
| Revenue Cycle Manager | Operational manager for daily revenue-cycle work queues and staff execution. | Manage RCM staff; assign work queues; track aging/denials; resolve bottlenecks; report performance. | Work queue volume; claim cycle time; denial inventory; staff productivity; unresolved escalations. | Enforce billing/coding policies; document exceptions; track staff compliance training; support audit requests; escalate compliance concerns. |
| Billing Supervisor | Supervisor for billing specialists and claim submission quality. | Supervise billing output; review claim errors; manage daily assignments; coordinate corrections; train billing staff. | Claims submitted; billing edits resolved; claim rejection rate; staff productivity; correction turnaround. | Monitor billing compliance; document correction reasons; train staff; maintain audit evidence; escalate recurring errors. |
| Billing Specialists | Staff who prepare, submit, and correct claims. | Enter claim details; submit claims; resolve edits; coordinate missing information; document billing activity. | Claims processed; rejection count; correction time; missing-info tasks; clean claim contribution. | Follow payer/billing rules; protect PHI; document corrections; complete required training; report suspected billing issues. |
| Collections Supervisor | Supervisor for collections strategy and collections staff. | Manage collection work queues; prioritize aging accounts; monitor contacts; coordinate escalations; report collection performance. | Cash collected; aging reduction; accounts touched; payment plans established; escalation backlog. | Follow fair collection and privacy rules; document contacts; approve adjustments by policy; monitor staff conduct; maintain audit trail. |
| Collections Specialists | Staff responsible for payer/patient follow-up on outstanding balances. | Contact payers/patients as permitted; document follow-up; resolve unpaid accounts; coordinate payment plans; escalate disputes. | Follow-ups completed; dollars collected; accounts resolved; average aging; dispute count. | Follow collection/privacy policies; document all contacts; avoid unauthorized disclosures; route disputes; complete compliance training. |
| Claims Supervisor | Supervisor for claims specialists and claim-status resolution. | Manage claim status queues; track payer responses; coordinate resubmissions; train claims staff; report trends. | Claim backlog; payer response time; resubmission count; unresolved claim issues; staff productivity. | Monitor claims compliance; document payer communications; maintain audit trail; support appeal/denial policies; escalate abnormal patterns. |
| Claims Specialists | Staff who manage claim status, payer follow-up, and claim resolution. | Check claim status; respond to payer requests; submit corrections; coordinate supporting documents; document outcomes. | Claims worked; payer requests resolved; correction cycle time; paid claims; unresolved claim reasons. | Protect PHI; follow payer submission rules; document corrections; maintain supporting records; complete training. |
| Charge Entry Specialist | Staff responsible for timely and accurate charge entry. | Enter charges; reconcile charge sources; validate missing charges; correct charge errors; coordinate with clinical/finance teams. | Charges entered; charge lag; missing charge count; correction count; revenue captured. | Follow charge-entry policies; maintain audit trail; monitor duplicate/incorrect charges; document corrections; support billing compliance. |
| Payment Posting Specialist | Staff responsible for accurate payment posting and reconciliation. | Post payments; reconcile remittances; identify underpayments; coordinate adjustments; report posting issues. | Payments posted; posting lag; unmatched payments; underpayment flags; reconciliation variance. | Follow payment posting controls; document adjustments; protect financial data; retain remittance evidence; escalate overpayment/refund issues. |
| Denials and Appeals Specialist | Staff responsible for denial analysis, appeal submission, and overturn tracking. | Review denials; prepare appeals; gather support; monitor deadlines; report denial root causes. | Denials received; appeal submission time; overturn rate; denial reason trend; dollars recovered. | Follow appeal deadlines; maintain appeal evidence; protect PHI; document medical/administrative support; escalate systemic compliance issues. |

### Expenses / Administrative / Operational Management

| Position | Job description | Core responsibilities | Five KPI data entry points | Candidate compliance tasks |
|---|---|---|---|---|
| Executive Director / Administrator | Local hospital operating leader accountable for facility performance, safety, compliance, and department coordination. | Lead local operations; coordinate department heads; monitor census/staffing/quality; manage budget; report to corporate leadership. | Census; staffed-bed availability; expense variance; open compliance findings; patient/family complaint trend. | Maintain facility license readiness; track corrective actions; ensure survey readiness; oversee emergency preparedness; report material risks. |
| Administrative Staff Personnel | Local administrative support for records, communications, scheduling, supply requests, and department operations. | Support department workflows; manage documents; coordinate meetings; route requests; maintain administrative records. | Tasks completed; document turnaround; scheduling accuracy; service requests; error/rework count. | Protect PHI/PII; follow record retention; use approved communications; complete training; escalate compliance issues. |
| Health Information / Medical Records Staff | Staff responsible for medical-record quality, releases, file completeness, and HIM workflows. | Maintain records; support release-of-information; audit chart completeness; coordinate corrections; respond to record requests. | Chart completion rate; delinquent records; release turnaround; documentation deficiencies; correction requests. | Follow HIPAA/privacy policy; maintain release logs; support retention requirements; protect records; track audit readiness. |
| Compliance Officer | Compliance program owner for laws, regulations, accreditation standards, and internal policy adherence. | Develop compliance program; monitor compliance activity; investigate concerns; coordinate audits; report violations/risks. | Compliance audit completion; findings open; hotline/reports received; corrective actions closed; training completion. | Maintain compliance plan; manage investigations; coordinate reporting; update policies; prepare survey/accreditation evidence. |
| Privacy Officer | Privacy lead for HIPAA/privacy practices, breach response, and access/disclosure controls. | Monitor privacy practices; investigate breaches; manage privacy policies; train workforce; oversee disclosures. | Privacy incidents; access-review exceptions; release requests; breach investigation time; privacy training completion. | Maintain HIPAA policies; document breach assessment; manage minimum-necessary controls; audit access logs; oversee disclosure accounting. |
| Risk Manager | Leader for enterprise/local risk identification, incident analysis, and risk mitigation. | Analyze incidents; manage risk register; coordinate claims/loss prevention; support root-cause analysis; track mitigation plans. | Incidents reported; high-risk items open; RCA completion; claims/loss events; mitigation closure. | Maintain incident reporting process; coordinate adverse-event reviews; protect peer-review materials; track corrective actions; escalate reportable risks. |
| Quality Improvement Coordinator | Coordinator for QAPI projects, quality data collection, and improvement activities. | Gather quality data; run improvement projects; analyze trends; document interventions; report outcomes. | QI projects active; measures collected; improvement actions completed; audit scores; outcome trend. | Maintain QAPI documentation; validate data definitions; track corrective actions; support survey evidence; escalate quality failures. |
| Infection Preventionist | Infection-prevention lead for surveillance, outbreak response, education, and infection-control practices. | Monitor infection trends; implement prevention policy; educate staff; investigate outbreaks; coordinate environmental/clinical controls. | Infection rate; hand hygiene audits; isolation/prevention actions; outbreak investigations; staff training completion. | Maintain infection-control plan; document surveillance; report as required; track cleaning/PPE compliance; coordinate policy review. |
| Director of Quality and Safety | Senior leader for quality, patient safety, risk reduction, and safety culture. | Lead safety program; supervise quality/safety staff; review events; monitor high-risk processes; coordinate safety initiatives. | Safety events; serious event reviews; safety rounds completed; open action plans; patient safety culture results. | Maintain safety program evidence; coordinate sentinel/adverse event response; track corrective actions; support accreditation readiness; ensure leadership reporting. |
| Quality Improvement Specialists | Staff supporting data analysis, chart audits, process improvement, and intervention tracking. | Conduct audits; analyze measures; support QI projects; document results; monitor action plans. | Audits completed; findings by type; action items closed; measure refreshes; improvement effect. | Follow data definitions; maintain audit records; protect patient data; support QAPI evidence; escalate unreliable data. |
| Patient Safety Specialists | Staff focused on patient-safety surveillance, event follow-up, and mitigation. | Review safety reports; track hazards; support RCA; coordinate rounding; educate staff on safety practices. | Safety reports reviewed; hazards identified; RCA tasks closed; falls/medication events; rounding observations. | Maintain event documentation; support required reporting; protect peer-review confidentiality; track mitigation; verify safety training. |
| Emergency Management Coordinator | Owner of emergency management plan, drills, readiness, and coordination with external responders. | Maintain emergency plan; conduct drills; train staff; coordinate supplies/communications; update after-action plans. | Drills completed; staff participation; after-action items; emergency supplies status; plan review date. | Maintain emergency plan evidence; document drills; coordinate community response contacts; track corrective actions; ensure training records. |
| Director of Ancillary Services | Optional local leader for environment of care, transportation, supply chain, and other support services. | Coordinate ancillary departments; maintain service quality; manage ancillary staffing/vendors; oversee environment/transport/supply performance; report support-service risks. | Environment-of-care findings; transport satisfaction; maintenance completion; inventory accuracy; supply cost variance. | Maintain ancillary policies; monitor environment-of-care requirements; document service audits; oversee vendor compliance; track corrective actions. |
| Environment of Care Coordinator | Staff owner for safe, clean, maintained physical environment and facility readiness. | Coordinate maintenance; monitor fire/life safety; support infection control; manage environmental rounds; track repairs. | Rounds completed; work orders closed; safety findings; cleaning audit results; equipment inspection status. | Maintain environment-of-care documentation; track fire/life-safety drills; monitor cleaning/infection-control evidence; coordinate inspections; escalate hazards. |
| Transportation Coordinator | Coordinator for patient transportation logistics, vehicle readiness, and transport vendor/staff oversight. | Schedule transports; coordinate patient/family/referral needs; monitor vehicle readiness; document delays; manage transport staff/vendors. | Transport on-time rate; delays; vehicle inspection status; transport incidents; satisfaction/complaints. | Protect privacy during transports; maintain vehicle/staff documentation; document incidents; follow elopement/safety protocols; manage vendor requirements. |
| Supply Chain Management Coordinator | Inventory/procurement lead for supplies, equipment, and supply cost control. | Manage inventory; procure supplies; coordinate storage/distribution; prevent stockouts; monitor budget. | Inventory accuracy; stockout count; supply spend; order cycle time; expired/wasted supplies. | Maintain purchasing controls; track regulated supplies; document recalls; coordinate storage requirements; support audit evidence. |

### Clinical

| Position | Job description | Core responsibilities | Five KPI data entry points | Candidate compliance tasks |
|---|---|---|---|---|
| Medical Director | Local physician leader for clinical practice, medical staff oversight, and patient-care standards. | Supervise medical care standards; support policy; review complex cases; oversee physician coverage; coordinate with CMO/administrator. | Medical review completion; physician response time; clinical policy exceptions; adverse-event review participation; patient outcome trend. | Maintain medical staff oversight; support active-treatment documentation review; participate in peer review; ensure clinical policy alignment; escalate patient-safety issues. |
| Director of Nursing | Local nursing leader for nursing staff, nursing care delivery, staffing, and policy adherence. | Manage nursing staff; oversee scheduling; enforce nursing procedures; monitor care quality; coordinate with medical/clinical leadership. | Staffing ratio/variance; overtime; nursing audit score; medication/documentation errors; turnover. | Maintain nurse competency files; monitor documentation requirements; ensure incident escalation; track restraint/seclusion policy evidence if applicable; support survey readiness. |
| Nurse Manager | Unit-level nursing manager for daily unit operations and staff supervision. | Assign staff; monitor patient-care flow; coordinate shift handoff; respond to unit issues; coach nursing/direct-care staff. | Shift staffing; handoff completion; unit incidents; charting completion; callouts/overtime. | Verify shift documentation; ensure policy adherence; document incident response; monitor safety checks; track staff competency gaps. |
| Registered Nurses | Licensed nursing staff providing direct care, assessment, medication administration, education, and supervision. | Assess patients; administer medications; document care; educate patients/families; supervise LPN/MHT/CNA tasks as appropriate. | Assessments completed; medication exceptions; charting timeliness; patient education documented; safety-check variance. | Practice within RN scope; document assessments/interventions; follow medication policy; escalate changes in condition; complete competencies. |
| Licensed Practical Nurses | Licensed nursing staff providing direct patient care under required supervision. | Provide nursing care; collect patient data; administer permitted medications/treatments; document care; communicate changes. | Assigned tasks completed; documentation timeliness; medication/treatment exceptions; escalation count; competency completion. | Work within LPN scope; document supervisor communication; follow medication/treatment policy; protect PHI; complete competencies. |
| Mental Health Technicians / Certified Nursing Assistants | Direct-care staff supporting safety observation, activities of daily living, milieu support, and patient-status reporting. | Monitor behavior/location/mood; assist ADLs; record vitals where assigned; complete Q15 or observation documentation if applicable; report changes to nursing. | Observation checks completed; missed/late checks; ADL support tasks; incident reports; vitals/mood entries. | Follow observation policy; document accurately; escalate status changes; maintain boundaries/privacy; complete safety/de-escalation training. |
| Clinical Director | Leader for therapy/clinical programming, clinical staff supervision, and treatment programming quality. | Manage therapists/social workers/counselors; oversee groups/therapy programming; coordinate treatment planning; monitor clinical documentation; support outcomes. | Group/therapy sessions delivered; treatment plan completion; documentation timeliness; clinical staff productivity; patient engagement. | Ensure licensed staff practice within scope; maintain treatment-plan documentation; support clinical supervision records; track required programming; escalate risk concerns. |
| Social Workers | Clinical/support staff helping patients and families with psychosocial needs, resources, discharge planning, and advocacy. | Complete psychosocial work; coordinate family/resources; support discharge planning; participate in treatment teams; document interventions. | Assessments completed; discharge tasks closed; family contacts; resource referrals; documentation timeliness. | Protect privacy; document consent/contacts; follow mandated reporting/escalation policy; maintain licensure/supervision evidence; coordinate safe discharge requirements. |
| Counselors | Clinical staff providing individual/group counseling, coping-skills support, and recovery-oriented interventions. | Facilitate therapy/groups; document interventions; support treatment goals; coordinate with treatment team; monitor patient response. | Sessions delivered; attendance; progress-note timeliness; goal progress entries; patient feedback. | Practice within license/scope; maintain documentation standards; escalate safety concerns; complete competencies; protect confidentiality. |
| Director of Rehabilitation Services | Optional service leader for rehabilitation/therapeutic activity services and functional recovery programming. | Manage rehab services; coordinate therapeutic activities; supervise rehab staff/vendors; document patient participation; report functional outcomes. | Rehab sessions delivered; attendance; functional-goal progress; missed sessions; patient satisfaction. | Maintain therapy documentation; verify staff credentials; align programming with treatment plan; document refusals/contraindications; support survey evidence. |

### Outsourced Vendors And Contracted Services

| Position / vendor role | Job description | Core responsibilities | Five KPI data entry points | Candidate compliance tasks |
|---|---|---|---|---|
| Pharmacists | Contract or staff pharmacy professionals responsible for medication review, dispensing oversight, medication therapy management, and drug information. | Review medication orders; manage formulary/utilization input; support medication reconciliation; consult on adverse effects/interactions; educate staff. | Order review turnaround; intervention count; medication reconciliation completion; adverse drug event review; inventory/formulary exceptions. | Maintain pharmacy licensure evidence; follow medication management standards; support controlled-substance controls; document consultations; participate in medication-safety review. |
| Pharmacy Technicians | Pharmacy support staff assisting medication ordering, preparation, dispensing support, inventory, and delivery under pharmacist supervision. | Support medication distribution; manage inventory; prepare medication batches where permitted; deliver medications; document stock issues. | Deliveries on time; inventory accuracy; stockouts; dispensing-support errors; expired medication removed. | Work under required supervision; follow medication storage/security policy; document inventory actions; maintain competency; escalate discrepancies. |
| Laboratory Technicians | Contract or staff lab personnel supporting sample collection, diagnostic testing, and result communication. | Collect/process specimens; perform/coordinate tests; report results; maintain lab equipment; support clinical follow-up. | Specimens processed; result turnaround; rejected specimens; critical result notifications; equipment QC status. | Maintain lab credential/equipment records; follow specimen handling policy; protect PHI; document critical-result communication; support CLIA/vendor compliance review. |
| Radiology Technicians | Contract or staff imaging personnel performing diagnostic imaging and equipment operation. | Perform imaging studies; maintain equipment; document studies; communicate results workflow; coordinate patient transport/safety. | Studies completed; turnaround time; repeat image rate; equipment downtime; safety incidents. | Maintain licensure/equipment records; follow radiation/imaging safety policy; protect PHI; document critical communication; manage vendor compliance evidence. |
| Billing and Coding Vendors | Outsourced revenue-cycle vendors supporting coding, billing, claims, and denial workflows. | Process assigned claims/coding; report performance; coordinate corrections; maintain secure data exchange; support audits. | Claims handled; coding accuracy; denial rate; turnaround time; audit findings. | Maintain BAA/security review; follow coding/billing policy; document corrections; support audit requests; report compliance issues. |
| Food and Dietary Services | Vendor or department providing nutrition, meals, and dietary accommodations. | Plan meals; deliver meals; manage special diets; monitor meal service quality; coordinate with clinical orders. | Meals served; special diet accuracy; late/missed meals; satisfaction/complaints; food-safety audit results. | Follow food-safety requirements; document diet orders/accommodations; maintain staff/vendor training; track sanitation; report incidents. |
| Housekeeping and Maintenance | Vendor or department keeping spaces clean, safe, repaired, and functional. | Clean patient/staff areas; complete repairs; support infection prevention; maintain equipment; document service requests. | Cleaning rounds; work orders closed; infection-control audit score; maintenance backlog; safety findings. | Follow environment-of-care policy; maintain cleaning logs; support infection-control requirements; document hazardous issues; manage vendor training evidence. |
| Laundry Services | Vendor or department managing linens, textiles, cleaning, and replacement. | Collect/process linens; maintain clean supply; manage linen inventory; address contamination concerns; report shortages. | Linen turnaround; shortages; infection-control exceptions; damaged/lost linen; delivery accuracy. | Follow infection-control handling; document contaminated linen process; maintain vendor records; track cleaning standards; report supply failures. |
| IT Services Vendors | Outsourced technical service providers for networks, helpdesk, software, security, or infrastructure. | Provide support; maintain systems; resolve tickets; monitor security; coordinate changes. | Ticket resolution; uptime; security findings; change success rate; access exceptions. | Maintain BAA/security review if PHI access; document access; follow change controls; report incidents; support audit/log retention. |
| Transportation Services Vendors | Outsourced patient transportation providers. | Coordinate transports; maintain vehicles/staff; document trips; communicate delays; support patient safety. | Trips completed; on-time rate; delay reasons; incidents; vehicle/staff compliance status. | Maintain vendor credentials; protect privacy; follow safety/elopement procedures; document incidents; verify vehicle/staff requirements. |

## Candidate Department Dashboards

| Dashboard | Primary users | Candidate widgets | Data boundary |
|---|---|---|---|
| Executive Command Center | CEO, COO, CFO, CMO, CNO, CQO, ED | Census, staffed capacity, financial trend, quality/safety exceptions, compliance findings, referral/admission funnel, unresolved risks | Aggregated/de-identified where possible; role-gated |
| Revenue / CRM | CMO-marketing, Business Development Director, Community Liaisons | Referral sources, outreach touches, conversion, campaign activity, feedback/complaints, community events | No PHI in marketing views unless approved and necessary |
| Intake | Lead RN, intake nurses, secretaries, case managers | Referral queue, response time, missing documents, authorization/benefits readiness, acceptance/decline reasons, handoff tasks | PHI-sensitive; requires access controls |
| Personnel / Training | CHRO, education directors, educators, credentialing, MSS | Training completion, competencies, credential expirations, onboarding status, policy acknowledgements | Staff PII-sensitive |
| Cash Flow / RCM | CFO, RCM director/manager, billing/coding/collections/claims | AR aging, clean claims, denials, collections, charge lag, payment posting, cash forecast | Financial/PHI-sensitive |
| Quality / Safety / Compliance | CQO, compliance, risk, QI, infection prevention, patient safety | Incidents, audits, corrective actions, infection trends, safety rounds, emergency drills, policy reviews | Sensitive peer-review/compliance data |
| Clinical Operations | CMO, CNO, Medical Director, DON, unit managers, clinical director | Census/acuity, staffing, documentation, safety checks, treatment programming, incidents, medication exceptions | PHI-sensitive; clinical-review gated |
| Ancillary / Vendor Oversight | ED, ancillary director, environment, transport, supply chain, vendor owners | Work orders, inventory, transport status, vendor SLAs, pharmacy/lab/radiology turnaround, dietary/housekeeping/laundry metrics | Contract/vendor and PHI-sensitive depending on service |

## Staffing And Expense Notes

The source prompt includes monthly staffing expense estimates for many roles, including CEO, C-suite roles, revenue/business development, intake, personnel, revenue cycle, administrative/operational management, clinical staffing, and vendors.

Current status:

- `source-derived`: the figures are preserved as source context in the prompt.
- `No measurements found`: no validated Clarity budget model, market compensation study, benefits-load assumption, census model, productivity model, or facility-specific labor model has been verified.
- `requires finance/operational review`: future budget modeling should separate salary, benefits, PRN/agency labor, overtime, vendor contracts, taxes, insurance, software, facilities, and compliance costs.

## Duplicate / Merge Questions For Later

| Question | Why it matters | Current handling |
|---|---|---|
| Is CMO medical separate from Chief Marketing Officer? | The source uses CMO for both Chief Medical Officer and Chief Marketing Officer. | Keep both roles named explicitly until product owner resolves title model. |
| Are corporate central intake and local hospital intake separate? | Dashboards, staffing, permissions, and ownership differ. | Preserve both as candidate structures; do not merge yet. |
| Is revenue cycle a shared corporate service or facility department? | Affects hierarchy, costs, access, and reporting. | Model as CFO-owned service with future local/corporate dimension. |
| Are pharmacy, lab, radiology, dietary, housekeeping, laundry, IT, transport outsourced or mixed? | Vendor oversight and compliance files differ from employee workflows. | Treat as vendor-capable roles with contract oversight fields. |
| Is this a 100-bed reference model or scalable template? | Staffing and dashboard baselines depend on bed count and acuity. | Preserve 100-bed source note as source-derived; do not generalize without review. |

## Future Build Readiness Checklist

Before this parking-lot item can move into planned/build-ready work:

- Product owner selects the first operations slice.
- Operational owner validates role hierarchy, department ownership, and shift/day data-entry cadence.
- Compliance/legal reviewer validates regulatory source obligations and survey/accreditation evidence needs.
- Clinical reviewer validates clinical role tasks and patient-safety metrics.
- Security/privacy reviewer validates PHI/PII boundaries, access roles, audit logging, and vendor-data flows.
- Technical owner decides whether this is a BI projection, operational task system, compliance evidence repository, or integrated product layer.
- Data definitions are separated into source facts, normalized operations events, interpreted KPI metrics, and simulation/forecast output.
- Synthetic-only fixtures are created before any prototype work.
- Acceptance criteria and tests are defined for the first slice.

## Platform Fit Analysis

### Bottom Line

Best use: treat this material as an inpatient operations ontology and metric catalog that can later configure Clarity's organization, location, service-line, personnel, role, compliance-evidence, and dashboard projections.

Do not treat it as a single module to build. The source dump spans several platform layers, and each layer has a different readiness gate.

### Where It Fits Best

| Rank | Platform use | Why it fits | Current status |
|---|---|---|---|
| 1 | Organization, location, department, role, and reporting hierarchy registry | The strongest signal in the source is "who exists, who reports to whom, and what each role owns." This complements the Directory CRM concept of parent organizations, locations, service lines, personnel, role assignments, and workflow permissions. | Best near-term design use; documented only for this slice. |
| 2 | Operations event vocabulary | The KPI data-entry points imply daily source events: staffing variance, referral response, documentation gap, incident, audit finding, credential expiration, transport delay, vendor SLA miss, denial, cash posting, and maintenance blocker. These should become source events before dashboards. | Candidate future domain design; not implemented. |
| 3 | Read-only operations command-center projections | The department dashboards map well to Clarity's command-center pattern: show exceptions, owners, status, source lineage, and unresolved blockers without pretending the dashboard is canonical truth. | Good synthetic prototype candidate after event definitions. |
| 4 | Compliance evidence workspace | The repeated compliance tasks are useful as categories for policy, training, audit, corrective action, credential, drill, incident, vendor file, and survey-readiness evidence. | Requires legal/compliance review before build. |
| 5 | Training, onboarding, and competency module expansion | Personnel, educator, credentialing, medical staff services, nursing, clinical, and direct-care rows map naturally to role-specific onboarding, competency evidence, and annual training queues. | Fits existing Training & SOP direction; requires operations/clinical review. |
| 6 | Vendor oversight and ancillary service registry | Pharmacy, lab, radiology, dietary, housekeeping, laundry, IT, transport, and billing vendors can be modeled as contracted service lines with file, SLA, incident, and compliance evidence. | Useful later; requires vendor/security review. |
| 7 | Finance and revenue-cycle analytics | Billing, coding, AR, AP, claims, collections, denials, appeals, charge entry, and payment posting are strong candidates for financial work queues and KPI dashboards. | Later than clinical/operations spine; requires finance, payer, security review. |
| 8 | Staffing and budget scenario planning | The annualized/monthly staffing estimates are useful as a seed for a future model, but they are not validated compensation or facility-cost evidence. | Parking-lot only; `No measurements found`. |

### Best Fit Against Existing Clarity Layers

| Clarity layer | Use the info dump for | Do not use it for yet |
|---|---|---|
| Directory CRM / account layer | Parent company structure, facility locations, service lines, personnel, role assignments, reporting relationships, vendor relationships. | Live account provisioning, production RBAC, real personnel records, or live vendor exchange. |
| Case spine | Role ownership around referral, intake, handoff, admission, UR, discharge, and audit. | Adding broad enterprise HR/finance data into individual case truth. |
| Admission / Episode operations | Post-acceptance operating state: census, assigned unit/team, nursing handoff, physician coverage, UR gaps, discharge dependencies, direct-care observation exceptions. | Autonomous admission, discharge, placement, staffing, or clinical decisions. |
| UR / revenue-cycle lane | Denial reasons, authorization gaps, coding/billing handoffs, claim status, payment posting, and appeal status as separate events. | Payment guarantees, payer submission automation, or unreviewed financial advice. |
| Product Studio / governance | Evidence labels, roadmap stage, review gates, owner decisions, and "what remains unverified" for each operations slice. | Release control, feature-flag mutation, public roadmap truth, or compliance approval. |
| BI / analytics | Department projections from governed source events and de-identified/aggregated views. | Dashboards that invent measurements or collapse source facts, interpreted metrics, and forecasts into one layer. |
| Training & SOPs | Role-specific onboarding, competencies, annual training, corrective training, credential expirations, and policy acknowledgements. | Clinical competency claims without qualified review. |
| Compliance evidence | Audit logs, incident files, corrective actions, policy reviews, drills, credential files, infection-prevention surveillance, and vendor records. | Legal/regulatory sufficiency claims without compliance/legal review. |

### Inferred Product Architecture

The source material should be split into four durable product primitives:

1. Operations registry
   - Organizations, facilities, departments, service lines, roles, reporting lines, staff/vendor classification, and required credentials.

2. Operations events
   - Source events entered by humans or integrations: intake response, observation check, staffing exception, incident, audit finding, training completion, credential expiration, vendor SLA event, claim denial, payment posting, maintenance work order, transport delay.

3. Review-gated evidence records
   - Compliance, clinical, HR, credentialing, financial, and vendor evidence with source, owner, timestamp, review state, and correction history.

4. Dashboard projections
   - Executive, intake, clinical operations, quality/safety, personnel/training, RCM, cash flow, and vendor dashboards that read from events and evidence rather than becoming the source of truth.

### What Can Be Used Soonest

The most practical early use is not a full operations build. It is a synthetic configuration and dashboard slice:

1. Map Behavioral Health Provider and Parent Company roles in the Directory CRM design.
2. Add a facility operations hierarchy fixture: facility -> departments -> roles -> permissions -> review gates.
3. Define a small operations-event vocabulary for admitted operations: census, staffing exception, safety incident, documentation gap, training/credential exception, vendor blocker.
4. Build a read-only Executive Director / COO synthetic projection showing source-linked exceptions and owners.

This would complement the current Episode & UR direction without changing the current case spine.

Current narrow implementation note:

- `app/src/domain/operationsBackbone.ts` implements a synthetic read-only domain slice for `Facility -> Department -> Role -> Owner -> Event -> Review Gate -> Dashboard Exception`.
- `app/src/domain/operationsBackbone.test.ts` verifies valid reporting chains, invalid-chain rejection, unresolved-event projection, review-gate preservation, and UR/clinical boundary separation.
- This is not a UI, persistence model, API contract, production permission system, compliance engine, or validated operating dashboard.

### What Should Stay Parked

| Material | Why parked |
|---|---|
| Enterprise C-suite operating dashboard | Needs validated organization model, measurement definitions, and executive reporting requirements. |
| Full RCM, billing, coding, AP, AR, and cash-flow system | Financial systems have high integration/security/compliance complexity and should follow a narrowed revenue-cycle brief. |
| Salary/monthly expense model | Source-derived only; compensation, benefits load, contract terms, census assumptions, and market data are unverified. |
| Full regulatory compliance task engine | Requires compliance/legal review of exact standards, policies, evidence obligations, retention, and reporting duties. |
| EMR/accounting/CRM integrations | Requires ADRs, security/privacy approval, vendor contracts, BAA review, audit/logging design, and production identity/RLS evidence. |
| Predictive BI or ROI claims | No baseline or outcome measurement exists. |

### Key Design Warnings

- Keep role hierarchy separate from authenticated permissions. A job title does not automatically authorize an action in Clarity.
- Keep source events separate from KPI metrics. A Q15 check, incident report, denial, or credential expiration is source data; a dashboard percentage is an interpreted projection.
- Keep local facility operations separate from parent-company aggregate views. The same metric can mean different things at the unit, facility, region, and enterprise level.
- Keep vendors distinct from employees. Vendor oversight needs contracts, file evidence, SLA data, access boundaries, and security review.
- Keep compliance task prompts separate from compliance truth. The platform can organize evidence and reminders, but reviewer-approved policy and regulatory mapping must govern final claims.
- Keep financial readiness separate from emergency clinical review. Revenue-cycle views cannot block emergency clinical action.

### Best Product Framing

This is the future "Hospital Operations Control Layer" for Clarity: a governed, role-aware operating layer that sits after intake/admission and beside UR, discharge, compliance, training, and BI.

Its job is to answer:

- Who owns this operational issue?
- Which department, role, facility, or vendor does it belong to?
- What source event created it?
- What compliance, clinical, financial, or operational review gate applies?
- What is overdue, unsafe, unaudited, unstaffed, unresolved, or unverified?
- What can leadership see in aggregate without losing source traceability?

## Recommended First Slice When Unparked

Start narrow:

1. Facility operations hierarchy registry: departments, roles, reporting relationships, employee/vendor classification, and required review gates.
2. Daily operations event model: census, staffing, incidents, training/credential exceptions, maintenance blockers, and intake/UR blockers as separate event types.
3. Read-only synthetic dashboard: Executive Director / COO view with department exception rollups and drill-down to source events.
4. Compliance evidence labels: policy, training, credential, audit, incident, corrective action, drill, vendor file.

Keep dashboards as projections. Do not allow a dashboard metric to become canonical truth unless it points back to the source event, owner, timestamp, data-quality status, and review state.
