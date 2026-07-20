import React from "react";
import { CheckCircle2, Info, Lock, XCircle } from "lucide-react";

interface FieldDecisionProps {
  review: any;
  canonicalVal: any;
  hasDiff: boolean;
  isNetNew: boolean;
  hasRoleAuthority: boolean;
  currentStaged: { status: "HUMAN_CONFIRMED" | "REJECTED" | "STALE" | "DEPRECATED"; reason: string } | undefined;
  onStageDecision: (status: "HUMAN_CONFIRMED" | "REJECTED" | "STALE" | "DEPRECATED") => void;
  onViewEvidence: () => void;
}

export const FieldDecision: React.FC<FieldDecisionProps> = ({
  review,
  canonicalVal,
  hasDiff,
  isNetNew,
  hasRoleAuthority,
  currentStaged,
  onStageDecision,
  onViewEvidence,
}) => {
  return (
    <div
      className={`grid grid-cols-12 items-center py-4 px-4 text-xs transition-colors ${
        isNetNew ? "bg-emerald-50/40" : hasDiff ? "bg-amber-50/40" : "bg-white"
      }`}
    >
      {/* Field Path & Sensitivity */}
      <div className="col-span-3 space-y-1">
        <span className="font-mono font-bold text-gray-900 block">{review.fieldPath}</span>
        <div className="flex flex-wrap gap-1">
          <span
            className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
              review.sensitivityCategory === "CLINICAL_CRITERIA"
                ? "bg-purple-100 text-purple-800"
                : review.sensitivityCategory === "LEGAL_STATUS_REQUIREMENTS"
                ? "bg-rose-100 text-rose-800"
                : review.sensitivityCategory === "PAYER_RELATED"
                ? "bg-blue-100 text-blue-800"
                : "bg-gray-100 text-gray-700"
            }`}
          >
            {review.sensitivityCategory}
          </span>
          <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
            {review.status}
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
            {JSON.stringify(review.proposedValue)}
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
          {!hasRoleAuthority ? (
            <div className="flex items-center gap-1 bg-rose-50 text-rose-700 text-[11px] font-semibold px-2 py-1 rounded border border-rose-200">
              <Lock className="h-3 w-3" />
              Requires {review.requiredCanonicalRoles.join(" / ")} Authority
            </div>
          ) : (
            <>
              <button
                aria-label={`Approve ${review.fieldPath}`}
                onClick={() => onStageDecision("HUMAN_CONFIRMED")}
                className={`text-[11px] font-bold px-2.5 py-1 rounded border transition-colors flex items-center gap-1 ${
                  currentStaged?.status === "HUMAN_CONFIRMED"
                    ? "bg-emerald-600 text-white border-emerald-700"
                    : "bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300"
                }`}
              >
                <CheckCircle2 className="h-3 w-3" /> Approve
              </button>
              <button
                aria-label={`Reject ${review.fieldPath}`}
                onClick={() => onStageDecision("REJECTED")}
                className={`text-[11px] font-bold px-2.5 py-1 rounded border transition-colors flex items-center gap-1 ${
                  currentStaged?.status === "REJECTED"
                    ? "bg-rose-600 text-white border-rose-700"
                    : "bg-rose-50 hover:bg-rose-100 text-rose-800 border-rose-300"
                }`}
              >
                <XCircle className="h-3 w-3" /> Reject
              </button>
              <button
                aria-label={`Mark Stale ${review.fieldPath}`}
                onClick={() => onStageDecision("STALE")}
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
          onClick={onViewEvidence}
          className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-900 bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-200 hover:bg-indigo-100"
        >
          <Info className="h-3.5 w-3.5" /> Evidence
        </button>
      </div>
    </div>
  );
};
