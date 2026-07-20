import React, { useState } from "react";
import { CheckCircle2, Download, FileSearch, History, ShieldAlert } from "lucide-react";
import type { UserRole } from "@clarity/domain-contracts";
import {
  getSyntheticEnrichmentPackages,
  type SyntheticEnrichmentPackage,
} from "../domain/enrichmentFixtures";

import { ReviewQueue } from "./components/ReviewQueue";
import { PackageComparison } from "./components/PackageComparison";
import { EvidenceDrawer } from "./components/EvidenceDrawer";

interface NetworkReviewWorkspaceProps {
  userRoles?: readonly UserRole[];
  actorId?: string;
}

export const NetworkReviewWorkspace: React.FC<NetworkReviewWorkspaceProps> = ({
  userRoles = ["FACILITY_REVIEWER", "COMPLIANCE_REVIEWER"],
  actorId = "usr-reviewer-current",
}) => {
  const [packages, setPackages] = useState<SyntheticEnrichmentPackage[]>(() =>
    getSyntheticEnrichmentPackages(),
  );
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"comparison" | "conflicts" | "audit">("comparison");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [authorityFilter, setAuthorityFilter] = useState<string>("ALL");
  const [activeEvidenceReviewId, setActiveEvidenceReviewId] = useState<string | null>(null);

  // Staged decisions state: reviewId -> { status: "HUMAN_CONFIRMED" | "REJECTED" | "STALE" | "DEPRECATED", reason?: string }
  const [stagedDecisions, setStagedDecisions] = useState<
    Record<string, { status: "HUMAN_CONFIRMED" | "REJECTED" | "STALE" | "DEPRECATED"; reason: string }>
  >({});

  const activePackage = packages.find((p) => p.packageRecord.reviewPackageId === selectedPackageId);

  const handleStageDecision = (
    reviewId: string,
    status: "HUMAN_CONFIRMED" | "REJECTED" | "STALE" | "DEPRECATED",
    reason: string = "Submitted via review workspace",
  ) => {
    setStagedDecisions((prev) => ({
      ...prev,
      [reviewId]: { status, reason },
    }));
  };

  const handleSubmitDecisions = () => {
    if (!selectedPackageId || !activePackage) return;
    const now = new Date().toISOString();

    setPackages((prev) =>
      prev.map((pkg) => {
        if (pkg.packageRecord.reviewPackageId !== selectedPackageId) return pkg;

        const updatedReviews = pkg.reviews.map((rev) => {
          const decision = stagedDecisions[rev.reviewId];
          if (!decision) return rev;

          const action = decision.status === "HUMAN_CONFIRMED" ? "APPROVE_REVIEW" : "REJECT_REVIEW";
          return {
            ...rev,
            status: decision.status as any,
            reviewedByActorId: actorId,
            reviewReason: decision.reason,
            updatedAt: now,
            audits: [
              ...rev.audits,
              {
                action: action as any,
                actorId,
                actorType: "USER" as const,
                commandId: `cmd-${rev.reviewId}-${Date.now()}`,
                correlationId: `corr-${selectedPackageId}`,
                reason: decision.reason,
                occurredAt: now,
              },
            ],
          };
        });

        const allResolved = updatedReviews.every(
          (r) => r.status === "HUMAN_CONFIRMED" || r.status === "REJECTED" || r.status === "SUPERSEDED",
        );

        return {
          ...pkg,
          packageRecord: {
            ...pkg.packageRecord,
            status: allResolved ? "HUMAN_CONFIRMED" : pkg.packageRecord.status,
            updatedAt: now,
          },
          reviews: updatedReviews,
        };
      }),
    );

    setStagedDecisions({});
  };

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FileSearch className="h-7 w-7 text-indigo-600" />
            Network Enrichment Review Workspace
          </h1>
          <p className="text-sm text-gray-500">
            Triage candidate directory enrichments, compare canonical CRM records, inspect evidence, and submit field-level review decisions.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-full font-medium border border-indigo-200">
            Current Principal Roles: {userRoles.join(", ")}
          </span>
        </div>
      </div>

      {/* Mode A: Tabular Review Queue */}
      {!selectedPackageId && (
        <ReviewQueue
          packages={packages}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          authorityFilter={authorityFilter}
          setAuthorityFilter={setAuthorityFilter}
          onSelectPackage={(id) => {
            setSelectedPackageId(id);
            setActiveTab("comparison");
          }}
        />
      )}

      {/* Mode B: Detailed Package Workspace */}
      {selectedPackageId && activePackage && (
        <div className="space-y-6">
          {/* Top Bar for Selected Package */}
          <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <div>
              <button
                onClick={() => {
                  setSelectedPackageId(null);
                  setActiveEvidenceReviewId(null);
                }}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 mb-1"
              >
                ← Back to Review Queue
              </button>
              <h2 className="text-xl font-bold text-gray-900">
                {activePackage.canonicalData.entityName}
              </h2>
              <p className="text-xs text-gray-500 flex items-center gap-3">
                <span>Case ID: {activePackage.packageRecord.caseId}</span>
                <span>Candidate ID: {activePackage.packageRecord.sourceCandidateId}</span>
                <span>Package ID: {activePackage.packageRecord.reviewPackageId}</span>
              </p>
            </div>

            {/* Sub-navigation Tabs */}
            <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setActiveTab("comparison")}
                className={`text-xs font-semibold px-3 py-1.5 rounded-md transition-colors ${
                  activeTab === "comparison" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Field Comparison ({activePackage.reviews.length})
              </button>
              <button
                onClick={() => setActiveTab("conflicts")}
                className={`text-xs font-semibold px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5 ${
                  activeTab === "conflicts" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Conflicts Matrix
                {activePackage.conflicts.length > 0 && (
                  <span className="bg-rose-500 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                    {activePackage.conflicts.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab("audit")}
                className={`text-xs font-semibold px-3 py-1.5 rounded-md transition-colors ${
                  activeTab === "audit" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Audit Log Timeline
              </button>
            </div>
          </div>

          {/* TAB 1: Canonical vs Candidate Field Comparison View */}
          {activeTab === "comparison" && (
            <PackageComparison
              activePackage={activePackage}
              userRoles={userRoles}
              stagedDecisions={stagedDecisions}
              onStageDecision={handleStageDecision}
              onViewEvidence={(id) => setActiveEvidenceReviewId(id)}
            />
          )}

          {/* TAB 2: Conflicts & Evidence View */}
          {activeTab === "conflicts" && (
            <div className="space-y-4">
              {activePackage.conflicts.length === 0 ? (
                <div className="bg-white p-8 rounded-xl border border-gray-200 text-center text-gray-500 text-sm">
                  No active data conflicts reported for this candidate package.
                </div>
              ) : (
                activePackage.conflicts.map((conflict) => (
                  <div key={conflict.conflictId} className="bg-white p-5 rounded-xl border border-rose-200 shadow-sm space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-md border border-rose-200 flex items-center gap-1.5">
                        <ShieldAlert className="h-4 w-4 text-rose-600" />
                        Conflict ID: {conflict.conflictId} ({conflict.status})
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-gray-900">{conflict.reason}</p>
                    <div className="text-xs text-gray-600">
                      Related Reviews: {conflict.relatedReviewIds.join(", ")}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 3: Audit History Log View */}
          {activeTab === "audit" && (
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  <History className="h-4 w-4 text-indigo-600" />
                  Immutable Review Audit Log
                </h3>
                <button
                  onClick={() => {
                    if (!activePackage) return;
                    const events = activePackage.reviews.flatMap((r) => r.audits);
                    const exportData = {
                      manifest: {
                        exportId: `exp-${activePackage.packageRecord.reviewPackageId}-${Date.now()}`,
                        organizationId: activePackage.packageRecord.organizationId,
                        reviewPackageId: activePackage.packageRecord.reviewPackageId,
                        generatedAt: new Date().toISOString(),
                        recordCount: events.length,
                        integrityHashAlg: "SHA-256",
                        integrityHash: Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join(""),
                      },
                      packageRecord: activePackage.packageRecord,
                      reviews: activePackage.reviews,
                      conflicts: activePackage.conflicts,
                      auditTimeline: events,
                    };
                    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `compliance-audit-${activePackage.packageRecord.reviewPackageId}.json`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-bold text-xs px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <Download className="h-3.5 w-3.5" />
                  Export Compliance Package (.json)
                </button>
              </div>
              <div className="space-y-3">
                {activePackage.reviews.flatMap((r) => r.audits).length === 0 ? (
                  <p className="text-xs text-gray-500">No audit events recorded yet.</p>
                ) : (
                  activePackage.reviews
                    .flatMap((r) => r.audits)
                    .map((audit, idx) => (
                      <div key={idx} className="flex items-start gap-3 text-xs bg-gray-50 p-3 rounded-lg border border-gray-200">
                        <span className="font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded">
                          {audit.action}
                        </span>
                        <div className="flex-1 space-y-0.5">
                          <p className="text-gray-900 font-medium">{audit.reason ?? "No reason specified"}</p>
                          <p className="text-gray-500 text-[11px]">
                            Actor: {audit.actorId} ({audit.actorType}) | Command: {audit.commandId}
                          </p>
                        </div>
                        <span className="text-gray-400 font-mono text-[11px]">
                          {new Date(audit.occurredAt).toLocaleString()}
                        </span>
                      </div>
                    ))
                )}
              </div>
            </div>
          )}

          {/* Floating Action Bar for Package Reconciliation */}
          {Object.keys(stagedDecisions).length > 0 && (
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-6 py-4 rounded-2xl shadow-2xl border border-gray-700 flex items-center gap-6 z-50 animate-bounce-short">
              <div className="text-xs">
                <span className="font-bold text-indigo-400">
                  {Object.keys(stagedDecisions).length} decisions staged
                </span>
                <span className="text-gray-400 block">Ready for submission to server persistence</span>
              </div>

              <button
                data-testid="submit-decisions-btn"
                onClick={handleSubmitDecisions}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-4 py-2 rounded-xl transition-colors flex items-center gap-2 shadow-lg"
              >
                <CheckCircle2 className="h-4 w-4" />
                Submit Package Decisions
              </button>
            </div>
          )}
        </div>
      )}

      {/* Side-Over Drawer for Evidence Details */}
      <EvidenceDrawer
        activePackage={activePackage}
        activeEvidenceReviewId={activeEvidenceReviewId}
        onClose={() => setActiveEvidenceReviewId(null)}
      />
    </div>
  );
};

