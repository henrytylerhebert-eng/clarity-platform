import {
  type ApproveReviewCommand,
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
  | NetworkCommandResult<NetworkReviewTransitionResult>;

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

export type NetworkEnrichmentReviewInvocation =
  | ReviewSubmitInvocation
  | ReviewApproveInvocation
  | ReviewRejectInvocation;

export interface NetworkEnrichmentReviewInvocationDeps {
  adapter?: NetworkEnrichmentReviewRuntimeAdapter;
}

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
    default:
      throw new Error("Unsupported network enrichment review command.");
  }
}
