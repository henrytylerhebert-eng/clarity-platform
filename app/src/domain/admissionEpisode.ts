import type { AdmissionEpisodeRecord, AppState } from "./types";

function serviceDateForTimezone(instant: string, timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date(instant));
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

export function getAdmissionEpisode(state: AppState, caseId: string): AdmissionEpisodeRecord | undefined {
  return state.admissionEpisodes?.find((item) => item.caseId === caseId);
}

export function isAdmissionEpisodeComplete(record: AdmissionEpisodeRecord | undefined): boolean {
  return Boolean(
    record
    && record.status === "ACTIVE"
    && record.admissionOrdersStatus === "Recorded"
    && record.initialPostAdmissionReviewStatus === "Recorded",
  );
}

export function createDefaultAdmissionEpisode(state: AppState, caseId: string, updatedAt = new Date().toISOString()): AdmissionEpisodeRecord {
  const acceptedReferral = state.facilityReferrals.find((item) => item.caseId === caseId && item.status === "Accepted");
  const acceptedPlacement = state.placementRecommendations.find((item) => item.caseId === caseId && item.status === "Accepted");
  const facilityTimezone = "America/Chicago";
  const serviceDate = serviceDateForTimezone(updatedAt, facilityTimezone);
  return {
    id: `episode-${caseId}`,
    caseId,
    sourceAcceptanceId: acceptedReferral?.id ?? "acceptance-pending",
    relationship: "ADMISSION_SOURCE",
    facilityId: acceptedReferral?.facilityName ?? "facility-pending",
    facilityName: acceptedReferral?.facilityName ?? "Facility not selected",
    programId: undefined,
    unitId: acceptedPlacement?.bedId,
    facilityTimezone,
    timezoneSourceReferenceId: "facility-config-poc",
    admittedAt: updatedAt,
    serviceDate,
    status: "ACTIVE",
    admissionOrdersStatus: "Not recorded",
    initialPostAdmissionReviewStatus: "Not recorded",
    sourcePacketVersionId: state.referralPackets.find((item) => item.caseId === caseId && item.status !== "Draft")?.id,
    sourceCustodyEventId: state.custodyLedgerEvents.find((item) => item.caseId === caseId && /ARRIVAL|CUSTODY_TRANSFER|HANDOFF/i.test(item.eventType))?.id,
    sourceReferenceIds: state.sourceReferences.filter((item) => item.caseId === caseId).map((item) => item.id),
    linkedAt: updatedAt,
    linkedBy: "Local prototype user",
    updatedAt,
  };
}
