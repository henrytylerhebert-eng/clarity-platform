import type { EntityResolutionResult, MatchSignal, ResolutionCandidate, ResolutionTarget, ScoredCandidate } from "./types";
import { normalizeAddress, normalizeName, normalizePhone, normalizePostal, normalizeWebsite } from "./normalization";

function exact(a: string, b: string): boolean { return Boolean(a && b && a === b); }

function identifierState(target: ResolutionTarget, candidate: ResolutionCandidate): { comparable: boolean; match: boolean; conflict: boolean; detail: string } {
  const t = new Map((target.identifiers ?? []).map(x => [x.type.toLowerCase(), x.value.toLowerCase()]));
  const c = new Map((candidate.identifiers ?? []).map(x => [x.type.toLowerCase(), x.value.toLowerCase()]));
  let comparable = false;
  let match = false;
  for (const [type, value] of t) {
    const other = c.get(type);
    if (!other) continue;
    comparable = true;
    if (other !== value) return { comparable, match: false, conflict: true, detail: `Conflicting ${type} identifiers.` };
    match = true;
  }
  return { comparable, match, conflict: false, detail: match ? "Official identifier matched." : "No comparable official identifier." };
}

export function scoreCandidate(target: ResolutionTarget, candidate: ResolutionCandidate): ScoredCandidate {
  const signals: MatchSignal[] = [];
  let possibleScore = 0;
  let rawScore = 0;
  const add = (signal: string, weight: number, comparable: boolean, matched: boolean, detail: string) => {
    signals.push({ signal, weight, matched, detail });
    if (comparable) possibleScore += weight;
    if (comparable && matched) rawScore += weight;
  };

  const ids = identifierState(target, candidate);
  add("official_identifier", 100, ids.comparable, ids.match, ids.detail);

  const targetName = normalizeName(target.name);
  const candidateName = normalizeName(candidate.name);
  const aliasMatch = (candidate.aliases ?? []).some(a => exact(targetName, normalizeName(a)));
  const nameMatched = exact(targetName, candidateName);
  add("name_or_alias", 30, Boolean(targetName && (candidateName || (candidate.aliases ?? []).length)), nameMatched || aliasMatch, nameMatched ? "Normalized legal/public name matched." : aliasMatch ? "Target matched an evidenced alias." : `${targetName} vs ${candidateName}`);

  const tw = normalizeWebsite(target.website), cw = normalizeWebsite(candidate.website);
  add("domain", 30, Boolean(tw && cw), exact(tw, cw), "Normalized website host comparison.");
  const ta = normalizeAddress(target.address), ca = normalizeAddress(candidate.address);
  add("address", 25, Boolean(ta && ca), exact(ta, ca), "Normalized address comparison.");
  const tp = normalizePhone(target.phone), cp = normalizePhone(candidate.phone);
  add("phone", 15, Boolean(tp && cp), exact(tp, cp), "Normalized phone comparison.");
  const tcity = normalizeName(target.city), ccity = normalizeName(candidate.city);
  add("city", 10, Boolean(tcity && ccity), exact(tcity, ccity), "City comparison.");
  const tstate = normalizeName(target.state), cstate = normalizeName(candidate.state);
  add("state", 5, Boolean(tstate && cstate), exact(tstate, cstate), "State comparison.");
  const tz = normalizePostal(target.postalCode), cz = normalizePostal(candidate.postalCode);
  add("postal", 8, Boolean(tz && cz), exact(tz, cz), "Postal comparison.");
  const tparent = normalizeName(target.parentName), cparent = normalizeName(candidate.parentName);
  add("parent", 8, Boolean(tparent && cparent), exact(tparent, cparent), "Parent organization comparison.");

  if (candidate.status === "INACTIVE" || candidate.status === "CLOSED") rawScore -= Math.min(15, possibleScore * 0.15);
  const normalizedScore = possibleScore ? Math.max(0, Math.min(1, rawScore / possibleScore)) : 0;
  return { candidateId: candidate.id, rawScore, normalizedScore, hardConflict: ids.conflict, signals };
}

export function resolveEntity(target: ResolutionTarget, candidates: ResolutionCandidate[]): EntityResolutionResult {
  const scored = candidates.map(c => scoreCandidate(target, c)).sort((a, b) => b.normalizedScore - a.normalizedScore);
  if (!scored.length) return { status: "NO_MATCH", selectedCandidateId: null, confidence: 0, margin: 0, reason: "No candidates supplied.", candidates: [], requiresHumanReview: true };
  const best = scored[0];
  const second = scored[1];
  const margin = best.normalizedScore - (second?.normalizedScore ?? 0);
  if (best.hardConflict) return { status: "CONFLICT", selectedCandidateId: null, confidence: best.normalizedScore, margin, reason: "Official identifiers conflict.", candidates: scored, requiresHumanReview: true };
  const selected = candidates.find(c => c.id === best.candidateId)!;
  if (best.normalizedScore < 0.45) return { status: "NO_MATCH", selectedCandidateId: null, confidence: best.normalizedScore, margin, reason: "No candidate met the proposed minimum score.", candidates: scored, requiresHumanReview: true };
  if (second && second.normalizedScore >= 0.45 && margin < 0.15) return { status: "AMBIGUOUS", selectedCandidateId: null, confidence: best.normalizedScore, margin, reason: "Multiple plausible candidates require human resolution.", candidates: scored, requiresHumanReview: true };
  if (selected.status === "INACTIVE" || selected.status === "CLOSED") return { status: "INACTIVE_OR_CLOSED", selectedCandidateId: selected.id, confidence: best.normalizedScore, margin, reason: "Entity matched but is marked inactive or closed.", candidates: scored, requiresHumanReview: true };
  const hasStrongSignal = best.signals.some(s => s.matched && ["official_identifier", "domain", "address", "phone"].includes(s.signal));
  if (best.normalizedScore >= 0.80 && margin >= 0.15 && hasStrongSignal) return { status: "MATCHED", selectedCandidateId: selected.id, confidence: best.normalizedScore, margin, reason: "Candidate met the proposed match, separation, and strong-signal thresholds.", candidates: scored, requiresHumanReview: false };
  return { status: "PROBABLE_MATCH", selectedCandidateId: selected.id, confidence: best.normalizedScore, margin, reason: "Candidate is plausible but requires human confirmation.", candidates: scored, requiresHumanReview: true };
}
