import { canonicalJson, sha256 } from "./hashLedger";
import type { AppState, ReferralPacket } from "./types";

export interface PacketChecklistItem {
  label: string;
  present: boolean;
  detail: string;
}

export function computePacketChecklist(state: AppState, caseId: string): PacketChecklistItem[] {
  const assessment = state.assessments.find((item) => item.caseId === caseId);
  const risks = state.riskFindings.filter((item) => item.caseId === caseId);
  const sources = state.sourceReferences.filter((item) => item.caseId === caseId);
  const medicalNecessity = state.medicalNecessitySnapshots.find((item) => item.caseId === caseId);
  const legal = state.legalInstruments.find((item) => item.caseId === caseId);

  return [
    {
      label: "Assessment summary",
      present: Boolean(assessment && assessment.presentingProblem.trim().length > 0),
      detail: assessment ? "Structured assessment captured." : "No assessment on file.",
    },
    {
      label: "Risk formulation",
      present: Boolean(assessment && assessment.formulation.trim().length >= 24),
      detail: "Ideation, plan, intent, means, protective factors, and collateral.",
    },
    {
      label: "Source-linked risk findings",
      present: risks.length > 0 && risks.every((risk) => risk.sourceReferenceIds.length > 0),
      detail: risks.length ? `${risks.length} finding(s) on file.` : "No risk findings recorded.",
    },
    {
      label: "Source references",
      present: sources.length > 0,
      detail: sources.length ? `${sources.length} reference(s) attached.` : "No source references attached.",
    },
    {
      label: "Medical necessity draft",
      present: Boolean(medicalNecessity && medicalNecessity.draftNarrative.trim().length > 0),
      detail: "Draft only. Requires clinician review before any final determination.",
    },
    {
      label: "Legal status draft",
      present: Boolean(legal && legal.legalStatus !== "Unknown"),
      detail: "Counsel validation required for statutory language and clocks.",
    },
    {
      label: "Collateral documented",
      present: assessment?.collateralStatus === "Documented",
      detail: `Collateral status: ${assessment?.collateralStatus ?? "Unknown"}.`,
    },
  ];
}

export function computePacketCompleteness(state: AppState, caseId: string): number {
  const checklist = computePacketChecklist(state, caseId);
  if (!checklist.length) return 0;
  return Math.round((checklist.filter((item) => item.present).length / checklist.length) * 100);
}

export async function buildPacketForCase(state: AppState, caseId: string): Promise<ReferralPacket> {
  const checklist = computePacketChecklist(state, caseId);
  const completeness = computePacketCompleteness(state, caseId);
  const assessment = state.assessments.find((item) => item.caseId === caseId);
  const risks = state.riskFindings.filter((item) => item.caseId === caseId);
  const sources = state.sourceReferences.filter((item) => item.caseId === caseId);
  const medicalNecessity = state.medicalNecessitySnapshots.find((item) => item.caseId === caseId);
  const legal = state.legalInstruments.find((item) => item.caseId === caseId);

  const packetHash = await sha256(canonicalJson({
    caseId,
    assessment: assessment ?? null,
    risks,
    sources,
    medicalNecessity: medicalNecessity ?? null,
    legal: legal ?? null,
  }));

  return {
    id: `packet-${caseId}`,
    caseId,
    status: "Ready",
    completeness,
    includedArtifactLabels: checklist.filter((item) => item.present).map((item) => item.label),
    packetHash,
  };
}
