import type { LearningPathView } from "@clarity/domain-contracts";
import type { LearningPracticeGateway } from "./gateway.js";
import type { ActorScope } from "./recognition.js";
import { CENTRAL_INTAKE_ROLE, centralIntakePathway, competency, learningModule } from "./seed.js";

export class LearningRegistryService {
  constructor(private readonly gateway: LearningPracticeGateway) {}

  getCentralIntakePath(viewer: ActorScope): LearningPathView {
    if (viewer.roleFamily !== CENTRAL_INTAKE_ROLE) throw new Error("Role is not eligible for this pathway");
    const evidence = this.gateway.listCompetencyEvidence(viewer.organizationId, viewer.actorId, competency.competencyId);
    return {
      pathway: structuredClone(centralIntakePathway),
      modules: [structuredClone(learningModule)],
      competencies: [{ competency: structuredClone(competency), evidence, demonstrated: evidence.length > 0 }],
    };
  }
}
