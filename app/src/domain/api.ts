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

/** Human-readable explanations for the API's uniform error codes. */
export function describeApiError(error: unknown): string {
  if (!(error instanceof ApiError)) return "Unexpected error.";
  switch (error.code) {
    case "api_unreachable":
      return "API server is not running. Start it with: npm run api:dev";
    case "authentication_failed":
      return "Not authenticated — the session is missing, expired, or revoked.";
    case "permission_denied":
      return "The verified role behind this session is not permitted to run this command.";
    case "case_not_found":
      return "No case with that key is visible to this session's organization.";
    case "invalid_request":
      return "The request was rejected by validation (unknown or missing fields).";
    default:
      return `Request failed (${error.status || "network"}: ${error.code}).`;
  }
}
