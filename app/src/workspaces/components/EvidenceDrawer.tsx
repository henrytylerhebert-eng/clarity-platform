import React from "react";
import { ExternalLink, Info } from "lucide-react";

interface EvidenceDrawerProps {
  activePackage: any;
  activeEvidenceReviewId: string | null;
  onClose: () => void;
}

export const EvidenceDrawer: React.FC<EvidenceDrawerProps> = ({
  activePackage,
  activeEvidenceReviewId,
  onClose,
}) => {
  if (!activeEvidenceReviewId || !activePackage) return null;

  const evidenceList = activePackage.evidence[activeEvidenceReviewId] ?? [];
  const rev = activePackage.reviews.find((r: any) => r.reviewId === activeEvidenceReviewId);

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex justify-end z-50">
      <div className="w-full max-w-lg bg-white h-full p-6 shadow-2xl overflow-y-auto space-y-6">
        <div className="flex items-center justify-between border-b border-gray-200 pb-4">
          <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <Info className="h-5 w-5 text-indigo-600" />
            Field Evidence & Authority Trace
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 text-sm font-bold px-2"
          >
            ✕
          </button>
        </div>

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
              evidenceList.map((ev: any, i: number) => (
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
      </div>
    </div>
  );
};
