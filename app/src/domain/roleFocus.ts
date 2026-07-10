import { evaluateClock } from "./clocks";
import { evaluatePitfallGuards } from "./guardrails";
import { unitAcuitySummary } from "./bedboard";
import type { RoleId } from "./roles";
import type { AppState } from "./types";

export interface FocusChip {
  label: string;
  value: string;
  tone: "info" | "warn" | "danger" | "good" | "neutral";
}

function countTone(count: number, dangerAt = 1): FocusChip["tone"] {
  return count >= dangerAt ? "danger" : "good";
}

export function getRoleFocus(roleId: RoleId, state: AppState, caseId: string, nowIso: string): FocusChip[] {
  const breachedClocks = state.complianceClocks.filter((clock) => evaluateClock(clock, nowIso).status === "Breached").length;
  const dueSoonClocks = state.complianceClocks.filter((clock) => evaluateClock(clock, nowIso).status === "Due soon").length;

  switch (roleId) {
    case "field": {
      const caseRecord = state.cases.find((item) => item.id === caseId);
      const assessment = state.assessments.find((item) => item.caseId === caseId);
      const guards = caseRecord
        ? evaluatePitfallGuards({
            caseRecord,
            assessment,
            riskFindings: state.riskFindings.filter((item) => item.caseId === caseId),
            medicalNecessity: state.medicalNecessitySnapshots.find((item) => item.caseId === caseId),
            legalInstrument: state.legalInstruments.find((item) => item.caseId === caseId),
          })
        : [];
      return [
        { label: "My case stage", value: caseRecord?.currentStage ?? "None", tone: "info" },
        { label: "Collateral", value: assessment?.collateralStatus ?? "Unknown", tone: assessment?.collateralStatus === "Documented" ? "good" : "warn" },
        { label: "Pitfall guards", value: String(guards.length), tone: guards.length ? "warn" : "good" },
      ];
    }
    case "central": {
      const belowTarget = state.cases.filter((item) => item.packetCompleteness < 95).length;
      const pendingReferrals = state.facilityReferrals.filter((item) => item.status === "Sent").length;
      return [
        { label: "Breached clocks", value: String(breachedClocks), tone: countTone(breachedClocks) },
        { label: "Due soon", value: String(dueSoonClocks), tone: dueSoonClocks ? "warn" : "good" },
        { label: "Packets below 95%", value: String(belowTarget), tone: belowTarget ? "warn" : "good" },
        { label: "Awaiting facility response", value: String(pendingReferrals), tone: "info" },
      ];
    }
    case "clinician": {
      const needsReview =
        state.assessments.filter((item) => item.reviewStatus === "Needs clinician review").length +
        state.medicalNecessitySnapshots.filter((item) => item.reviewStatus === "Needs clinician review").length +
        state.riskFindings.filter((item) => item.reviewStatus === "Needs clinician review").length;
      const missingFormulations = state.assessments.filter((item) => item.formulation.trim().length < 24).length;
      return [
        { label: "Needs clinician review", value: String(needsReview), tone: needsReview ? "warn" : "good" },
        { label: "Missing formulations", value: String(missingFormulations), tone: missingFormulations ? "warn" : "good" },
      ];
    }
    case "ur": {
      const pendingInsurance = state.encounters.filter((item) => item.insuranceStatus !== "Verified").length;
      const financialClocks = state.complianceClocks.filter(
        (clock) => clock.lane === "Financial" && evaluateClock(clock, nowIso).status !== "Stopped",
      ).length;
      const documentationGaps = state.medicalNecessitySnapshots.reduce((sum, item) => sum + item.missingItems.length, 0);
      return [
        { label: "Verification pending", value: String(pendingInsurance), tone: pendingInsurance ? "warn" : "good" },
        { label: "Financial clocks running", value: String(financialClocks), tone: "info" },
        { label: "Documentation gaps", value: String(documentationGaps), tone: documentationGaps ? "warn" : "good" },
      ];
    }
    case "facility": {
      const incoming = state.facilityReferrals.filter((item) => item.status === "Sent").length;
      const responded = state.facilityResponses.length;
      return [
        { label: "Incoming packets", value: String(incoming), tone: incoming ? "warn" : "good" },
        { label: "Responses on record", value: String(responded), tone: "info" },
      ];
    }
    case "nurse": {
      const availableBeds = state.beds.filter((item) => item.status === "Available").length;
      const pendingRecommendations = state.placementRecommendations.filter((item) => item.status === "Suggested").length;
      const unitsOverCeiling = state.units.filter(
        (unit) => unitAcuitySummary(unit, state.beds.filter((bed) => bed.unitId === unit.id)).averageAcuity > unit.acuityCeiling,
      ).length;
      return [
        { label: "Available beds", value: String(availableBeds), tone: availableBeds ? "good" : "danger" },
        { label: "Pending placements", value: String(pendingRecommendations), tone: pendingRecommendations ? "warn" : "good" },
        { label: "Units over acuity ceiling", value: String(unitsOverCeiling), tone: countTone(unitsOverCeiling) },
      ];
    }
    case "compliance": {
      const counselQueue = state.legalInstruments.filter((item) => item.reviewStatus === "Counsel validation required").length;
      const ledgerEvents = state.custodyLedgerEvents.length;
      return [
        { label: "Counsel validation queue", value: String(counselQueue), tone: counselQueue ? "warn" : "good" },
        { label: "Breached clocks", value: String(breachedClocks), tone: countTone(breachedClocks) },
        { label: "Custody events", value: String(ledgerEvents), tone: "info" },
      ];
    }
    case "executive": {
      const accepted = state.facilityReferrals.filter((item) => item.status === "Accepted").length;
      const declined = state.facilityReferrals.filter((item) => item.status === "Declined").length;
      return [
        { label: "Active cases", value: String(state.cases.length), tone: "info" },
        { label: "Accepted / declined", value: `${accepted} / ${declined}`, tone: "info" },
        { label: "Breached clocks", value: String(breachedClocks), tone: countTone(breachedClocks) },
        { label: "Baseline outcomes", value: "No measurements found", tone: "neutral" },
      ];
    }
    default:
      return [];
  }
}
