import { useEffect, useState } from "react";
import { LayoutDashboard } from "lucide-react";
import { StatusBadge } from "../components/StatusBadge";
import { caseIsEscalated, readCaseClocks, type ClockReading } from "../domain/clocks";
import { sortCases } from "../domain/selectors";
import type { AppState } from "../domain/types";

function clockTone(status: ClockReading["status"]): "info" | "warn" | "danger" | "good" {
  if (status === "Breached") return "danger";
  if (status === "Due soon") return "warn";
  if (status === "Stopped") return "good";
  return "info";
}

function formatRemaining(reading: ClockReading): string {
  if (reading.status === "Stopped") return "stopped";
  if (reading.remainingMinutes <= 0) return `${Math.abs(reading.remainingMinutes)}m over`;
  return `${reading.remainingMinutes}m left`;
}

export function CommandCenter({ state, onSelect }: { state: AppState; onSelect: (caseId: string) => void }) {
  const [nowIso, setNowIso] = useState(() => new Date().toISOString());

  useEffect(() => {
    const timer = setInterval(() => setNowIso(new Date().toISOString()), 30000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="panel">
      <div className="panel-title">
        <div className="icon-title"><LayoutDashboard size={18} /><h2>Central Intake Command Center</h2></div>
        <p>Clock targets are configurable demo values, not statutory truth. Legal timing requires counsel validation. Financial lane never blocks the clinical lane.</p>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Case</th>
              <th>Stage</th>
              <th>Clinical lane</th>
              <th>Financial lane</th>
              <th>Packet</th>
              <th>Clocks</th>
              <th>Escalation</th>
            </tr>
          </thead>
          <tbody>
            {sortCases(state.cases).map((caseRecord) => {
              const encounter = state.encounters.find((item) => item.caseId === caseRecord.id);
              const assessment = state.assessments.find((item) => item.caseId === caseRecord.id);
              const readings = readCaseClocks(state, caseRecord.id, nowIso);
              const escalated = caseIsEscalated(state, caseRecord.id, nowIso);
              return (
                <tr className={escalated ? "escalated-row" : ""} key={caseRecord.id} onClick={() => onSelect(caseRecord.id)}>
                  <td>
                    <button className="link-button" type="button">{caseRecord.patientToken.displayName}</button>
                    <span className="subtext">{caseRecord.id}</span>
                  </td>
                  <td><StatusBadge tone="info">{caseRecord.currentStage}</StatusBadge></td>
                  <td>{assessment ? assessment.reviewStatus : "No assessment"}</td>
                  <td>{encounter?.insuranceStatus ?? "Unknown"}</td>
                  <td>
                    <span className={caseRecord.packetCompleteness >= 95 ? "" : "subtext-warn"}>
                      {caseRecord.packetCompleteness}%{caseRecord.packetCompleteness < 95 ? " (below 95% target)" : ""}
                    </span>
                  </td>
                  <td>
                    <div className="clock-stack">
                      {readings.length ? readings.map((reading) => (
                        <span className="clock-chip" key={reading.clock.id}>
                          <StatusBadge tone={clockTone(reading.status)}>{reading.status}</StatusBadge>
                          <span>{reading.clock.label} · {formatRemaining(reading)}</span>
                          {reading.clock.counselValidationRequired ? <em>counsel validation required</em> : null}
                        </span>
                      )) : <span className="subtext">No clocks</span>}
                    </div>
                  </td>
                  <td>{escalated ? <StatusBadge tone="danger">Escalated</StatusBadge> : <span className="subtext">None</span>}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <footer className="panel-footer">Escalation fires when any clock breaches its configured target. Baseline transfer timing: No measurements found.</footer>
    </section>
  );
}
