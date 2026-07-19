import {
  type ApproveReviewCommand,
  type NetworkCommandResult,
  type NetworkReviewSubmitResult,
  type NetworkReviewTransitionResult,
  type RejectReviewCommand,
  type SubmitForReviewCommand,
} from "@clarity/domain-contracts";
import {
  createNetworkEnrichmentReviewRuntime,
  type NetworkEnrichmentReviewRuntime,
  type NetworkEnrichmentReviewRuntimeDeps,
} from "./runtime.js";

export interface NetworkEnrichmentReviewRuntimeAdapter {
  readonly gateway: NetworkEnrichmentReviewRuntime["gateway"];
  submitForReview(
    input: SubmitForReviewCommand,
  ): Promise<NetworkCommandResult<NetworkReviewSubmitResult>>;
  approveReview(
    input: ApproveReviewCommand,
  ): Promise<NetworkCommandResult<NetworkReviewTransitionResult>>;
  rejectReview(
    input: RejectReviewCommand,
  ): Promise<NetworkCommandResult<NetworkReviewTransitionResult>>;
}

export function createNetworkEnrichmentReviewRuntimeAdapter(
  deps: NetworkEnrichmentReviewRuntimeDeps = {},
): NetworkEnrichmentReviewRuntimeAdapter {
  const runtime = createNetworkEnrichmentReviewRuntime(deps);
  return {
    gateway: runtime.gateway,
    submitForReview: (input) => runtime.commands.submitForReview(input),
    approveReview: (input) => runtime.commands.approveReview(input),
    rejectReview: (input) => runtime.commands.rejectReview(input),
  };
}
