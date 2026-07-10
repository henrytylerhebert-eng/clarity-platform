import type { AppState, ComplianceClock } from "./types";

export type ClockStatus = "Running" | "Due soon" | "Breached" | "Stopped";

export interface ClockReading {
  clock: ComplianceClock;
  status: ClockStatus;
  elapsedMinutes: number;
  remainingMinutes: number;
}

const DUE_SOON_THRESHOLD = 0.8;

export function evaluateClock(clock: ComplianceClock, nowIso: string): ClockReading {
  const endIso = clock.stoppedAt ?? nowIso;
  const elapsedMs = Date.parse(endIso) - Date.parse(clock.startedAt);
  const elapsedMinutes = Math.max(0, Math.round(elapsedMs / 60000));
  const remainingMinutes = clock.targetMinutes - elapsedMinutes;

  if (clock.stoppedAt) {
    return { clock, status: "Stopped", elapsedMinutes, remainingMinutes };
  }
  if (remainingMinutes <= 0) {
    return { clock, status: "Breached", elapsedMinutes, remainingMinutes };
  }
  if (elapsedMinutes >= clock.targetMinutes * DUE_SOON_THRESHOLD) {
    return { clock, status: "Due soon", elapsedMinutes, remainingMinutes };
  }
  return { clock, status: "Running", elapsedMinutes, remainingMinutes };
}

export function readCaseClocks(state: AppState, caseId: string, nowIso: string): ClockReading[] {
  return state.complianceClocks
    .filter((clock) => clock.caseId === caseId)
    .map((clock) => evaluateClock(clock, nowIso));
}

export function caseIsEscalated(state: AppState, caseId: string, nowIso: string): boolean {
  return readCaseClocks(state, caseId, nowIso).some((reading) => reading.status === "Breached");
}
