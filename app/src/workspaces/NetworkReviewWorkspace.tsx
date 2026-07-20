import React, { useState } from "react";
import {
  CheckCircle2,
  ExternalLink,
  FileSearch,
  Filter,
  History,
  Info,
  Lock,
  Search,
  ShieldAlert,
  XCircle,
} from "lucide-react";
import type { UserRole } from "@clarity/domain-contracts";
import {
  getSyntheticEnrichmentPackages,
  type SyntheticEnrichmentPackage,
} from "../domain/enrichmentFixtures";

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

  // Filter packages for queue
  const filteredPackages = packages.filter((pkg) => {
    const matchesSearch = pkg.canonicalData.entityName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || pkg.packageRecord.status === statusFilter;
    const matchesAuthority =
      authorityFilter === "ALL" ||
      pkg.packageRecord.assignedReviewerCategory?.includes(authorityFilter);
    return matchesSearch && matchesStatus && matchesAuthority;
  });

  const hasRoleAuthority = (requiredRoles: readonly UserRole[]) => {
    return requiredRoles.some((r) => userRoles.includes(r));
  };

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
            status: decision.status,
            reviewedByActorId: actorId,
            reviewReason: decision.reason,
            updatedAt: now,
            audits: [
              ...rev.audits,
              {
                action,
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
        <div className="space-y-4">
          {/* Queue Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center gap-3 flex-1 min-w-[280px]">
              <Search className="h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by candidate facility or program name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-sm border-0 focus:outline-none focus:ring-0"
              />
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-500" />
                <label className="text-xs font-semibold text-gray-600">Status:</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="text-xs border border-gray-300 rounded-lg px-2 py-1.5 bg-gray-50 focus:bg-white"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="UNRESEARCHED">Unresearched</option>
                  <option value="CONFLICT">Conflict</option>
                  <option value="STALE">Stale (&gt;90d)</option>
                  <option value="HUMAN_CONFIRMED">Human Confirmed</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-xs font-semibold text-gray-600">Authority:</label>
                <select
                  value={authorityFilter}
                  onChange={(e) => setAuthorityFilter(e.target.value)}
                  className="text-xs border border-gray-300 rounded-lg px-2 py-1.5 bg-gray-50 focus:bg-white"
                >
                  <option value="ALL">All Categories</option>
                  <option value="CLINICAL_REVIEWER">Clinical</option>
                  <option value="LEGAL_REVIEWER">Legal</option>
                  <option value="FACILITY_REVIEWER">Operations</option>
                  <option value="BENEFITS_VERIFICATION_SPECIALIST">Compliance / Payer</option>
                </select>
              </div>
            </div>
          </div>

          {/* Queue Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-xs font-semibold text-gray-600 uppercase border-b border-gray-200">
                  <th className="py-3 px-4">Candidate Entity</th>
                  <th className="py-3 px-4">Package ID</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Pending Fields</th>
                  <th className="py-3 px-4">Required Authority</th>
                  <th className="py-3 px-4">Submission Date</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {filteredPackages.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-gray-500 text-sm">
                      No pending review packages found matching filters.
                    </td>
                  </tr>
                ) : (
                  filteredPackages.map((pkg) => {
                    const pendingCount = pkg.reviews.filter(
                      (r) => r.status === "REVIEW_PENDING" || r.status === "CONFLICT" || r.status === "STALE",
                    ).length;

                    return (
                      <tr key={pkg.packageRecord.reviewPackageId} className="hover:bg-gray-50/80 transition-colors">
                        <td className="py-3.5 px-4 font-semibold text-gray-900">
                          {pkg.canonicalData.entityName}
                        </td>
                        <td className="py-3.5 px-4 text-xs font-mono text-gray-600">
                          {pkg.packageRecord.reviewPackageId}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                              pkg.packageRecord.status === "CONFLICT"
                                ? "bg-rose-100 text-rose-800 border border-rose-200"
                                : pkg.packageRecord.status === "STALE"
                                ? "bg-amber-100 text-amber-800 border border-amber-200"
                                : pkg.packageRecord.status === "HUMAN_CONFIRMED"
                                ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                : "bg-blue-100 text-blue-800 border border-blue-200"
                            }`}
                          >
                            {pkg.packageRecord.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-gray-700">
                          {pendingCount} field{pendingCount !== 1 ? "s" : ""}
                        </td>
                        <td className="py-3.5 px-4 text-xs">
                          <div className="flex flex-wrap gap-1">
                            {pkg.packageRecord.assignedReviewerCategory?.map((cat) => (
                              <span
                                key={cat}
                                className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded border border-gray-200"
                              >
                                {cat.replace("_REVIEWER", "")}
                              </span>
                            )) ?? <span className="text-gray-400">Ops</span>}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-xs text-gray-500">
                          {new Date(pkg.packageRecord.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => {
                              setSelectedPackageId(pkg.packageRecord.reviewPackageId);
                              setActiveTab("comparison");
                            }}
                            className="inline-flex items-center gap-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg transition-colors"
                          >
                            Review Package
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
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
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="grid grid-cols-12 bg-gray-100 border-b border-gray-200 text-xs font-bold text-gray-700 py-3 px-4">
                <div className="col-span-3">Field Path & Sensitivity</div>
                <div className="col-span-3">Canonical CRM Value</div>
                <div className="col-span-4">Enriched Candidate Value & Decisions</div>
                <div className="col-span-2 text-right">Evidence & Authority</div>
              </div>

              <div className="divide-y divide-gray-100">
                {activePackage.reviews.map((rev) => {
                  const canonicalVal = activePackage.canonicalData.fields[rev.fieldPath];
                  const hasDiff = canonicalVal !== rev.proposedValue;
                  const isNetNew = canonicalVal === undefined || canonicalVal === null;
                  const canApprove = hasRoleAuthority(rev.requiredCanonicalRoles);
                  const currentStaged = stagedDecisions[rev.reviewId];

                  return (
                    <div
                      key={rev.reviewId}
                      className={`grid grid-cols-12 items-center py-4 px-4 text-xs transition-colors ${
                        isNetNew
                          ? "bg-emerald-50/40"
                          : hasDiff
                          ? "bg-amber-50/40"
                          : "bg-white"
                      }`}
                    >
                      {/* Field Path & Sensitivity */}
                      <div className="col-span-3 space-y-1">
                        <span className="font-mono font-bold text-gray-900 block">
                          {rev.fieldPath}
                        </span>
                        <div className="flex flex-wrap gap-1">
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                              rev.sensitivityCategory === "CLINICAL_CRITERIA"
                                ? "bg-purple-100 text-purple-800"
                                : rev.sensitivityCategory === "LEGAL_STATUS_REQUIREMENTS"
                                ? "bg-rose-100 text-rose-800"
                                : rev.sensitivityCategory === "PAYER_RELATED"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {rev.sensitivityCategory}
                          </span>
                          <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                            {rev.status}
                          </span>
                        </div>
                      </div>

                      {/* Canonical CRM Value */}
                      <div className="col-span-3 pr-2">
                        {isNetNew ? (
                          <span className="text-gray-400 italic">Net New Field (No CRM value)</span>
                        ) : (
                          <span className="font-mono text-gray-800 bg-gray-100 px-2 py-1 rounded block truncate">
                            {JSON.stringify(canonicalVal)}
                          </span>
                        )}
                      </div>

                      {/* Proposed Candidate Value & Decision Controls */}
                      <div className="col-span-4 space-y-2 pr-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-mono font-semibold px-2 py-1 rounded block truncate flex-1 border ${
                              isNetNew
                                ? "bg-emerald-100 border-emerald-300 text-emerald-900"
                                : hasDiff
                                ? "bg-amber-100 border-amber-300 text-amber-900"
                                : "bg-gray-50 border-gray-200 text-gray-800"
                            }`}
                          >
                            {JSON.stringify(rev.proposedValue)}
                          </span>

                          {isNetNew && (
                            <span className="bg-emerald-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                              NEW
                            </span>
                          )}
                          {!isNetNew && hasDiff && (
                            <span className="bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                              MODIFIED
                            </span>
                          )}
                        </div>

                        {/* Action Buttons & Role Guarding */}
                        <div className="flex items-center gap-1.5">
                          {!canApprove ? (
                            <div className="flex items-center gap-1 bg-rose-50 text-rose-700 text-[11px] font-semibold px-2 py-1 rounded border border-rose-200">
                              <Lock className="h-3 w-3" />
                              Requires {rev.requiredCanonicalRoles.join(" / ")} Authority
                            </div>
                          ) : (
                            <>
                              <button
                                aria-label={`Approve ${rev.fieldPath}`}
                                onClick={() => handleStageDecision(rev.reviewId, "HUMAN_CONFIRMED")}
                                className={`text-[11px] font-bold px-2.5 py-1 rounded border transition-colors flex items-center gap-1 ${
                                  currentStaged?.status === "HUMAN_CONFIRMED"
                                    ? "bg-emerald-600 text-white border-emerald-700"
                                    : "bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300"
                                }`}
                              >
                                <CheckCircle2 className="h-3 w-3" /> Approve
                              </button>
                              <button
                                aria-label={`Reject ${rev.fieldPath}`}
                                onClick={() => handleStageDecision(rev.reviewId, "REJECTED")}
                                className={`text-[11px] font-bold px-2.5 py-1 rounded border transition-colors flex items-center gap-1 ${
                                  currentStaged?.status === "REJECTED"
                                    ? "bg-rose-600 text-white border-rose-700"
                                    : "bg-rose-50 hover:bg-rose-100 text-rose-800 border-rose-300"
                                }`}
                              >
                                <XCircle className="h-3 w-3" /> Reject
                              </button>
                              <button
                                aria-label={`Mark Stale ${rev.fieldPath}`}
                                onClick={() => handleStageDecision(rev.reviewId, "STALE")}
                                className={`text-[11px] font-semibold px-2 py-1 rounded border ${
                                  currentStaged?.status === "STALE"
                                    ? "bg-amber-500 text-white"
                                    : "bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-300"
                                }`}
                              >
                                Stale
                              </button>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Evidence & Authority Link */}
                      <div className="col-span-2 text-right">
                        <button
                          onClick={() => setActiveEvidenceReviewId(rev.reviewId)}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-900 bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-200 hover:bg-indigo-100"
                        >
                          <Info className="h-3.5 w-3.5" /> Evidence
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
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
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <History className="h-4 w-4 text-indigo-600" />
                Immutable Review Audit Log
              </h3>
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
      {activeEvidenceReviewId && activePackage && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex justify-end z-50">
          <div className="w-full max-w-lg bg-white h-full p-6 shadow-2xl overflow-y-auto space-y-6">
            <div className="flex items-center justify-between border-b border-gray-200 pb-4">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Info className="h-5 w-5 text-indigo-600" />
                Field Evidence & Authority Trace
              </h3>
              <button
                onClick={() => setActiveEvidenceReviewId(null)}
                className="text-gray-400 hover:text-gray-700 text-sm font-bold px-2"
              >
                ✕
              </button>
            </div>

            {(() => {
              const evidenceList = activePackage.evidence[activeEvidenceReviewId] ?? [];
              const rev = activePackage.reviews.find((r) => r.reviewId === activeEvidenceReviewId);

              return (
                <div className="space-y-4 text-xs">
                  <div>
                    <span className="text-gray-500 block">Target Field Path:</span>
                    <span className="font-mono font-bold text-gray-900 text-sm">{rev?.fieldPath}</span>
                  </div>

                  <div>
                    <span className="text-gray-500 block mb-1">Source Evidence Snippets:</span>
                    {evidenceList.length === 0 ? (
                      <p className="text-gray-400 italic">No source evidence records attached.</p>
                    ) : (
                      evidenceList.map((ev, i) => (
                        <div key={i} className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-2">
                          <div className="flex items-center justify-between text-[11px] font-bold text-indigo-700">
                            <span>{ev.evidenceType}</span>
                            <a
                              href={ev.evidenceSource}
                              target="_blank"
                              rel="noreferrer"
                              className="text-indigo-600 hover:underline flex items-center gap-1"
                            >
                              Source URL <ExternalLink className="h-3 w-3" />
                            </a>
                          </div>
                          <p className="bg-white p-3 rounded-lg border border-gray-200 font-mono text-gray-800">
                            {JSON.stringify(ev.payload, null, 2)}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
};
