import { readCaseClocks } from "./clocks";
import { sortCases } from "./selectors";
import type { RoleId } from "./roles";
import type { AppState, Case } from "./types";

// Patient journey model: classifies every existing capability into five phases
// (pre-admit -> intake -> admitted -> discharge planning -> post-discharge) and
// derives per-case milestone status from AppState. Pure derivation only — no
// milestone state is stored; completing work in the source workspace is what
// moves the monitor. "Not built" milestones name real product gaps (CIA bundle
// v1.0.0 workflow, UR, aftercare) instead of pretending they are tracked.
// Demo scoping: synthetic cases, simulated notifications, no real paging/EHR.

export type JourneyPhaseId = "preadmit" | "intake" | "admitted" | "discharge" | "postdischarge";

export type MilestoneStatus = "Complete" | "In progress" | "Pending" | "Not built";

export interface JourneyMilestone {
  id: string;
  phase: JourneyPhaseId;
  label: string;
  responsibleRoleId: RoleId;
  responsibleLabel: string;
  status: MilestoneStatus;
  evidence: string;
  nextStep: string;
}

export interface JourneyPhaseReading {
  phase: JourneyPhaseId;
  label: string;
  milestones: JourneyMilestone[];
  completed: number;
  built: number;
  notBuilt: number;
  percent: number;
}

export interface JourneyReading {
  caseId: string;
  phases: JourneyPhaseReading[];
  nextAction: JourneyMilestone | null;
  buildGaps: JourneyMilestone[];
}

export interface HandoffItem {
  caseId: string;
  caseLabel: string;
  priority: Case["priority"];
  milestone: JourneyMilestone;
}

export interface HandoffGroup {
  responsibleLabel: string;
  items: HandoffItem[];
}

export const journeyPhaseOrder: Array<{ id: JourneyPhaseId; label: string }> = [
  { id: "preadmit", label: "Pre-admit" },
  { id: "intake", label: "Intake" },
  { id: "admitted", label: "Admitted" },
  { id: "discharge", label: "Discharge planning" },
  { id: "postdischarge", label: "Post-discharge" },
];

// Admin progress bar covers the phases the owner asked to monitor first.
export const monitoredPhases: JourneyPhaseId[] = ["preadmit", "intake", "admitted"];

function milestone(
  phase: JourneyPhaseId,
  id: string,
  label: string,
  responsibleRoleId: RoleId,
  responsibleLabel: string,
  status: MilestoneStatus,
  evidence: string,
  nextStep: string,
): JourneyMilestone {
  return { id, phase, label, responsibleRoleId, responsibleLabel, status, evidence, nextStep };
}

export function deriveJourney(state: AppState, caseId: string, nowIso: string): JourneyReading {
  const caseRecord = state.cases.find((item) => item.id === caseId);
  const encounter = state.encounters.find((item) => item.caseId === caseId);
  const assessment = state.assessments.find((item) => item.caseId === caseId);
  const riskFindings = state.riskFindings.filter((item) => item.caseId === caseId);
  const medicalNecessity = state.medicalNecessitySnapshots.find((item) => item.caseId === caseId);
  const legalInstrument = state.legalInstruments.find((item) => item.caseId === caseId);
  const packet = state.referralPackets.find((item) => item.caseId === caseId);
  const referrals = state.facilityReferrals.filter((item) => item.caseId === caseId);
  const placements = state.placementRecommendations.filter((item) => item.caseId === caseId);
  const ledgerEvents = state.custodyLedgerEvents.filter((item) => item.caseId === caseId);

  const milestones: JourneyMilestone[] = [];

  // ---- Pre-admit: referral received through accepted placement ----
  milestones.push(
    milestone(
      "preadmit",
      "referral-received",
      "Referral received / case created",
      "field",
      "Field responder",
      caseRecord ? "Complete" : "Pending",
      caseRecord ? `Case opened ${caseRecord.openedAt}` : "No case record",
      "Create the case from the referral",
    ),
  );

  const assessmentStatus: MilestoneStatus = assessment
    ? assessment.presentingProblem.trim()
      ? "Complete"
      : "In progress"
    : "Pending";
  milestones.push(
    milestone(
      "preadmit",
      "assessment-captured",
      "Guided assessment captured",
      "field",
      "Field responder / intake coordinator",
      assessmentStatus,
      assessment ? `Assessment ${assessment.reviewStatus}` : "No assessment started",
      "Complete the guided intake assessment",
    ),
  );

  const sourcedFindings = riskFindings.filter((item) => item.sourceReferenceIds.length > 0);
  const riskStatus: MilestoneStatus = riskFindings.length
    ? sourcedFindings.length === riskFindings.length
      ? "Complete"
      : "In progress"
    : "Pending";
  milestones.push(
    milestone(
      "preadmit",
      "risk-source-linked",
      "Risk findings documented with sources",
      "clinician",
      "Clinician reviewer",
      riskStatus,
      riskFindings.length
        ? `${sourcedFindings.length}/${riskFindings.length} findings source-linked`
        : "No risk findings recorded",
      "Attach every risk finding to a source reference",
    ),
  );

  const medStatus: MilestoneStatus = medicalNecessity
    ? medicalNecessity.reviewStatus === "Clinician reviewed" || medicalNecessity.reviewStatus === "Signed locked"
      ? "Complete"
      : "In progress"
    : "Pending";
  milestones.push(
    milestone(
      "preadmit",
      "medical-necessity-reviewed",
      "Medical necessity clinician-reviewed",
      "clinician",
      "Clinician reviewer",
      medStatus,
      medicalNecessity ? `Draft status: ${medicalNecessity.reviewStatus}` : "No medical-necessity draft",
      "Clinician reviews and approves the medical-necessity draft",
    ),
  );

  const legalStatusValue = legalInstrument?.legalStatus ?? "Unknown";
  const legalStatus: MilestoneStatus = legalInstrument
    ? legalStatusValue !== "Unknown" && legalInstrument.requiredFactsComplete
      ? "Complete"
      : "In progress"
    : "Pending";
  milestones.push(
    milestone(
      "preadmit",
      "legal-status-established",
      "Legal status established (voluntary or instrument)",
      "compliance",
      "Compliance / legal officer",
      legalStatus,
      legalInstrument
        ? `${legalStatusValue}${legalInstrument.requiredFactsComplete ? ", required facts complete" : ", required facts incomplete"}`
        : "No legal status draft",
      "Document voluntary status or execute the correct instrument (counsel-gated)",
    ),
  );

  const insuranceValue = encounter?.insuranceStatus ?? "Unknown";
  const insuranceStatus: MilestoneStatus =
    insuranceValue === "Verified" ? "Complete" : insuranceValue === "Pending verification" ? "In progress" : "Pending";
  milestones.push(
    milestone(
      "preadmit",
      "insurance-verified",
      "Insurance verified (parallel lane, never blocks clinical)",
      "ur",
      "UR / benefits specialist",
      insuranceStatus,
      `Financial lane: ${insuranceValue}`,
      "Verify eligibility and record benefits (human-performed)",
    ),
  );

  const packetStatus: MilestoneStatus = packet
    ? packet.completeness >= 95 && packet.status !== "Draft"
      ? "Complete"
      : "In progress"
    : "Pending";
  milestones.push(
    milestone(
      "preadmit",
      "packet-ready",
      "Referral packet ≥95% and sealed",
      "central",
      "Central intake coordinator",
      packetStatus,
      packet ? `Packet ${packet.status}, ${packet.completeness}% complete` : "No packet generated",
      "Assemble, seal, and send the referral packet",
    ),
  );

  const accepted = referrals.some((item) => item.status === "Accepted");
  const routingActive = referrals.some((item) => item.status !== "Draft");
  const routingStatus: MilestoneStatus = accepted ? "Complete" : routingActive ? "In progress" : "Pending";
  milestones.push(
    milestone(
      "preadmit",
      "facility-accepted",
      "Receiving facility accepted",
      "facility",
      "Receiving facility",
      routingStatus,
      referrals.length ? referrals.map((item) => `${item.facilityName}: ${item.status}`).join("; ") : "No referrals sent",
      "Route the packet and record the facility response",
    ),
  );

  const bedAccepted = placements.some((item) => item.status === "Accepted");
  const bedSuggested = placements.some((item) => item.status === "Suggested");
  const bedStatus: MilestoneStatus = bedAccepted ? "Complete" : bedSuggested ? "In progress" : "Pending";
  milestones.push(
    milestone(
      "preadmit",
      "bed-assigned",
      "Bed and milieu placement decided",
      "nurse",
      "Charge nurse (inpatient)",
      bedStatus,
      placements.length ? `${placements.length} recommendation(s), accepted: ${bedAccepted ? "yes" : "no"}` : "No placement recommendation",
      "Charge nurse accepts or overrides the milieu placement",
    ),
  );

  // ---- Intake: arrival at the receiving facility through integrated assessment ----
  const handoffEvent = ledgerEvents.find((item) => /ARRIVAL|CUSTODY_TRANSFER|HANDOFF/i.test(item.eventType));
  milestones.push(
    milestone(
      "intake",
      "custody-handoff",
      "Arrival / custody handoff recorded",
      "facility",
      "Receiving facility",
      handoffEvent ? "Complete" : "Pending",
      handoffEvent ? `Ledger event ${handoffEvent.eventType} at ${handoffEvent.occurredAt}` : "No arrival event in custody ledger",
      "Record the custody handoff in the hash-chained ledger on arrival",
    ),
  );
  // CIA bundle v1.0.0 (reference/source-packages/) defines the 3-stage
  // treatment-team workflow; no workspace or backend implements it yet.
  milestones.push(
    milestone("intake", "cia-stage-1", "CIA stage 1 — field/crisis intake", "field", "Crisis intake (CIA role model)", "Not built", "CIA bundle v1.0.0 is documentation only", "Build the CIA workspace from the runtime schema"),
    milestone("intake", "cia-stage-2", "CIA stage 2 — nursing assessment", "nurse", "Nursing (CIA role model)", "Not built", "CIA bundle v1.0.0 is documentation only", "Build the CIA workspace from the runtime schema"),
    milestone("intake", "cia-stage-3", "CIA stage 3 — social services integration", "clinician", "Social services (no app role yet)", "Not built", "CIA bundle v1.0.0 is documentation only", "Build the CIA workspace from the runtime schema"),
    milestone("intake", "cia-final-review", "CIA final clinical review", "clinician", "Physician (restricted signer)", "Not built", "CIA bundle v1.0.0 is documentation only", "Build the CIA workspace from the runtime schema"),
  );

  // ---- Admitted: orders, utilization review, statutory review windows ----
  milestones.push(
    milestone("admitted", "admission-orders", "Admission orders recorded", "nurse", "Charge nurse / physician", "Not built", "Backend admission linkage exists (S1/S2); no app surface", "Surface the admission record and orders in the app"),
    milestone("admitted", "initial-ur-review", "Initial utilization review", "ur", "UR / benefits specialist", "Not built", "Backend episode-owned UR exists (S1/S2); no app surface", "Surface episode utilization review in the app"),
  );

  const cecClock = readCaseClocks(state, caseId, nowIso).find((reading) => /CEC/i.test(reading.clock.label));
  const cecStatus: MilestoneStatus = legalInstrument?.cec ? "Complete" : cecClock ? "In progress" : "Pending";
  milestones.push(
    milestone(
      "admitted",
      "cec-review",
      "CEC examination inside review window",
      "clinician",
      "Physician / CEC examiner",
      cecStatus,
      legalInstrument?.cec
        ? `CEC executed ${legalInstrument.cec.executedAt} (${legalInstrument.cec.outcome})`
        : cecClock
          ? `${cecClock.clock.label}: ${cecClock.status}, ${cecClock.remainingMinutes}m remaining`
          : "No CEC clock running (applies to involuntary admissions)",
      "Independent examiner completes the CEC before the window closes (counsel-gated)",
    ),
  );

  // ---- Discharge planning ----
  const cecOutcome = legalInstrument?.cec?.outcome;
  const dispositionStatus: MilestoneStatus =
    cecOutcome === "Discharged" ? "Complete" : cecOutcome === "Continued" ? "In progress" : "Pending";
  milestones.push(
    milestone(
      "discharge",
      "cec-disposition",
      "Disposition decision (continue vs discharge)",
      "clinician",
      "Physician / CEC examiner",
      dispositionStatus,
      cecOutcome
        ? cecOutcome === "Discharged"
          ? "CEC conclusion B — discharge forthwith; R.S. 28:53.1 duties trigger"
          : "CEC conclusion A — continued stay; plan toward future disposition"
        : "No CEC outcome recorded",
      "Record the CEC outcome that sets the discharge path",
    ),
    milestone("discharge", "aftercare-plan", "Aftercare / step-down plan", "clinician", "Social services (no app role yet)", "Not built", "No aftercare planning surface exists", "Build discharge-planning workspace (aftercare, meds, follow-up appointments)"),
    milestone("discharge", "discharge-notifications", "Discharge notifications (R.S. 28:53.1)", "compliance", "Compliance / legal officer", "Not built", "Notification duties referenced in e-PEC docs only", "Build counsel-validated notification checklist"),
  );

  // ---- Post-discharge ----
  milestones.push(
    milestone("postdischarge", "followup-contact", "Post-discharge follow-up contact", "central", "Central intake coordinator", "Not built", "No follow-up surface exists", "Build follow-up tracking (contact windows, readmission risk)"),
    milestone("postdischarge", "outcome-recorded", "Outcome recorded for network learning", "executive", "Executive / program director", "Not built", "Decision-engine feedback loop not implemented", "Feed disposition outcomes back into routing/decision support"),
  );

  const phases: JourneyPhaseReading[] = journeyPhaseOrder.map(({ id, label }) => {
    const phaseMilestones = milestones.filter((item) => item.phase === id);
    const notBuilt = phaseMilestones.filter((item) => item.status === "Not built").length;
    const built = phaseMilestones.length - notBuilt;
    const completed = phaseMilestones.filter((item) => item.status === "Complete").length;
    const percent = built === 0 ? 0 : Math.round((completed / built) * 100);
    return { phase: id, label, milestones: phaseMilestones, completed, built, notBuilt, percent };
  });

  const nextAction =
    milestones.find((item) => item.status === "Pending" || item.status === "In progress") ?? null;
  const buildGaps = milestones.filter((item) => item.status === "Not built");

  return { caseId, phases, nextAction, buildGaps };
}

// Simulated handoff feed: for every open case, who owns the next actionable
// milestone. Display-only — nothing is sent to anyone.
export function deriveHandoffFeed(state: AppState, nowIso: string): HandoffGroup[] {
  const groups = new Map<string, HandoffItem[]>();
  for (const caseRecord of sortCases(state.cases)) {
    const reading = deriveJourney(state, caseRecord.id, nowIso);
    if (!reading.nextAction) continue;
    const item: HandoffItem = {
      caseId: caseRecord.id,
      caseLabel: caseRecord.patientToken.displayName,
      priority: caseRecord.priority,
      milestone: reading.nextAction,
    };
    const key = reading.nextAction.responsibleLabel;
    groups.set(key, [...(groups.get(key) ?? []), item]);
  }
  return [...groups.entries()]
    .map(([responsibleLabel, items]) => ({ responsibleLabel, items }))
    .sort((a, b) => a.responsibleLabel.localeCompare(b.responsibleLabel));
}
