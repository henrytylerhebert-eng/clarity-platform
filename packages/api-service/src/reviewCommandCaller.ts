import {
  createNetworkEnrichmentReviewRuntimeAdapter,
  type NetworkEnrichmentReviewInvocation,
  type NetworkEnrichmentReviewInvocationResult,
  invokeNetworkEnrichmentReviewCommand,
  type NetworkEnrichmentReviewRuntimeDeps,
} from "@clarity/network-enrichment-service";

export type NetworkEnrichmentReviewCommandInvoker = (
  invocation: NetworkEnrichmentReviewInvocation,
) => Promise<NetworkEnrichmentReviewInvocationResult>;

export type NetworkEnrichmentReviewCommandCallerDeps = NetworkEnrichmentReviewRuntimeDeps;

export function createNetworkEnrichmentReviewCommandCaller(
  deps: NetworkEnrichmentReviewCommandCallerDeps = {},
): NetworkEnrichmentReviewCommandInvoker {
  const adapter = createNetworkEnrichmentReviewRuntimeAdapter(deps);
  return (invocation: NetworkEnrichmentReviewInvocation) =>
    invokeNetworkEnrichmentReviewCommand(invocation, { adapter });
}
