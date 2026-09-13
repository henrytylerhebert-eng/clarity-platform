/**
 * Client for the local API vertical slice (packages/api-service), reached
 * through the Vite dev proxy at /api (see vite.config.ts). This is the one
 * place in the prototype where identity is REAL: the token comes from
 * AuthenticationService via POST /api/auth/login, and every action's roles
 * and tenancy are derived server-side from that verified session — the app's
 * role selector has no influence here.
 *
 * The bearer token lives in module memory only (never localStorage), so a
 * reload ends the client's knowledge of the session; the server session
 * itself expires on its own TTL or via logout.
 */

export interface VerifiedPrincipal {
  userId: string;
  organizationId: string;
  displayName: string;
  roles: string[];
  sessionId: string;
  expiresAt: string;
}

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
  ) {
    super(code);
    this.name = "ApiError";
  }
}

let bearerToken: string | null = null;

export async function apiRevOps<T>(path: string, body?: unknown): Promise<T> {
  const response = await request(`/api/rev-ops${path}`, {
    token: true,
    ...(body === undefined ? {} : { method: "POST", body: JSON.stringify(body) }),
  });
  return response.json() as Promise<T>;
}

export async function apiRevOpsExport(path: string, body: {workspaceRevision:number; receiptHash:string}): Promise<Blob> {
  const response=await request(`/api/rev-ops${path}`,{token:true,method:"POST",body:JSON.stringify(body)});
  if(!response.headers.get("content-type")?.includes("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")) throw new ApiError(502,"invalid_export_response");
  return response.blob();
}

export async function apiIopReconciliation<T>(path: string, body?: unknown): Promise<T> {
  const response = await request(`/api/iop${path}`, {
    token: true,
    ...(body === undefined ? {} : { method: "POST", body: JSON.stringify(body) }),
  });
  return response.json() as Promise<T>;
}

async function request(path: string, init?: RequestInit & { token?: boolean }): Promise<Response> {
  const headers: Record<string, string> = init?.body === undefined ? {} : { "content-type": "application/json" };
  if (init?.token) {
    if (!bearerToken) throw new ApiError(401, "authentication_failed");
    headers.authorization = `Bearer ${bearerToken}`;
  }
  let response: Response;
  try {
    response = await fetch(path, { ...init, headers });
  } catch {
    // Server not running / proxy target down — surfaced as its own state.
    throw new ApiError(0, "api_unreachable");
  }
  if (!response.ok) {
    let code = "internal_error";
    try {
      code = ((await response.json()) as { error?: string }).error ?? code;
    } catch {
      /* keep the fallback code */
    }
    throw new ApiError(response.status, code);
  }
  return response;
}

export async function apiLogin(assertion: string): Promise<VerifiedPrincipal> {
  const response = await request("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ assertion }),
  });
  const body = (await response.json()) as { token: string; principal: VerifiedPrincipal };
  bearerToken = body.token;
  return body.principal;
}

export async function apiLogout(): Promise<void> {
  if (!bearerToken) return;
  try {
    await request("/api/auth/logout", { method: "POST", token: true });
  } finally {
    bearerToken = null;
  }
}

export interface DecisionRationaleResult {
  caseKey: string;
  version: number | null;
  replayed: boolean;
}

export async function apiRecordDecisionRationale(input: {
  caseKey: string;
  reason: string;
  decisionContext: string;
  citedLegalStatusRecordId?: string;
}): Promise<DecisionRationaleResult> {
  const response = await request(`/api/cases/${encodeURIComponent(input.caseKey)}/decision-rationale`, {
    method: "POST",
    token: true,
    body: JSON.stringify({
      reason: input.reason,
      decisionContext: input.decisionContext,
      ...(input.citedLegalStatusRecordId ? { citedLegalStatusRecordId: input.citedLegalStatusRecordId } : {}),
    }),
  });
  return (await response.json()) as DecisionRationaleResult;
}

export interface AssuranceParticipantDto {
  userId: string;
  role: "OWNER" | "EVIDENCE_CONTRIBUTOR" | "QUALIFIED_REVIEWER";
  authorityBasis: string | null;
  active: boolean;
  grantedAt: string;
}

export interface AssuranceApplicabilityDto {
  id: string;
  status: "PENDING" | "APPROVED" | "NOT_APPLICABLE" | "CONDITIONAL";
  rationale: string;
  approvedBy: string | null;
  approvedAt: string | null;
  version: number;
  createdAt: string;
}

export interface AssuranceSourceDto {
  id: string;
  sourceFamilyKey: string;
  versionLabel: string;
  title: string;
  authorityClass: string;
  citation: string;
  sourceUri: string | null;
  effectiveAt: string | null;
  currentness: "CURRENT" | "STALE" | "SUPERSEDED" | "UNKNOWN";
  rightsStatus: "PERMITTED" | "RESTRICTED" | "UNKNOWN";
}

export interface AssuranceDocumentReferenceDto {
  id: string;
  kind: "POLICY" | "SOP";
  referenceKey: string;
  title: string;
  versionLabel: string;
  locator: string | null;
  createdAt: string;
}

export interface AssuranceEvidenceSubmissionDto {
  id: string;
  expectationId: string;
  payload: Record<string, unknown>;
  status: "SUBMITTED" | "ACCEPTED" | "REJECTED" | "NEEDS_CLARIFICATION" | "SUPERSEDED";
  version: number;
  submittedBy: string;
  submittedAt: string;
  reviewedBy: string | null;
  reviewedAt: string | null;
  supersededById: string | null;
}

export interface AssuranceEvidenceExpectationDto {
  id: string;
  code: string;
  prompt: string;
  requiredKeys: string[];
  createdAt: string;
  submissions: AssuranceEvidenceSubmissionDto[];
}

export interface AssuranceReviewDecisionDto {
  id: string;
  evaluationId: string;
  decision: "ACCEPT" | "REJECT" | "REQUEST_MORE_EVIDENCE" | "REVIEW_REQUIRED";
  rationale: string | null;
  reviewerUserId: string;
  createdAt: string;
}

export interface AssuranceEvaluationDto {
  id: string;
  evidenceSubmissionId: string | null;
  result:
    | "SUPPORTED"
    | "PARTIALLY_SUPPORTED"
    | "MISSING_EVIDENCE"
    | "CONFLICT"
    | "STALE_SOURCE"
    | "APPLICABILITY_PENDING"
    | "RIGHTS_RESTRICTED"
    | "REVIEW_REQUIRED"
    | "UNKNOWN";
  reasonCodes: string[];
  requiresHumanReview: true;
  createdAt: string;
  revision: number;
  reviewDecisions?: AssuranceReviewDecisionDto[];
}

export interface AssuranceSourceConflictDto {
  id: string;
  status: "OPEN" | "RESOLVED";
  leftSourceId: string;
  rightSourceId: string;
  note: string | null;
  createdAt: string;
}

export interface AssuranceCaseViewDto {
  id: string;
  organizationId: string;
  facilityProfileId: string;
  caseKey: string;
  title: string;
  assuranceStatement: string;
  version: number;
  participants: AssuranceParticipantDto[];
  applicability: AssuranceApplicabilityDto[];
  sources: AssuranceSourceDto[];
  documentReferences: AssuranceDocumentReferenceDto[];
  evidenceExpectations: AssuranceEvidenceExpectationDto[];
  sourceConflicts: AssuranceSourceConflictDto[];
  evaluations: AssuranceEvaluationDto[];
}

export interface AssuranceHistoryEntryDto {
  kind: "EVIDENCE" | "EVALUATION" | "REVIEW";
  id: string;
  occurredAt: string;
  state: string;
  version: number;
  relatedId?: string;
}

export async function apiAssuranceGetCase(caseKey: string): Promise<AssuranceCaseViewDto> {
  const response = await request(`/api/assurance/cases/${encodeURIComponent(caseKey)}`, { token: true });
  return (await response.json()) as AssuranceCaseViewDto;
}

export async function apiAssuranceGetHistory(caseKey: string): Promise<AssuranceHistoryEntryDto[]> {
  const response = await request(`/api/assurance/cases/${encodeURIComponent(caseKey)}/history`, { token: true });
  return (await response.json()) as AssuranceHistoryEntryDto[];
}

export async function apiAssuranceSubmitEvidence(input: {
  caseKey: string;
  expectationId: string;
  payload: Record<string, unknown>;
}): Promise<AssuranceEvidenceSubmissionDto> {
  const response = await request(`/api/assurance/cases/${encodeURIComponent(input.caseKey)}/evidence`, {
    method: "POST",
    token: true,
    body: JSON.stringify({ expectationId: input.expectationId, payload: input.payload }),
  });
  return (await response.json()) as AssuranceEvidenceSubmissionDto;
}

export async function apiAssuranceReviseEvidence(input: {
  caseKey: string;
  priorSubmissionId: string;
  payload: Record<string, unknown>;
}): Promise<AssuranceEvidenceSubmissionDto> {
  const response = await request(`/api/assurance/cases/${encodeURIComponent(input.caseKey)}/evidence/revisions`, {
    method: "POST",
    token: true,
    body: JSON.stringify({ priorSubmissionId: input.priorSubmissionId, payload: input.payload }),
  });
  return (await response.json()) as AssuranceEvidenceSubmissionDto;
}

export async function apiAssuranceEvaluate(input: {
  caseKey: string;
  expectationId: string;
}): Promise<AssuranceEvaluationDto> {
  const response = await request(`/api/assurance/cases/${encodeURIComponent(input.caseKey)}/evaluate`, {
    method: "POST",
    token: true,
    body: JSON.stringify({ expectationId: input.expectationId }),
  });
  return (await response.json()) as AssuranceEvaluationDto;
}

export async function apiAssuranceReview(input: {
  evaluationId: string;
  decision: AssuranceReviewDecisionDto["decision"];
  rationale?: string;
}): Promise<AssuranceReviewDecisionDto> {
  const response = await request(`/api/assurance/evaluations/${encodeURIComponent(input.evaluationId)}/review`, {
    method: "POST",
    token: true,
    body: JSON.stringify({
      decision: input.decision,
      ...(input.rationale?.trim() ? { rationale: input.rationale.trim() } : {}),
    }),
  });
  return (await response.json()) as AssuranceReviewDecisionDto;
}

/** Human-readable explanations for the API's uniform error codes. */
export function describeApiError(error: unknown): string {
  if (!(error instanceof ApiError)) return "Unexpected error.";
  switch (error.code) {
    case "api_unreachable":
      return "API server is not running. Start it with: npm run api:dev";
    case "authentication_failed":
      return "Not authenticated — the session is missing, expired, or revoked.";
    case "permission_denied":
    case "assurance_permission_denied":
      return "The verified session is not permitted to perform this action.";
    case "case_not_found":
    case "assurance_resource_not_found":
      return "The requested resource is not visible to this session's organization.";
    case "review_requires_current_evaluation":
      return "This evaluation is no longer current. Reload the case before reviewing.";
    case "review_requires_current_evidence":
    case "review_requires_submitted_evidence":
    case "review_decision_requires_evidence":
      return "The evidence state changed. Reload the case before reviewing.";
    case "review_rationale_required":
      return "A reviewer rationale is required for this decision.";
    case "invalid_request":
      return "The request was rejected by validation (unknown or missing fields).";
    default:
      return `Request failed (${error.status || "network"}: ${error.code}).`;
  }
}
