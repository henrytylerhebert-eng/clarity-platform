import type { CandidateField, ConflictSet, JsonValue } from "./types";
import { stableJson } from "./normalization";

function comparable(value: JsonValue | null): string {
  if (typeof value === "string") return value.trim().toLowerCase().replace(/\s+/g, " ");
  return stableJson(value);
}

export function detectConflicts(candidates: CandidateField[]): ConflictSet[] {
  const byField = new Map<string, CandidateField[]>();
  for (const candidate of candidates) {
    const list = byField.get(candidate.fieldPath) ?? [];
    list.push(candidate);
    byField.set(candidate.fieldPath, list);
  }
  const conflicts: ConflictSet[] = [];
  for (const [fieldPath, list] of byField) {
    const values = new Map<string, CandidateField[]>();
    for (const item of list) {
      const key = comparable(item.normalizedValue ?? item.proposedValue);
      const group = values.get(key) ?? [];
      group.push(item);
      values.set(key, group);
    }
    if (values.size > 1) {
      conflicts.push({
        conflictId: `conflict:${fieldPath}`,
        fieldPath,
        candidateIds: list.map(x => x.candidateId),
        reason: "Multiple distinct candidate values are supported for the same field path.",
        recommendedReviewerRoles: Array.from(new Set(list.flatMap(x => x.proposedReviewerRoles)))
      });
    }
  }
  return conflicts;
}
