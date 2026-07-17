export type MockAdmissionCohort = "Geriatric 55+" | "Adult 18-54";
export type MockAdmissionReviewStatus = "Draft" | "Needs clinician review" | "Needs medical review";

export interface MockAdmissionRisk {
  label: string;
  source: string;
  severity: "Moderate" | "High" | "Imminent";
  reviewStatus: MockAdmissionReviewStatus;
}

export interface MockAdmissionDecision {
  step: string;
  decision: string;
}

export interface MockAdmission {
  id: string;
  patientToken: string;
  age: number;
  cohort: MockAdmissionCohort;
  payor: string;
  referral: string;
  staffOwner: string;
  admissionPosture: string;
  provisionalDiagnoses: string[];
  precipitatingEvents: string;
  historyAndComorbidities: string[];
  risks: MockAdmissionRisk[];
  decisionPath: MockAdmissionDecision[];
  draftChartAndUrSummary: string;
  initialPriority: "Emergent" | "Urgent";
  recommendedLevel: string;
  lowerLevelInsufficient: string;
  reviewGate: string;
}

export const mockAdmissionFilters = ["All cases", "Geriatric 55+", "Adult 18-54"] as const;
export type MockAdmissionFilter = (typeof mockAdmissionFilters)[number];

export const mockAdmissionGuardrails = [
  "All diagnoses are provisional training drafts and require clinician review.",
  "Legal status, hold language, and clock interpretation require counsel validation.",
  "Utilization-review summaries are draft support narratives only.",
  "No section may be copied into a real chart without qualified human review.",
  "No real PHI, facility data, or law-enforcement event is represented.",
];

export const mockAdmissionProcess = [
  { label: "Referral and field capture", description: "Record scene facts, source, observed risk, collateral, and unknowns." },
  { label: "Central intake", description: "Create the case, start the benefits lane, and identify missing facts without delaying clinical review." },
  { label: "Guided assessment", description: "Review mental status, risk, precipitating event, history, comorbidities, collateral, and lower-level alternatives." },
  { label: "Source-linked risk", description: "Attach every finding to field observation, collateral, ED note, or clinician observation." },
  { label: "Medical-necessity draft", description: "Summarize severity, service intensity, impairment, and lower-level limitations as draft support only." },
  { label: "Legal or voluntary status draft", description: "Prefer voluntary care when capacity and consent are present; keep involuntary alternatives counsel-gated." },
  { label: "Packet preview", description: "Assemble assessment, risk, insurance, legal status, medication concerns, and custody references." },
  { label: "Routing response", description: "Record an accepting, declining, information-request, or waitlist response with a reason code." },
  { label: "Bed and milieu decision", description: "Check population fit, acuity, elopement, self-harm, aggression, medical support, and observation level." },
  { label: "UR/chart draft", description: "Prepare a chart-facing training summary and UR support statement for human review." },
];

export const mockAdmissionUrChecklist = [
  "Current symptoms and precipitating event",
  "Risk to self, others, grave disability, medical instability, elopement, or vulnerability",
  "Objective source references and collateral reliability",
  "Psychiatric, substance-use, medical, medication, and social history",
  "Functional impairment and safety-plan limitations",
  "Lower-level alternatives considered and why they are not adequate now",
  "Requested level of care and observation needs",
  "Initial treatment targets",
  "Discharge barriers and early discharge planning",
  "Payor and authorization notes",
  "Reviewer name, date/time, and draft status",
];

export const mockAdmissionRolePlay = [
  {
    function: "Field responders",
    cast: "Jake Peralta, Amy Santiago, Rosa Diaz, Terry Jeffords, Raymond Holt, and Charles Boyle",
  },
  {
    function: "Intake leadership and staff",
    cast: "Michael Scott and Pam Beesly",
  },
  {
    function: "Clinical, compliance, and UR review",
    cast: "Jim Halpert, Angela Martin, and Oscar Martinez",
  },
  {
    function: "Charge nurse and patient tokens",
    cast: "Phyllis Vance and Parks and Recreation character tokens",
  },
];

// Read-only UI projection of the attached synthetic training report. It is intentionally isolated from canonical app seed data.
export const mockAdmissions: MockAdmission[] = [
  {
    id: "mock-ger-001",
    patientToken: "Leslie Knope",
    age: 57,
    cohort: "Geriatric 55+",
    payor: "Medicare Advantage HMO",
    referral: "Amy Santiago and Terry Jeffords, welfare check",
    staffOwner: "Pam Beesly intake; Jim Halpert clinician review; Oscar Martinez UR",
    admissionPosture: "Voluntary if capacity and consent confirmed; legal-status review if unable to safety-plan.",
    provisionalDiagnoses: [
      "Major depressive disorder, recurrent, severe, with anxious distress",
      "Generalized anxiety disorder",
      "Hypertension",
      "Hypothyroidism",
    ],
    precipitatingEvents: "After an abrupt retirement-board conflict and perceived public humiliation, the patient sent multiple goodbye-style texts, stopped eating for two days, and was found pacing near a bridge with disorganized paperwork and no clear plan for safe return home.",
    historyAndComorbidities: [
      "Psychiatric history: recurrent depressive episodes by collateral; outpatient counseling reported but not verified.",
      "Substance use: no intoxication observed; toxicology status unknown.",
      "Medical: hypertension, hypothyroidism, fatigue, and poor intake.",
      "Social: high occupational identity, limited immediate support during crisis, and strong community ties when stable.",
      "Medication issues: thyroid and blood-pressure medication reconciliation required.",
    ],
    risks: [
      { label: "Danger to self through goodbye texts and unsafe location", source: "Amy/Terry field report plus family collateral", severity: "High", reviewStatus: "Needs clinician review" },
      { label: "Functional decline through poor intake and inability to organize safe return", source: "Collateral and intake observation", severity: "Moderate", reviewStatus: "Draft" },
      { label: "Medical vulnerability through missed medication and poor intake", source: "Intake medication reconciliation pending", severity: "Moderate", reviewStatus: "Draft" },
    ],
    decisionPath: [
      { step: "Field capture", decision: "Safety concern escalated due to goodbye texts and bridge location." },
      { step: "Central intake", decision: "Emergent priority; benefits lane started but not blocking assessment." },
      { step: "Clinical assessment", decision: "Inpatient considered because the patient could not produce a reliable safety plan and had acute functional decline." },
      { step: "Lower level considered", decision: "Outpatient and crisis follow-up insufficient due to unsafe location, poor intake, and active goodbye messaging." },
      { step: "Legal status", decision: "Seek voluntary admission if consent and decisional capacity are intact; counsel review required for involuntary alternative." },
      { step: "Bed decision", decision: "Geriatric-capable adult bed with Q15 observation pending full suicide-risk review." },
    ],
    draftChartAndUrSummary: "Patient is a 57-year-old Medicare Advantage member brought by field responders after goodbye-style texts, poor intake for two days, unsafe location, and inability to describe a safe plan. Available facts support acute inpatient psychiatric admission for safety monitoring, diagnostic clarification, medication reconciliation, nutrition/hydration monitoring, and initiation of structured treatment. Lower levels are not adequate in this training scenario because the immediate safety concern, impaired self-care, and lack of reliable safety plan require 24-hour observation. Draft only; clinician review required.",
    initialPriority: "Emergent",
    recommendedLevel: "Inpatient psychiatric",
    lowerLevelInsufficient: "Goodbye texts, unsafe location, poor intake, and no reliable safety plan.",
    reviewGate: "Clinician review",
  },
  {
    id: "mock-ger-002",
    patientToken: "Ron Swanson",
    age: 68,
    cohort: "Geriatric 55+",
    payor: "Original Medicare Part A/B with supplemental policy",
    referral: "Rosa Diaz and Raymond Holt, neighborhood safety call",
    staffOwner: "Michael Scott intake director; Phyllis Vance charge nurse; Angela Martin compliance",
    admissionPosture: "Medical clearance first; psychiatric admission if acute mania remains primary driver.",
    provisionalDiagnoses: [
      "Bipolar I disorder, current episode manic, severe, without psychotic features",
      "Alcohol use disorder, moderate",
      "Type 2 diabetes mellitus",
      "Coronary artery disease",
    ],
    precipitatingEvents: "Neighbors reported three nights without sleep, loud property destruction, and the patient attempting to leave town with firearms despite chest-pain complaints and missed diabetes medication.",
    historyAndComorbidities: [
      "Psychiatric history: prior mood episodes reported by collateral; treatment adherence unknown.",
      "Substance use: alcohol use with possible withdrawal risk.",
      "Medical: diabetes, coronary artery disease, chest-pain complaint, and missed medication.",
      "Social: lives alone, limited tolerance for assistance, and firearm access.",
      "Medication issues: diabetes medication, cardiac medication, and mood-stabilizer history unknown.",
    ],
    risks: [
      { label: "Accidental harm through mania, insomnia, and firearm access", source: "Rosa/Holt field report and neighbor collateral", severity: "High", reviewStatus: "Needs clinician review" },
      { label: "Medical instability through chest pain and diabetes nonadherence", source: "Field report and ED medical screen", severity: "High", reviewStatus: "Needs medical review" },
      { label: "Withdrawal risk", source: "Collateral alcohol history", severity: "Moderate", reviewStatus: "Draft" },
    ],
    decisionPath: [
      { step: "Field capture", decision: "Firearm access and property destruction require safety escalation." },
      { step: "Central intake", decision: "Medical clearance is required before psychiatric-only placement." },
      { step: "Clinical assessment", decision: "Acute mania suspected due to insomnia, pressured activity, impaired judgment, and unsafe behavior." },
      { step: "Lower level considered", decision: "Crisis stabilization alone is insufficient due to weapon access, medical comorbidity, and possible withdrawal." },
      { step: "Legal status", decision: "Voluntary admission if cooperative after medical clearance; counsel-gated hold review if refusing safe care." },
      { step: "Bed decision", decision: "Geriatric-capable bed near nurse station; fall and medical-monitoring precautions." },
    ],
    draftChartAndUrSummary: "Patient is a 68-year-old Medicare beneficiary presenting with severe mood elevation, three nights of insomnia, property destruction, unsafe travel attempt with firearm access, and medical comorbidities including diabetes and coronary artery disease. Draft inpatient rationale is based on severity of illness, impaired judgment, weapon-related safety risk, need for medication stabilization, withdrawal monitoring, and medical-psychiatric coordination. Lower level of care is not adequate in this training scenario due to acute safety and medical complexity. Draft only; clinician, medical, and counsel review required.",
    initialPriority: "Emergent",
    recommendedLevel: "Medical clearance then inpatient psychiatric",
    lowerLevelInsufficient: "Mania, weapon access, property destruction, diabetes, and cardiac risk.",
    reviewGate: "Medical, clinician, counsel review",
  },
  {
    id: "mock-ger-003",
    patientToken: "Donna Meagle",
    age: 60,
    cohort: "Geriatric 55+",
    payor: "Medicare due disability with Medicaid secondary",
    referral: "Charles Boyle and Jake Peralta, family-requested transport",
    staffOwner: "Pam Beesly intake; Jim Halpert clinician review; Oscar Martinez UR",
    admissionPosture: "Voluntary trauma-informed admission if capacity and consent confirmed.",
    provisionalDiagnoses: [
      "Posttraumatic stress disorder",
      "Major depressive disorder, recurrent, moderate",
      "Chronic pain syndrome",
      "Obstructive sleep apnea",
    ],
    precipitatingEvents: "The patient reported escalating panic, insomnia, and trauma flashbacks after a motor vehicle crash anniversary. Family collateral described medication overuse concern and inability to complete basic self-care for three days.",
    historyAndComorbidities: [
      "Psychiatric history: trauma symptoms and depression by self-report.",
      "Substance use: no illicit use reported; medication overuse concern requires review.",
      "Medical: chronic pain, sleep apnea, and sedating-medication risk.",
      "Social: family engaged but unable to maintain safety at home.",
      "Medication issues: pain medication and sleep medication reconciliation required.",
    ],
    risks: [
      { label: "Medication safety risk", source: "Family collateral and intake report", severity: "High", reviewStatus: "Needs clinician review" },
      { label: "Self-neglect", source: "Family collateral about ADL decline", severity: "Moderate", reviewStatus: "Draft" },
      { label: "Trauma-related destabilization", source: "Patient report and clinician observation", severity: "Moderate", reviewStatus: "Draft" },
    ],
    decisionPath: [
      { step: "Field capture", decision: "Family unable to supervise medication and self-care safely." },
      { step: "Central intake", decision: "Medicare/Medicaid benefits verified as a parallel lane." },
      { step: "Clinical assessment", decision: "Trauma flashbacks, insomnia, medication overuse concern, and self-care decline support inpatient review." },
      { step: "Lower level considered", decision: "Family support and outpatient care insufficient due to medication safety concern and three-day ADL decline." },
      { step: "Legal status", decision: "Voluntary admission expected if the patient agrees; legal review only if refusal creates imminent risk." },
      { step: "Bed decision", decision: "Geriatric-capable bed with medication-safety precautions and sleep-apnea risk note." },
    ],
    draftChartAndUrSummary: "Patient is a 60-year-old Medicare/Medicaid member with trauma-related destabilization, insomnia, passive death wishes, medication overuse concern, and inability to maintain self-care despite family involvement. Draft inpatient rationale is based on safety monitoring, medication reconciliation, trauma symptom stabilization, pain/sleep comorbidity coordination, and failure of family-supported lower level. Draft only; clinician review required.",
    initialPriority: "Urgent",
    recommendedLevel: "Inpatient psychiatric",
    lowerLevelInsufficient: "Medication overuse concern, ADL decline, trauma destabilization, and family unable to supervise.",
    reviewGate: "Clinician review",
  },
  {
    id: "mock-adult-001",
    patientToken: "April Ludgate",
    age: 31,
    cohort: "Adult 18-54",
    payor: "Commercial PPO",
    referral: "Rosa Diaz, workplace safety concern",
    staffOwner: "Jim Halpert clinician review; Angela Martin compliance; Oscar Martinez UR",
    admissionPosture: "Inpatient admission with suicide precautions; voluntary if the patient can consent and cooperate.",
    provisionalDiagnoses: [
      "Major depressive disorder, recurrent, severe",
      "Rule out borderline personality disorder traits",
      "Migraine disorder",
    ],
    precipitatingEvents: "Coworkers reported cryptic farewell messages, giving away personal items, locked-room isolation, superficial cuts, and refusal to collaborate on safety planning.",
    historyAndComorbidities: [
      "Psychiatric history: prior depressive symptoms reported; treatment history unverified.",
      "Substance use: denied in field report; verification pending.",
      "Medical: migraine disorder.",
      "Social: workplace collateral available; family collateral pending.",
      "Medication issues: antidepressant history unknown.",
    ],
    risks: [
      { label: "Recent self-injury", source: "Field observation and ED wound check", severity: "Imminent", reviewStatus: "Needs clinician review" },
      { label: "Suicide-risk indicators", source: "Coworker collateral about farewell messaging and giving away items", severity: "High", reviewStatus: "Needs clinician review" },
      { label: "Poor safety collaboration", source: "Clinician observation", severity: "High", reviewStatus: "Draft" },
    ],
    decisionPath: [
      { step: "Field capture", decision: "Recent self-harm and concealment made routine outpatient referral inappropriate." },
      { step: "Central intake", decision: "Commercial benefits verification begins; clinical lane proceeds immediately." },
      { step: "Clinical assessment", decision: "Suicide precautions indicated in the training scenario due to self-injury and inability to safety-plan." },
      { step: "Lower level considered", decision: "PHP/IOP not adequate due to immediate self-harm behavior and poor collaboration." },
      { step: "Legal status", decision: "Voluntary preferred; hold review if the patient refuses and risk remains imminent." },
      { step: "Bed decision", decision: "Adult acute bed with suicide precautions and environmental safety check." },
    ],
    draftChartAndUrSummary: "Patient is a 31-year-old commercially insured adult presenting after recent superficial self-injury, farewell messaging, giving away belongings, locked-room isolation, and inability to engage in safety planning. Draft inpatient rationale is based on imminent self-harm risk, need for 24-hour observation, safety planning, diagnostic clarification, medication evaluation, and failure of less restrictive care at presentation. Draft only; clinician review required.",
    initialPriority: "Emergent",
    recommendedLevel: "Inpatient psychiatric",
    lowerLevelInsufficient: "Recent self-injury, farewell messaging, and inability to safety-plan.",
    reviewGate: "Clinician review",
  },
  {
    id: "mock-adult-002",
    patientToken: "Andy Dwyer",
    age: 37,
    cohort: "Adult 18-54",
    payor: "Managed Medicaid",
    referral: "Jake Peralta and Charles Boyle, traffic safety call",
    staffOwner: "Michael Scott intake director; Pam Beesly intake; Phyllis Vance charge nurse",
    admissionPosture: "Inpatient admission after medical clearance; elopement precautions.",
    provisionalDiagnoses: [
      "Schizoaffective disorder, bipolar type",
      "Cannabis use disorder, moderate",
      "Asthma",
    ],
    precipitatingEvents: "The patient was found wandering in traffic, singing loudly, responding to unseen stimuli, and stating he had been chosen to stop an invisible emergency. Collateral reported medication nonadherence for two weeks.",
    historyAndComorbidities: [
      "Psychiatric history: psychotic/mood disorder history by collateral.",
      "Substance use: cannabis use reported; toxicology pending.",
      "Medical: asthma and possible dehydration from prolonged wandering.",
      "Social: supportive partner not immediately reachable.",
      "Medication issues: two-week psychiatric medication nonadherence.",
    ],
    risks: [
      { label: "Grave disability and accidental harm", source: "Police observation of traffic wandering", severity: "High", reviewStatus: "Needs clinician review" },
      { label: "Psychosis", source: "Field report and clinician observation", severity: "High", reviewStatus: "Draft" },
      { label: "Medication nonadherence", source: "Collateral report", severity: "Moderate", reviewStatus: "Draft" },
    ],
    decisionPath: [
      { step: "Field capture", decision: "Traffic exposure and psychosis create immediate safety concern." },
      { step: "Central intake", decision: "Managed Medicaid lane starts; clinical care not delayed." },
      { step: "Clinical assessment", decision: "Inpatient indicated in the training scenario due to psychosis, impaired judgment, and inability to maintain safety." },
      { step: "Lower level considered", decision: "Crisis-only care insufficient due to traffic wandering and nonadherence." },
      { step: "Legal status", decision: "Voluntary if the patient regains capacity and agrees; otherwise counsel-gated emergency hold review." },
      { step: "Bed decision", decision: "Adult acute bed away from exit; elopement precautions and asthma medication reconciliation." },
    ],
    draftChartAndUrSummary: "Patient is a 37-year-old Managed Medicaid member found wandering in traffic with apparent psychosis, impaired reality testing, and two-week medication nonadherence. Draft inpatient rationale is based on grave-disability risk, accidental-harm exposure, inability to use lower-level supports, need for 24-hour structured care, medication restart, and elopement precautions. Draft only; clinician review required.",
    initialPriority: "Emergent",
    recommendedLevel: "Medical clearance then inpatient psychiatric",
    lowerLevelInsufficient: "Psychosis, traffic wandering, nonadherence, and elopement risk.",
    reviewGate: "Clinician review",
  },
  {
    id: "mock-adult-003",
    patientToken: "Tom Haverford",
    age: 42,
    cohort: "Adult 18-54",
    payor: "Employer-sponsored EPO",
    referral: "Amy Santiago and Terry Jeffords, ED elopement concern",
    staffOwner: "Pam Beesly intake; Oscar Martinez UR; Angela Martin compliance",
    admissionPosture: "Dual medical-behavioral review; psychiatric admission if medically cleared and behavioral-health need remains primary.",
    provisionalDiagnoses: [
      "Panic disorder",
      "Stimulant use disorder, mild to moderate",
      "Hypertension",
      "Rule out substance-induced anxiety disorder",
    ],
    precipitatingEvents: "The patient presented to the ED with chest tightness, panic, pressured speech, escalating paranoid fear, several days of stimulant misuse, no sleep, and an attempt to leave before medical clearance.",
    historyAndComorbidities: [
      "Psychiatric history: panic episodes by self-report.",
      "Substance use: stimulant misuse over several days.",
      "Medical: hypertension and chest tightness requiring medical clearance.",
      "Social: employment stress and financial stress reported.",
      "Medication issues: stimulant access and antihypertensive adherence unknown.",
    ],
    risks: [
      { label: "Medical instability", source: "ED report of chest tightness and hypertension", severity: "High", reviewStatus: "Needs medical review" },
      { label: "Elopement risk", source: "ED and police report of attempted departure before clearance", severity: "Moderate", reviewStatus: "Draft" },
      { label: "Substance-related destabilization", source: "Patient report and ED observation", severity: "Moderate", reviewStatus: "Draft" },
    ],
    decisionPath: [
      { step: "Field capture", decision: "Elopement before medical clearance creates safety and medical risk." },
      { step: "Central intake", decision: "Employer EPO verification begins; medical clearance remains first gate." },
      { step: "Clinical assessment", decision: "Psychiatric admission depends on medical clearance and ongoing behavioral instability." },
      { step: "Lower level considered", decision: "Crisis stabilization may be insufficient if elopement and stimulant-related paranoia persist." },
      { step: "Legal status", decision: "Voluntary preferred; hold review only if imminent risk and refusal persist after medical review." },
      { step: "Bed decision", decision: "Adult acute bed only after medical clearance; observation for elopement and stimulant-withdrawal symptoms." },
    ],
    draftChartAndUrSummary: "Patient is a 42-year-old EPO member with panic, stimulant misuse, hypertension, chest-tightness presentation, insomnia, paranoia, and attempted ED elopement before clearance. Draft inpatient rationale is conditional: if medical clearance confirms behavioral-health primary need and the patient remains unable to maintain safety, inpatient care is supported by elopement risk, impaired judgment, substance-related instability, and need for 24-hour observation and stabilization. Draft only; medical and clinician review required.",
    initialPriority: "Urgent",
    recommendedLevel: "Conditional inpatient psychiatric after medical clearance",
    lowerLevelInsufficient: "Chest tightness, stimulant instability, and elopement before medical clearance.",
    reviewGate: "Medical and clinician review",
  },
];
