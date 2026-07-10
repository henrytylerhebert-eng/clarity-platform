import type { AppState, Case } from "./types";

export function getCaseBundle(state: AppState, caseId: string) {
  return {
    caseRecord: state.cases.find((item) => item.id === caseId),
    encounter: state.encounters.find((item) => item.caseId === caseId),
    assessment: state.assessments.find((item) => item.caseId === caseId),
    sourceReferences: state.sourceReferences.filter((item) => item.caseId === caseId),
    riskFindings: state.riskFindings.filter((item) => item.caseId === caseId),
    medicalNecessity: state.medicalNecessitySnapshots.find((item) => item.caseId === caseId),
    legalInstrument: state.legalInstruments.find((item) => item.caseId === caseId),
    packet: state.referralPackets.find((item) => item.caseId === caseId),
    referrals: state.facilityReferrals.filter((item) => item.caseId === caseId),
    ledgerEvents: state.custodyLedgerEvents.filter((item) => item.caseId === caseId),
  };
}

export function sortCases(cases: Case[]): Case[] {
  const priorityRank = { Emergent: 0, Urgent: 1, Routine: 2 };
  return [...cases].sort((a, b) => priorityRank[a.priority] - priorityRank[b.priority] || b.openedAt.localeCompare(a.openedAt));
}

