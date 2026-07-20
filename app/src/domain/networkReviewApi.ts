import type {
  ApproveReviewCommand,
  ReconcilePackageCommand,
  RejectReviewCommand,
  SubmitForReviewCommand,
} from "@clarity/domain-contracts";
import {
  getSyntheticEnrichmentPackages,
  type SyntheticEnrichmentPackage,
} from "./enrichmentFixtures";

export interface NetworkReviewApiClient {
  fetchPackages(): Promise<SyntheticEnrichmentPackage[]>;
  submitReview(command: Omit<SubmitForReviewCommand, "organizationId" | "actor">): Promise<unknown>;
  approveReview(command: Omit<ApproveReviewCommand, "organizationId" | "actor">): Promise<unknown>;
  rejectReview(command: Omit<RejectReviewCommand, "organizationId" | "actor">): Promise<unknown>;
  reconcilePackage(command: Omit<ReconcilePackageCommand, "organizationId" | "actor">): Promise<unknown>;
}

export class DefaultNetworkReviewApiClient implements NetworkReviewApiClient {
  constructor(
    private readonly baseUrl: string = "/api/network-enrichment/synthetic",
    private readonly getToken?: () => string | null,
  ) {}

  private headers(): Record<string, string> {
    const token = this.getToken?.();
    const headers: Record<string, string> = {
      "content-type": "application/json",
    };
    if (token) {
      headers["authorization"] = `Bearer ${token}`;
    }
    return headers;
  }

  async fetchPackages(): Promise<SyntheticEnrichmentPackage[]> {
    try {
      const res = await fetch(`${this.baseUrl}/packages`, {
        headers: this.headers(),
      });
      if (!res.ok) {
        return getSyntheticEnrichmentPackages();
      }
      return await res.json();
    } catch {
      return getSyntheticEnrichmentPackages();
    }
  }

  async submitReview(command: Omit<SubmitForReviewCommand, "organizationId" | "actor">): Promise<unknown> {
    const res = await fetch(`${this.baseUrl}/reviews/submit`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify(command),
    });
    if (!res.ok) {
      throw new Error(`Failed to submit review decision: ${res.statusText}`);
    }
    return await res.json();
  }

  async approveReview(command: Omit<ApproveReviewCommand, "organizationId" | "actor">): Promise<unknown> {
    const res = await fetch(`${this.baseUrl}/reviews/approve`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify(command),
    });
    if (!res.ok) {
      throw new Error(`Failed to approve review: ${res.statusText}`);
    }
    return await res.json();
  }

  async rejectReview(command: Omit<RejectReviewCommand, "organizationId" | "actor">): Promise<unknown> {
    const res = await fetch(`${this.baseUrl}/reviews/reject`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify(command),
    });
    if (!res.ok) {
      throw new Error(`Failed to reject review: ${res.statusText}`);
    }
    return await res.json();
  }

  async reconcilePackage(command: Omit<ReconcilePackageCommand, "organizationId" | "actor">): Promise<unknown> {
    const res = await fetch(`${this.baseUrl}/packages/reconcile`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify(command),
    });
    if (!res.ok) {
      throw new Error(`Failed to reconcile package: ${res.statusText}`);
    }
    return await res.json();
  }
}
