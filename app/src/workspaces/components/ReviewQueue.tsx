import React from "react";
import { Search, Filter } from "lucide-react";
import type { SyntheticEnrichmentPackage } from "../../domain/enrichmentFixtures";

interface ReviewQueueProps {
  packages: SyntheticEnrichmentPackage[];
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  statusFilter: string;
  setStatusFilter: (val: string) => void;
  authorityFilter: string;
  setAuthorityFilter: (val: string) => void;
  onSelectPackage: (packageId: string) => void;
}

export const ReviewQueue: React.FC<ReviewQueueProps> = ({
  packages,
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  authorityFilter,
  setAuthorityFilter,
  onSelectPackage,
}) => {
  const filteredPackages = packages.filter((pkg) => {
    const matchesSearch = pkg.canonicalData.entityName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || pkg.packageRecord.status === statusFilter;
    const matchesAuthority =
      authorityFilter === "ALL" ||
      pkg.packageRecord.assignedReviewerCategory?.includes(authorityFilter);
    return matchesSearch && matchesStatus && matchesAuthority;
  });

  return (
    <div className="space-y-4">
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
                        onClick={() => onSelectPackage(pkg.packageRecord.reviewPackageId)}
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
  );
};
