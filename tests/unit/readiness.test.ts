import { describe, expect, it } from "vitest";
import * as contracts from "@clarity/domain-contracts";
import { describeReadiness, compareClinicalUrgency, type ReferralReadiness } from "@clarity/domain-contracts";

const wealthyRoutine: ReferralReadiness = {
  clinicalUrgency: "ROUTINE",
  operationalReadiness: "READY",
  placementReadiness: "READY",
  financialReadiness: "VERIFIED",
};
const uninsuredEmergent: ReferralReadiness = {
  clinicalUrgency: "EMERGENT",
  operationalReadiness: "PARTIAL",
  placementReadiness: "NOT_READY",
  financialReadiness: "BLOCKED",
};

describe("no opaque combined referral score", () => {
  it("readiness is presented as four separate dimensions", () => {
    const rows = describeReadiness(uninsuredEmergent);
    expect(rows.map((r) => r.dimension)).toEqual([
      "clinicalUrgency",
      "operationalReadiness",
      "placementReadiness",
      "financialReadiness",
    ]);
  });

  it("the contracts package exports no score/priority combiner", () => {
    const suspicious = Object.keys(contracts).filter((k) => /score|priorit.*(rank|value|weight)|composite/i.test(k));
    expect(suspicious).toEqual([]);
  });

  it("clinical ordering ignores financial readiness: uninsured emergent outranks verified routine", () => {
    expect(compareClinicalUrgency(uninsuredEmergent, wealthyRoutine)).toBeLessThan(0);
  });
});
