import type { RoleId, WorkspaceId } from "./roles";

export interface SopPhase {
  title: string;
  workflowFit: string;
  evidence: string;
  reviewGate: string;
}

export interface RoleTrainingPlan {
  roleId: RoleId;
  label: string;
  mission: string;
  onboardingOutcome: string;
  sopChecklist: string[];
  practiceWorkflow: string[];
  competencyEvidence: string[];
  reviewGates: string[];
  linkedWorkspaces: WorkspaceId[];
}

export const trainingSourceBoundaries = [
  {
    title: "Assessment training protocol",
    status: "Summary derived",
    review: "Requires clinical review",
    note: "Used for pre-assessment, during-assessment, post-assessment, EMR handoff, staff competency, and annual review training patterns.",
  },
  {
    title: "ePEC chain-of-custody workflow",
    status: "Summary derived",
    review: "Requires legal review",
    note: "Used for legal-status practice, attestation boundaries, hash-chain verification, transfer receipts, and counsel-validation warnings.",
  },
  {
    title: "Persona and role UX map",
    status: "Source confirmed",
    review: "Product review",
    note: "Used to keep role-specific training aligned to one canonical case record and scoped workspace access.",
  },
];

export const sopPhases: SopPhase[] = [
  {
    title: "Pre-assessment procedure",
    workflowFit: "Confirm referral source, location, presenting concern, safety context, collateral plan, and benefits status as a parallel lane.",
    evidence: "Prep completion, handoff note, source references, and any missing-fact flags.",
    reviewGate: "Draft. Financial status never blocks clinical screening.",
  },
  {
    title: "During-assessment procedure",
    workflowFit: "Capture structured domains, plain-language observations, collateral reliability, source-linked risks, and deviations from the expected interview path.",
    evidence: "Assessment fields, source-linked risk findings, pitfall guards, and clinician review status.",
    reviewGate: "Needs clinician review. The system does not diagnose or make final treatment recommendations.",
  },
  {
    title: "Post-assessment procedure",
    workflowFit: "Prepare case presentation, medical-necessity support draft, legal-status draft, packet completeness, and follow-up tasks.",
    evidence: "Medical necessity snapshot, legal instrument draft, packet checklist, audit log, and custody ledger events.",
    reviewGate: "Draft only until qualified human review.",
  },
  {
    title: "EMTALA and state-code education",
    workflowFit: "Teach staff where legal clocks, transfer duties, emergency screening boundaries, and statutory language appear in the workflow.",
    evidence: "Counsel-validation flags, legal clock review notes, and training acknowledgement.",
    reviewGate: "Counsel validation required before statutory language, deadlines, or forms are treated as authoritative.",
  },
  {
    title: "Annual competency evidence",
    workflowFit: "Track synthetic practice scenarios, role-specific checkoffs, deviation notes, and review-gate comprehension.",
    evidence: "Simulation completion, supervisor signoff placeholder, and required refresh date.",
    reviewGate: "Training record only. Not a licensing, credentialing, or HR system in v0.2.",
  },
];

export const pecCustodyTrainingPath = [
  "Open legal status as a draft with counsel-review warning.",
  "Create the instrument draft without final statutory or form claims.",
  "Capture attestation/signature readiness as pending validation.",
  "Seal material events into the custody ledger with previous-hash continuity.",
  "Transmit packet preview and retain the packet hash.",
  "Record facility response, receipt, decline reason, or request for information.",
  "Route CEC or second-review steps as a future legal workflow, not a v0.2 automated decision.",
];

export const roleTrainingPlans: RoleTrainingPlan[] = [
  {
    roleId: "all",
    label: "All workspaces reviewer",
    mission: "Understand the full Clarity operating model without treating the demo as production authority.",
    onboardingOutcome: "Can narrate one synthetic case from referral through assessment, draft review, packet, routing, custody verification, and future UR metrics.",
    sopChecklist: [
      "Identify the single canonical case record and where each workspace adds evidence.",
      "Explain which outputs are drafts and who reviews them.",
      "Confirm that source material remains read-only context, not live app data.",
      "Use stakeholder feedback language: must-have, helpful, confusing, missing, or later.",
    ],
    practiceWorkflow: ["Case Queue", "Guided Intake", "Medical Necessity", "Legal Status", "Packet Preview", "Routing Response", "Custody Ledger"],
    competencyEvidence: ["Closed-loop walkthrough completed", "Guardrail explanation recorded", "POC feedback notes captured"],
    reviewGates: ["Source confirmed vs summary derived", "Needs clinician review", "Counsel validation required", "No measurements found"],
    linkedWorkspaces: ["queue", "intake", "medical", "legal", "packet", "routing", "ledger"],
  },
  {
    roleId: "field",
    label: "Field responder",
    mission: "Capture the story once, on scene, without clinical jargon.",
    onboardingOutcome: "Can create a case, capture field-mode facts, add a source-linked risk, and hand off without making clinical or legal determinations.",
    sopChecklist: [
      "Record referral source, location, presenting concern, and immediate safety facts.",
      "Document what was observed, heard, and reported by collateral sources.",
      "Mark unknowns and missing collateral instead of guessing.",
      "Leave diagnosis, formulation, medical necessity, and legal conclusions to reviewers.",
    ],
    practiceWorkflow: ["New Case", "Guided Intake field mode", "Source-linked risk", "Case Overview", "Custody Ledger"],
    competencyEvidence: ["Synthetic case created", "At least one source-linked risk captured", "Unknown and missing collateral fields preserved"],
    reviewGates: ["Draft", "Needs clinician review", "Unknown", "No final legal status"],
    linkedWorkspaces: ["new", "intake", "overview", "ledger"],
  },
  {
    roleId: "central",
    label: "Central intake coordinator",
    mission: "Keep every case moving; escalate before clocks breach.",
    onboardingOutcome: "Can run the command center, monitor clinical and financial lanes, escalate packet gaps, and route a packet without retyping the story.",
    sopChecklist: [
      "Confirm pre-assessment checklist completion and handoff note.",
      "Watch packet completeness, clock status, and facility-response delays.",
      "Keep benefits verification visible but non-blocking.",
      "Escalate missing clinical/legal review to the accountable reviewer.",
    ],
    practiceWorkflow: ["Command Center", "Case Queue", "Case Overview", "Packet Preview", "Routing Response", "Custody Ledger"],
    competencyEvidence: ["Escalated synthetic gap identified", "Packet readiness explained", "Parallel financial lane boundary explained"],
    reviewGates: ["Demo clocks only", "Below target", "Escalated", "Draft workflow"],
    linkedWorkspaces: ["command", "queue", "overview", "packet", "routing", "ledger"],
  },
  {
    roleId: "clinician",
    label: "Clinician reviewer",
    mission: "Turn drafts into clinically defensible documentation.",
    onboardingOutcome: "Can review a structured assessment, complete missing formulation, evaluate medical-necessity support, and reject prohibited final-criteria language.",
    sopChecklist: [
      "Review full assessment domains and collateral reliability.",
      "Connect each risk statement to a source reference.",
      "Document missing lower-level-of-care and protective-factor analysis.",
      "Treat medical-necessity text as support for review, never an autonomous certification.",
    ],
    practiceWorkflow: ["Case Queue", "Guided Intake clinical mode", "Medical Necessity", "Legal Status", "Custody Ledger"],
    competencyEvidence: ["Risk formulation completed in synthetic case", "Prohibited phrase guard observed", "Clinician-review gate explained"],
    reviewGates: ["Needs clinician review", "Draft", "No InterQual or MCG claims", "No final medical necessity"],
    linkedWorkspaces: ["queue", "intake", "medical", "legal", "ledger"],
  },
  {
    roleId: "ur",
    label: "UR / benefits specialist",
    mission: "Clear the financial lane without ever blocking the clinical lane.",
    onboardingOutcome: "Can identify payer documentation gaps, export future-safe utilization events, and explain why benefits status never stops emergency clinical screening.",
    sopChecklist: [
      "Review insurance and benefits status as informational context.",
      "Flag missing payer-support documentation without delaying clinical flow.",
      "Use metrics-safe event shapes with no PHI.",
      "Route documentation gaps back to the appropriate reviewer.",
    ],
    practiceWorkflow: ["Command Center", "Case Queue", "Case Overview", "Medical Necessity", "Custody Ledger"],
    competencyEvidence: ["Documentation-gap queue reviewed", "Non-blocking benefits rule explained", "Future UR event fields identified"],
    reviewGates: ["Verification pending", "Unknown", "No payment guarantee", "No clinical block"],
    linkedWorkspaces: ["command", "queue", "overview", "medical", "ledger"],
  },
  {
    roleId: "facility",
    label: "Receiving facility admissions coordinator",
    mission: "Respond fast with a reason the network can learn from.",
    onboardingOutcome: "Can review a packet preview, record accept/decline/request-info/waitlist, and provide reason codes that improve routing learning later.",
    sopChecklist: [
      "Review only the sent packet preview and custody hash.",
      "Record response type with a reason when declining.",
      "Request missing information instead of rejecting unsupported packets silently.",
      "Understand acceptance receipts as custody events.",
    ],
    practiceWorkflow: ["Packet Preview", "Routing Response", "Custody Ledger"],
    competencyEvidence: ["Mock response recorded", "Decline reason requirement demonstrated", "Packet hash located"],
    reviewGates: ["Packet preview only", "Decline reason required", "Receipt logged", "No production facility data"],
    linkedWorkspaces: ["packet", "routing", "ledger"],
  },
  {
    roleId: "nurse",
    label: "Charge nurse",
    mission: "Place for milieu safety, not just bed availability.",
    onboardingOutcome: "Can review placement fit, identify unsafe acuity mix, document override rationale, and preserve the decision in the custody ledger.",
    sopChecklist: [
      "Review unit acuity, observation load, aggression, elopement, and SI flags.",
      "Treat placement recommendations as advisory.",
      "Document override reason before changing the recommendation.",
      "Escalate staffing or milieu conflicts to the accountable operator.",
    ],
    practiceWorkflow: ["Milieu Bedboard", "Case Overview", "Custody Ledger"],
    competencyEvidence: ["Unsafe recommendation identified", "Override reason documented", "Ledger event verified"],
    reviewGates: ["Pending clinical validation", "Advisory recommendation", "Override requires reason", "Charge nurse final decision"],
    linkedWorkspaces: ["bedboard", "overview", "ledger"],
  },
  {
    roleId: "compliance",
    label: "Compliance / legal officer",
    mission: "Prove custody, review status, and counsel-validation boundaries.",
    onboardingOutcome: "Can verify the custody chain, identify counsel-validation gaps, and explain why statutory language and clocks are not authoritative in the prototype.",
    sopChecklist: [
      "Open legal-status drafts and identify counsel-review warnings.",
      "Verify custody hash continuity and identify tamper failure behavior.",
      "Separate legal workflow evidence from legal advice or approved form generation.",
      "Flag statutory language, deadlines, and e-signature rules for counsel validation.",
    ],
    practiceWorkflow: ["Custody Ledger", "Command Center", "Case Queue", "Legal Status"],
    competencyEvidence: ["Custody chain verified", "Tamper risk explained", "Counsel-validation queue identified"],
    reviewGates: ["Counsel validation required", "Unknown", "Broken chain", "Draft legal instrument"],
    linkedWorkspaces: ["ledger", "command", "queue", "legal"],
  },
  {
    roleId: "executive",
    label: "Executive / program director",
    mission: "See throughput and risk at a glance; measure before claiming improvement.",
    onboardingOutcome: "Can use the prototype for POC feedback, understand what is built vs parked, and avoid unsupported performance or outcome claims.",
    sopChecklist: [
      "Review active case flow and escalations without drilling into unnecessary detail.",
      "Use roadmap feedback prompts to classify stakeholder requests.",
      "Keep baseline outcomes marked as No measurements found until piloted.",
      "Prioritize well-developed workflow modules before parked analytics or integrations.",
    ],
    practiceWorkflow: ["Command Center", "Case Queue", "Custody Ledger", "POC roadmap feedback"],
    competencyEvidence: ["POC feedback captured", "Unsupported outcome claim rejected", "Parking-lot feature identified"],
    reviewGates: ["No measurements found", "Unknown", "Planned", "Parking lot"],
    linkedWorkspaces: ["command", "queue", "ledger"],
  },
];

export function getRoleTrainingPlan(roleId: RoleId): RoleTrainingPlan {
  return roleTrainingPlans.find((plan) => plan.roleId === roleId) ?? roleTrainingPlans[0];
}
