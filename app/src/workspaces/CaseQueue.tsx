import { StatusBadge } from "../components/StatusBadge";
import { evaluatePitfallGuards } from "../domain/guardrails";
import { sortCases } from "../domain/selectors";
import type { AppState } from "../domain/types";

export function CaseQueue({ state, selectedCaseId, onSelect }: { state: AppState; selectedCaseId: string; onSelect: (caseId: string) => void }) {
  return (
    <section className="panel">
      <div className="panel-title">
        <h2>Case Queue</h2>
        <p>Fake demo cases only. No production PHI.</p>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Case</th>
              <th>Stage</th>
              <th>Priority</th>
              <th>Risk</th>
              <th>Packet</th>
              <th>Routing</th>
              <th>Attention</th>
            </tr>
          </thead>
          <tbody>
            {sortCases(state.cases).map((caseRecord) => {
              const assessment = state.assessments.find((item) => item.caseId === caseRecord.id);
              const riskFindings = state.riskFindings.filter((item) => item.caseId === caseRecord.id);
              const medicalNecessity = state.medicalNecessitySnapshots.find((item) => item.caseId === caseRecord.id);
              const legalInstrument = state.legalInstruments.find((item) => item.caseId === caseRecord.id);
              const guards = evaluatePitfallGuards({ caseRecord, assessment, riskFindings, medicalNecessity, legalInstrument });
              return (
                <tr
                  className={caseRecord.id === selectedCaseId ? "selected-row" : ""}
                  key={caseRecord.id}
                  onClick={() => onSelect(caseRecord.id)}
                >
                  <td>
                    <button className="link-button" type="button">{caseRecord.patientToken.displayName}</button>
                    <span className="subtext">{caseRecord.id}</span>
                  </td>
                  <td><StatusBadge tone="info">{caseRecord.currentStage}</StatusBadge></td>
                  <td>
                    <StatusBadge tone={caseRecord.priority === "Emergent" ? "danger" : caseRecord.priority === "Urgent" ? "warn" : "neutral"}>
                      {caseRecord.priority}
                    </StatusBadge>
                  </td>
                  <td>{riskFindings.length ? `${riskFindings.length} finding(s)` : "None recorded"}</td>
                  <td>{caseRecord.packetCompleteness}%</td>
                  <td>{caseRecord.routingStatus}</td>
                  <td>{guards.length ? <StatusBadge tone="warn">{guards.length} item(s)</StatusBadge> : <span className="subtext">None</span>}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <footer className="panel-footer">Demo queue only. Open a case for detail; governed case status is available separately when signed in.</footer>
    </section>
  );
}
