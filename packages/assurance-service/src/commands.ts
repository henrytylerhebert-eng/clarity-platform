import { z } from "zod";
import { ASSURANCE_REVIEW_DECISIONS } from "@clarity/domain-contracts";

// Every other command service (prescreen, case) validates with a strict Zod
// envelope at the service boundary, independent of whatever the HTTP layer
// does — so the command service is safe to call directly. Unknown fields are
// rejected (`.strict()`), matching that same discipline.
const ASSURANCE_ID = z.string().min(1).max(200);
const ASSURANCE_PAYLOAD = z.record(z.unknown());

export const SubmitAssuranceEvidenceCommandSchema = z
  .object({
    caseKey: ASSURANCE_ID,
    expectationId: ASSURANCE_ID,
    payload: ASSURANCE_PAYLOAD,
  })
  .strict();
export type SubmitAssuranceEvidenceCommand = z.infer<typeof SubmitAssuranceEvidenceCommandSchema>;

export const ReviseAssuranceEvidenceCommandSchema = z
  .object({
    caseKey: ASSURANCE_ID,
    priorSubmissionId: ASSURANCE_ID,
    payload: ASSURANCE_PAYLOAD,
  })
  .strict();
export type ReviseAssuranceEvidenceCommand = z.infer<typeof ReviseAssuranceEvidenceCommandSchema>;

export const EvaluateAssuranceCommandSchema = z
  .object({
    caseKey: ASSURANCE_ID,
    expectationId: ASSURANCE_ID,
  })
  .strict();
export type EvaluateAssuranceCommand = z.infer<typeof EvaluateAssuranceCommandSchema>;

export const ReviewAssuranceEvaluationCommandSchema = z
  .object({
    caseKey: ASSURANCE_ID,
    evaluationId: ASSURANCE_ID,
    decision: z.enum(ASSURANCE_REVIEW_DECISIONS),
    rationale: z.string().max(5000).optional(),
  })
  .strict();
export type ReviewAssuranceEvaluationCommand = z.infer<typeof ReviewAssuranceEvaluationCommandSchema>;
