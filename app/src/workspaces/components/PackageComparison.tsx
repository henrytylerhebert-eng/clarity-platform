import React from "react";
import type { UserRole } from "@clarity/domain-contracts";
import type { SyntheticEnrichmentPackage } from "../../domain/enrichmentFixtures";
import { FieldDecision } from "./FieldDecision";

interface PackageComparisonProps {
  activePackage: SyntheticEnrichmentPackage;
  userRoles: readonly UserRole[];
  stagedDecisions: Record<string, { status: "HUMAN_CONFIRMED" | "REJECTED" | "STALE" | "DEPRECATED"; reason: string }>;
  onStageDecision: (reviewId: string, status: "HUMAN_CONFIRMED" | "REJECTED" | "STALE" | "DEPRECATED", reason?: string) => void;
  onViewEvidence: (reviewId: string) => void;
}

export const PackageComparison: React.FC<PackageComparisonProps> = ({
  activePackage,
  userRoles,
  stagedDecisions,
  onStageDecision,
  onViewEvidence,
}) => {
  return (
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
          const hasRoleAuthority = rev.requiredCanonicalRoles.some((r) => userRoles.includes(r as UserRole));
          const currentStaged = stagedDecisions[rev.reviewId];

          return (
            <FieldDecision
              key={rev.reviewId}
              review={rev}
              canonicalVal={canonicalVal}
              hasDiff={hasDiff}
              isNetNew={isNetNew}
              hasRoleAuthority={hasRoleAuthority}
              currentStaged={currentStaged}
              onStageDecision={(status) => onStageDecision(rev.reviewId, status)}
              onViewEvidence={() => onViewEvidence(rev.reviewId)}
            />
          );
        })}
      </div>
    </div>
  );
};
