import {
  type ApproveReviewCommand,
  type ReconcilePackageCommand,
  type ReconcilePackageResult,
  type NetworkCommandResult,
  type NetworkReviewSubmitResult,
  type NetworkReviewTransitionResult,
  type RejectReviewCommand,
  type SubmitForReviewCommand,
} from "@clarity/domain-contracts";
import {
  createNetworkEnrichmentReviewRuntimeAdapter,
  type NetworkEnrichmentReviewRuntimeAdapter,
} from "./reviewRuntimeAdapter.js";

export type NetworkEnrichmentReviewInvocationResult =
  | NetworkCommandResult<NetworkReviewSubmitResult>
  | NetworkCommandResult<NetworkReviewTransitionResult>
  | NetworkCommandResult<ReconcilePackageResult>;

type ReviewSubmitInvocation = {
  commandType: "submitForReview";
  command: SubmitForReviewCommand;
};
type ReviewApproveInvocation = {
  commandType: "approveReview";
  command: ApproveReviewCommand;
};
type ReviewRejectInvocation = {
  commandType: "rejectReview";
  command: RejectReviewCommand;
};
type ReconcilePackageInvocation = {
  commandType: "reconcilePackage";
  command: ReconcilePackageCommand;
};

export type NetworkEnrichmentReviewInvocation =
  | ReviewSubmitInvocation
  | ReviewApproveInvocation
  | ReviewRejectInvocation
  | ReconcilePackageInvocation;

export interface NetworkEnrichmentReviewInvocationDeps {
  adapter?: NetworkEnrichmentReviewRuntimeAdapter;
}

export function invokeNetworkEnrichmentReviewCommand(
  invocation: ReviewSubmitInvocation,
  deps?: NetworkEnrichmentReviewInvocationDeps,
): Promise<NetworkCommandResult<NetworkReviewSubmitResult>>;
export function invokeNetworkEnrichmentReviewCommand(
  invocation: ReviewApproveInvocation | ReviewRejectInvocation,
  deps?: NetworkEnrichmentReviewInvocationDeps,
): Promise<NetworkCommandResult<NetworkReviewTransitionResult>>;
export function invokeNetworkEnrichmentReviewCommand(
  invocation: ReconcilePackageInvocation,
  deps?: NetworkEnrichmentReviewInvocationDeps,
): Promise<NetworkCommandResult<ReconcilePackageResult>>;
export function invokeNetworkEnrichmentReviewCommand(
  invocation: NetworkEnrichmentReviewInvocation,
  deps?: NetworkEnrichmentReviewInvocationDeps,
): Promise<NetworkEnrichmentReviewInvocationResult>;
export async function invokeNetworkEnrichmentReviewCommand(
  invocation: NetworkEnrichmentReviewInvocation,
  deps: NetworkEnrichmentReviewInvocationDeps = {},
): Promise<NetworkEnrichmentReviewInvocationResult> {
  const adapter = deps.adapter ?? createNetworkEnrichmentReviewRuntimeAdapter();
  switch (invocation.commandType) {
    case "submitForReview":
      return adapter.submitForReview(invocation.command);
    case "approveReview":
      return adapter.approveReview(invocation.command);
    case "rejectReview":
      return adapter.rejectReview(invocation.command);
    case "reconcilePackage":
      return adapter.reconcilePackage(invocation.command);
    default:
      throw new Error("Unsupported network enrichment review command.");
  }
}
