import { CENTRAL_INTAKE_ROLE, centralIntakePathway, contradictionRule, learningModule, readPractice, type ActorScope, type PracticeState } from "../../domain/learningPractice";
import { StatusBadge } from "../StatusBadge";

export function MyPathPanel({ state, viewer }: { state: PracticeState; viewer: ActorScope }) {
  const current = readPractice(state, viewer);
  const evidence = current.candidate?.state === "CONFIRMED" && current.candidate.organizationId === viewer.organizationId && current.candidate.observationId === current.observation?.observationId && ["DETERMINISTIC", "HUMAN_REVIEWED"].includes(current.observation?.confidence ?? "") ? current.evidence.filter(item =>
    item.organizationId === viewer.organizationId && item.personId === viewer.actorId && item.sourceRef === current.observation?.observationId && item.competencyId === contradictionRule.competencyId && item.roleScope === CENTRAL_INTAKE_ROLE && item.evidenceType === "SYNTHETIC_DEMONSTRATION",
  ) : [];
  return (
    <section className="panel" aria-label="My Path">
      <div className="panel-title"><h3>My Path</h3><StatusBadge tone={evidence.length ? "good" : "info"}>{evidence.length ? "Demonstrated in synthetic practice" : "Not yet demonstrated"}</StatusBadge></div>
      <p>Central Intake · {centralIntakePathway.pathwayId}@{centralIntakePathway.version}</p>
      <p>{learningModule.title} · {learningModule.moduleId}@{learningModule.version}</p>
      <p>Preserve contradictory statements, avoid silently choosing a winner, and route for qualified review.</p>
      <p><strong>{evidence.length} confirmed synthetic competency evidence record{evidence.length === 1 ? "" : "s"}</strong></p>
      {evidence.map(item => <p key={item.evidenceId}>{item.competencyId} · {item.evidenceType} · {item.roleScope}</p>)}
      <p className="subtext">This does not establish live competency, HR credentialing, or clinical authority. No measurements found for training effectiveness.</p>
    </section>
  );
}
