import { NetworkEnrichmentReviewCommandService } from "./reviewCommands.js";
import {
  InMemoryNetworkReviewGateway,
  type NetworkReviewGateway,
} from "./reviewGateway.js";

export interface NetworkEnrichmentReviewRuntime {
  readonly gateway: NetworkReviewGateway;
  readonly commands: NetworkEnrichmentReviewCommandService;
}

export interface NetworkEnrichmentReviewRuntimeDeps {
  gateway?: NetworkReviewGateway;
  now?: () => string;
}

/**
 * Runtime hook for Packet 2 review commands.
 *
 * Returns a bound command-service instance with an in-memory review gateway by
 * default. This keeps the Packet 2 slice synthetic-only and ready for future
 * runtime wiring while avoiding DB/egress coupling.
 */
export function createNetworkEnrichmentReviewRuntime(
  deps: NetworkEnrichmentReviewRuntimeDeps = {},
): NetworkEnrichmentReviewRuntime {
  const gateway = deps.gateway ?? new InMemoryNetworkReviewGateway();
  return {
    gateway,
    commands: new NetworkEnrichmentReviewCommandService(gateway, deps.now),
  };
}
