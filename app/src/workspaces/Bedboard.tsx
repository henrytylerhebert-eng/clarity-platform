import { useState } from "react";
import { BedDouble } from "lucide-react";
import { EmptyState, StatusBadge } from "../components/StatusBadge";
import { evaluatePlacement, unitAcuitySummary, validatePlacementDecision } from "../domain/bedboard";
import type { AppState, PlacementRecommendation } from "../domain/types";

interface Props {
  state: AppState;
  onDecision: (recommendation: PlacementRecommendation, decision: "Accepted" | "Overridden", overrideReason?: string) => void;
}

export function Bedboard({ state, onDecision }: Props) {
  const [overrideReason, setOverrideReason] = useState("");
  const [decisionError, setDecisionError] = useState<string | null>(null);

  const recommendation = state.placementRecommendations.find((item) => item.status === "Suggested");
  const decidedRecommendations = state.placementRecommendations.filter((item) => item.status !== "Suggested");
  const recommendedBed = recommendation ? state.beds.find((bed) => bed.id === recommendation.bedId) : undefined;
  const recommendedCase = recommendation ? state.cases.find((item) => item.id === recommendation.caseId) : undefined;
  const recommendedUnit = recommendedBed ? state.units.find((unit) => unit.id === recommendedBed.unitId) : undefined;
  const flags = recommendation && recommendedBed && recommendedUnit && recommendedCase
    ? evaluatePlacement(
        recommendation.candidateAcuity,
        recommendedCase.patientToken.ageBand,
        recommendedBed,
        recommendedUnit,
        state.beds.filter((bed) => bed.unitId === recommendedUnit.id),
      )
    : [];
  const hasHardStop = flags.some((flag) => flag.severity === "Hard stop");

  function decide(decision: "Accepted" | "Overridden") {
    if (!recommendation) return;
    const error = validatePlacementDecision(decision, decision === "Overridden" ? overrideReason : "n/a");
    if (error) {
      setDecisionError(error);
      return;
    }
    setDecisionError(null);
    onDecision(recommendation, decision, decision === "Overridden" ? overrideReason : undefined);
    setOverrideReason("");
  }

  return (
    <section className="panel">
      <div className="panel-title">
        <div className="icon-title"><BedDouble size={18} /><h2>Milieu Bedboard</h2></div>
        <p>Bed availability is not the same thing as safe placement. Recommendations are advisory; the charge nurse decision is final and overrides require a reason.</p>
      </div>

      {recommendation && recommendedBed && recommendedUnit && recommendedCase ? (
        <div className="recommendation-panel">
          <h3>Placement recommendation</h3>
          <p>
            <strong>{recommendedCase.patientToken.displayName}</strong> → {recommendedUnit.name}, bed {recommendedBed.label}.
            {" "}{recommendation.rationale}
          </p>
          <p className="subtext">
            Candidate acuity {recommendation.candidateAcuity.acuityLevel}/5 · aggression {recommendation.candidateAcuity.aggressionRisk} · elopement {recommendation.candidateAcuity.elopementRisk} · observation {recommendation.candidateAcuity.observationLevel}
          </p>
          <div className="guard-panel">
            <h4>Placement flags</h4>
            {flags.length ? flags.map((flag) => (
              <div className="guard-row" key={flag.code}>
                <StatusBadge tone={flag.severity === "Hard stop" ? "danger" : flag.severity === "Warning" ? "warn" : "info"}>{flag.severity}</StatusBadge>
                <span>{flag.message}</span>
              </div>
            )) : <p>No milieu risk flags for this placement.</p>}
          </div>
          <div className="decision-row">
            <button className="primary-button" type="button" disabled={hasHardStop} onClick={() => decide("Accepted")}>
              Accept recommendation
            </button>
            <label className="override-field">
              Override reason
              <input
                value={overrideReason}
                placeholder="Required to override"
                onChange={(event) => setOverrideReason(event.target.value)}
              />
            </label>
            <button className="secondary-button" type="button" onClick={() => decide("Overridden")}>
              Override recommendation
            </button>
          </div>
          {hasHardStop ? <p className="subtext-warn">Hard-stop flags block acceptance. Resolve the flag or override with a documented reason.</p> : null}
          {decisionError ? <p className="form-error">{decisionError}</p> : null}
        </div>
      ) : (
        <EmptyState title="No pending placement recommendation">
          Recommendations appear after a facility acceptance. Decided placements are logged below.
        </EmptyState>
      )}

      {decidedRecommendations.length ? (
        <div className="guard-panel">
          <h3>Placement decisions</h3>
          {decidedRecommendations.map((item) => {
            const bed = state.beds.find((candidate) => candidate.id === item.bedId);
            return (
              <div className="guard-row" key={item.id}>
                <StatusBadge tone={item.status === "Accepted" ? "good" : "warn"}>{item.status}</StatusBadge>
                <strong>{bed?.label ?? item.bedId}</strong>
                <span>{item.status === "Overridden" ? `Reason: ${item.overrideReason}` : `Decided by ${item.decidedBy ?? "Unknown"}`}</span>
              </div>
            );
          })}
        </div>
      ) : null}

      <div className="unit-grid">
        {state.units.map((unit) => {
          const unitBeds = state.beds.filter((bed) => bed.unitId === unit.id);
          const summary = unitAcuitySummary(unit, unitBeds);
          const overCeiling = summary.averageAcuity > unit.acuityCeiling;
          return (
            <article className="unit-card" key={unit.id}>
              <header>
                <h3>{unit.name}</h3>
                <StatusBadge tone={overCeiling ? "danger" : "info"}>
                  Avg acuity {summary.averageAcuity.toFixed(1)} / ceiling {unit.acuityCeiling}
                </StatusBadge>
              </header>
              <p className="subtext">
                {summary.occupiedBeds} occupied · {summary.availableBeds} available · staffing load: {summary.oneToOneCount}× 1:1, {summary.q15Count}× Q15
              </p>
              <div className="bed-grid">
                {unitBeds.map((bed) => (
                  <div
                    className={`bed-cell bed-${bed.status.toLowerCase()}${recommendation?.bedId === bed.id ? " bed-recommended" : ""}`}
                    key={bed.id}
                  >
                    <strong>{bed.label}</strong>
                    <span className="subtext">{bed.room}</span>
                    <span>{bed.status}</span>
                    {bed.occupantAcuity ? (
                      <span className="subtext">
                        Acuity {bed.occupantAcuity.acuityLevel} · {bed.occupantAcuity.observationLevel}
                        {bed.occupantAcuity.aggressionRisk === "High" ? " · High aggression" : ""}
                      </span>
                    ) : null}
                    {bed.nearExit ? <span className="subtext">Near exit</span> : null}
                    {bed.nearNurseStation ? <span className="subtext">Near nurse station</span> : null}
                  </div>
                ))}
              </div>
            </article>
          );
        })}
      </div>
      <footer className="panel-footer">Compatibility rules are demo heuristics pending clinical validation. Accept/override decisions are written to the custody ledger.</footer>
    </section>
  );
}
