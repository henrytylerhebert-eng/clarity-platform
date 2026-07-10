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
              <th>Patient token</th>
              <th>Age</th>
              <th>Stage</th>
              <th>Risk</th>
              <th>Medical necessity</th>
              <th>Legal</th>
              <th>Packet</th>
              <th>Routing</th>
              <th>Custody</th>
              <th>Missing flags</th>
            </tr>
          </thead>
          <tbody>
            {sortCases(state.cases).map((caseRecord) => {
              const assessment = state.assessments.find((item) => item.caseId === caseRecord.id);
              const riskFindings = state.riskFindings.filter((item) => item.caseId === caseRecord.id);
              const medicalNecessity = state.medicalNecessitySnapshots.find((item) => item.caseId === caseRecord.id);
              const legalInstrument = state.legalInstruments.find((item) => item.caseId === caseRecord.id);
              const guards = evaluatePitfallGuards({ caseRecord, assessment, riskFindings, medicalNecessity, legalInstrument });
              const ledgerEvents = state.custodyLedgerEvents.filter((item) => item.caseId === caseRecord.id);
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
                  <td>{caseRecord.patientToken.id}</td>
                  <td>{caseRecord.patientToken.ageBand}</td>
                  <td><StatusBadge tone="info">{caseRecord.currentStage}</StatusBadge></td>
                  <td>{riskFindings.length ? `${riskFindings.length} finding(s)` : "Unknown"}</td>
                  <td>{medicalNecessity?.reviewStatus ?? "Draft"}</td>
                  <td>{caseRecord.legalStatus}</td>
                  <td>{caseRecord.packetCompleteness}%</td>
                  <td>{caseRecord.routingStatus}</td>
                  <td>{ledgerEvents.length ? "Hash chain present" : "No custody events"}</td>
                  <td>{guards.length}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <footer className="panel-footer">Insurance and benefits status is visible in case detail, but does not block clinical workflow.</footer>
    </section>
  );
}
