import { assertSameOrganization } from "@clarity/domain-contracts";
import type { Acknowledgement, AcknowledgementAction, NoticeCardView, PracticeObservation, RecognitionCandidate, UserRole } from "@clarity/domain-contracts";
import type { LearningPracticeGateway } from "./gateway.js";
import { stableId } from "./id.js";
import { CENTRAL_INTAKE_ROLE, competency } from "./seed.js";

export interface ActorScope {
  organizationId: string;
  actorId: string;
  roleFamily: UserRole;
}

/** Explicit demo configuration, never a production role or authenticated principal. */
export interface SyntheticReviewerIdentity {
  organizationId: string;
  actorId: string;
}

export interface ResolveContestInput {
  candidateId: string;
  actor: ActorScope;
  resolution: "CONFIRM" | "DISMISS";
  context: string;
}

export class RecognitionService {
  private readonly syntheticReviewer: SyntheticReviewerIdentity | undefined;

  constructor(
    private readonly gateway: LearningPracticeGateway,
    private readonly now: () => string = () => new Date().toISOString(),
    syntheticReviewer?: SyntheticReviewerIdentity,
  ) {
    this.syntheticReviewer = syntheticReviewer ? { ...syntheticReviewer } : undefined;
  }

  getNoticeCard(candidateId: string, viewer: ActorScope): NoticeCardView {
    const { candidate, observation } = this.requireOwned(candidateId, viewer);
    return {
      candidateId,
      observationId: observation.observationId,
      title: "Clarity noticed a strong evidence-integrity behavior in synthetic practice",
      observedBehavior: "You preserved contradictory source statements and routed the conflict for review instead of silently choosing a winner.",
      whyItMatters: "Preserving uncertainty protects downstream reviewers from treating one unverified version of the story as settled fact.",
      competencyLabel: `${competency.domain}: ${competency.definition}`,
      evidenceRefs: [...observation.evidenceRefs],
      ruleVersionLabel: `${observation.ruleId}@${observation.ruleVersion}`,
      confidence: observation.confidence,
      state: candidate.state,
      // A learner can contest; resolution belongs to the separately configured demo reviewer.
      allowedActions: candidate.state === "READY_TO_ACKNOWLEDGE" ? ["ACKNOWLEDGE", "ADD_CONTEXT", "CONTEST", "DISMISS"] : [],
    };
  }

  acknowledge(candidateId: string, actor: ActorScope): RecognitionCandidate {
    const { candidate, observation } = this.requireOwned(candidateId, actor);
    this.assertReady(candidate);
    candidate.state = "CONFIRMED";
    this.gateway.saveCandidate(actor.organizationId, candidate);
    this.record(candidateId, actor, "ACKNOWLEDGE", null);
    this.ensureCompetencyEvidence(candidate, observation);
    return candidate;
  }

  addContext(candidateId: string, actor: ActorScope, context: string): RecognitionCandidate {
    const { candidate } = this.requireOwned(candidateId, actor);
    this.assertReady(candidate);
    this.record(candidateId, actor, "ADD_CONTEXT", this.requireContext(context));
    return candidate;
  }

  contest(candidateId: string, actor: ActorScope, context: string): RecognitionCandidate {
    const { candidate, observation } = this.requireOwned(candidateId, actor);
    this.assertReady(candidate);
    const reason = this.requireContext(context);
    candidate.state = "CONTESTED";
    candidate.reviewOwnerId = this.syntheticReviewer?.organizationId === actor.organizationId && this.syntheticReviewer.actorId !== actor.actorId
      ? this.syntheticReviewer.actorId : null;
    observation.state = "NEEDS_REVIEW";
    observation.confidence = "CONTESTED";
    this.gateway.saveCandidate(actor.organizationId, candidate);
    this.gateway.saveObservation(actor.organizationId, observation);
    this.record(candidateId, actor, "CONTEST", reason);
    return candidate;
  }

  resolveContest(input: ResolveContestInput): RecognitionCandidate {
    const { candidate, observation } = this.requireRecords(input.candidateId, input.actor.organizationId);
    if (candidate.state !== "CONTESTED") throw new Error("Candidate is not contested");
    const reviewer = this.syntheticReviewer;
    if (!reviewer || reviewer.organizationId !== input.actor.organizationId || reviewer.actorId !== input.actor.actorId ||
      input.actor.actorId === observation.actorId || candidate.reviewOwnerId !== input.actor.actorId) {
      throw new Error("Only the configured distinct synthetic reviewer can resolve a contest");
    }
    const context = this.requireContext(input.context);
    if (input.resolution !== "CONFIRM" && input.resolution !== "DISMISS") throw new Error("Unsupported contest resolution");
    const confirmed = input.resolution === "CONFIRM";
    candidate.state = confirmed ? "CONFIRMED" : "DISMISSED";
    observation.state = confirmed ? "RECORDED" : "SUPERSEDED";
    observation.confidence = confirmed ? "HUMAN_REVIEWED" : "SUPERSEDED";
    this.gateway.saveCandidate(input.actor.organizationId, candidate);
    this.gateway.saveObservation(input.actor.organizationId, observation);
    this.record(input.candidateId, input.actor, "RESOLVE_CONTEST", `${input.resolution}: ${context}`);
    if (confirmed) this.ensureCompetencyEvidence(candidate, observation);
    return candidate;
  }

  dismiss(candidateId: string, actor: ActorScope, context: string): RecognitionCandidate {
    const { candidate, observation } = this.requireOwned(candidateId, actor);
    this.assertReady(candidate);
    const reason = this.requireContext(context);
    candidate.state = "DISMISSED";
    observation.state = "SUPERSEDED";
    observation.confidence = "SUPERSEDED";
    this.gateway.saveCandidate(actor.organizationId, candidate);
    this.gateway.saveObservation(actor.organizationId, observation);
    this.record(candidateId, actor, "DISMISS", reason);
    return candidate;
  }

  getAcknowledgementHistory(candidateId: string, viewer: ActorScope): Acknowledgement[] {
    this.requireOwned(candidateId, viewer);
    return this.gateway.listAcknowledgements(viewer.organizationId, candidateId);
  }

  private ensureCompetencyEvidence(candidate: RecognitionCandidate, observation: PracticeObservation): void {
    if (candidate.state !== "CONFIRMED" || observation.confidence === "CONTESTED") throw new Error("Recognition is not confirmed");
    this.gateway.saveCompetencyEvidence(observation.organizationId, {
      evidenceId: stableId("ce", [observation.organizationId, candidate.candidateId, observation.competencyId, observation.actorId]),
      organizationId: observation.organizationId,
      personId: observation.actorId,
      roleScope: CENTRAL_INTAKE_ROLE,
      competencyId: observation.competencyId,
      evidenceType: "SYNTHETIC_DEMONSTRATION",
      sourceRef: observation.observationId,
      validUntil: null,
      recordedAt: this.now(),
    });
  }

  private record(candidateId: string, actor: ActorScope, action: AcknowledgementAction, context: string | null): void {
    const recordedAt = this.now();
    this.gateway.saveAcknowledgement(actor.organizationId, {
      acknowledgementId: stableId("ack", [actor.organizationId, candidateId, actor.actorId, action, context ?? "", recordedAt]),
      organizationId: actor.organizationId,
      candidateId,
      actorId: actor.actorId,
      action,
      context,
      recordedAt,
    });
  }

  private requireRecords(candidateId: string, organizationId: string) {
    const candidate = this.gateway.getCandidate(organizationId, candidateId);
    if (!candidate) throw new Error("Recognition candidate not found in organization");
    assertSameOrganization(organizationId, candidate);
    const observation = this.gateway.getObservation(organizationId, candidate.observationId);
    if (!observation) throw new Error("Practice observation not found in organization");
    assertSameOrganization(organizationId, observation);
    return { candidate, observation };
  }

  private requireOwned(candidateId: string, actor: ActorScope) {
    const records = this.requireRecords(candidateId, actor.organizationId);
    if (records.observation.actorId !== actor.actorId || actor.roleFamily !== CENTRAL_INTAKE_ROLE) {
      throw new Error("Actor does not own this recognition candidate in the synthetic slice");
    }
    return records;
  }

  private assertReady(candidate: RecognitionCandidate): void {
    if (candidate.state !== "READY_TO_ACKNOWLEDGE") throw new Error("Candidate is not ready to acknowledge");
  }

  private requireContext(context: string): string {
    if (!context.trim()) throw new Error("Context is required");
    return context.trim();
  }
}
