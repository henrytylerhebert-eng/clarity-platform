import { describe, expect, it } from "vitest";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import ExcelJS from "exceljs";
import type { RevOpsContractRate, RevOpsContractScenario } from "../../packages/domain-contracts/src/revOpsPricing";
import { calculateContractScenario, calculateIpfBaseComponent, calculateLaInpatientScenario, dollarsToCents, LA_INPATIENT_RELEASES, IPF_2026_SOURCE, validateContractRate } from "../../packages/rev-ops-service/src/pricing";

const rate: RevOpsContractRate = {
  id: "synthetic-2026", payer: "Example", payerKind: "commercial", plan: "PPO", network: "in", funding: "ASO", facility: "Dunder", program: "IP",
  method: "perDiem", effectiveFrom: "2026-01-01", effectiveThrough: "2026-12-31", unitRateCents: 10001, percentBasisPoints: null, sourceReference: "Synthetic independent test", provenance: "synthetic",
};
const scenario: RevOpsContractScenario = { ...rate, serviceDate: "2026-07-01", units: 3, chargesCents: null };
const medicaid = { providerId: "1705586", rateType: "Distinct Part Psychiatric", firstEligibleDate: "2026-06-30", lastEligibleDate: "2026-07-01", coverage: "feeForService" as const };

describe("RevOps supported payment scenarios", () => {
  it("distinguishes missing, invalid and zero dollars and keeps decimal cents exact", () => {
    expect(dollarsToCents("")).toBeNull();
    expect(dollarsToCents("1.001")).toBeNull();
    expect(dollarsToCents("-1")).toBeNull();
    expect(dollarsToCents("NaN")).toBeNull();
    expect(dollarsToCents("0")).toBe(0);
    expect(dollarsToCents("100.01")).toBe(10001);
    expect(dollarsToCents("0.29")).toBe(29);
  });

  it.each(["perDiem", "perService", "perCase"] as const)("prices supported %s terms with exact cents", method => {
    const result = calculateContractScenario([{ ...rate, method }], { ...scenario, method });
    expect(result.status).toBe("priced");
    expect(result.amountCents).toBe(30003);
    expect(result.inputs.selectedRate).toEqual({ ...rate, method });
    expect(result.lines[0]!.source.locator).toBe(rate.sourceReference);
  });

  it("rounds a half-cent percent-charge result up and preserves charges", () => {
    const result = calculateContractScenario([{ ...rate, method: "percentCharges", percentBasisPoints: 5000 }], { ...scenario, method: "percentCharges", chargesCents: 1 });
    expect(result.amountCents).toBe(1);
    expect(result.inputs.chargesCents).toBe(1);
  });

  it("allows an intentional zero rate or zero units, never a missing rate", () => {
    expect(calculateContractScenario([{ ...rate, unitRateCents: 0 }], scenario).amountCents).toBe(0);
    expect(calculateContractScenario([rate], { ...scenario, units: 0 }).amountCents).toBe(0);
    expect(calculateContractScenario([{ ...rate, unitRateCents: null }], scenario).amountCents).toBeNull();
    expect(calculateContractScenario([rate], { ...scenario, units: null }).amountCents).toBeNull();
    expect(calculateContractScenario([{ ...rate, method: "percentCharges", percentBasisPoints: 5000 }], { ...scenario, method: "percentCharges", chargesCents: null }).amountCents).toBeNull();
  });

  it("selects effective versions at inclusive date boundaries and extends by configuration", () => {
    const future = { ...rate, id: "future", effectiveFrom: "2027-01-01", effectiveThrough: "2027-12-31", unitRateCents: 20000 };
    expect(calculateContractScenario([rate, future], { ...scenario, serviceDate: "2026-12-31" }).amountCents).toBe(30003);
    expect(calculateContractScenario([rate, future], { ...scenario, serviceDate: "2027-01-01" }).amountCents).toBe(60000);
    expect(calculateContractScenario([rate], { ...scenario, serviceDate: "2027-01-01" }).status).toBe("unpriced");
  });

  it("refuses overlapping versions and wrong product, network, payer kind, funding or facility", () => {
    expect(calculateContractScenario([rate, { ...rate, id: "conflict" }], scenario).reasons.join()).toMatch(/Overlapping/);
    for (const field of ["plan", "network", "funding", "facility", "program"] as const) {
      expect(calculateContractScenario([rate], { ...scenario, [field]: "other" }).status).toBe("unpriced");
    }
    expect(calculateContractScenario([rate], { ...scenario, payerKind: "medicareAdvantage" }).status).toBe("unpriced");
  });

  it("validates intervals, sources, fractions and supported units", () => {
    expect(validateContractRate({ ...rate, sourceReference: "" }).length).toBeGreaterThan(0);
    expect(validateContractRate({ ...rate, effectiveFrom: "2026-02-30" }).length).toBeGreaterThan(0);
    expect(validateContractRate({ ...rate, effectiveFrom: "2027-01-01" }).length).toBeGreaterThan(0);
    expect(calculateContractScenario([rate], { ...scenario, units: 0.5 }).status).toBe("unpriced");
    expect(calculateContractScenario([rate], { ...scenario, serviceDate: "2026-02-30" }).status).toBe("unpriced");
  });

  it("splits Louisiana eligible dates across the July 2026 release boundary", () => {
    const result = calculateLaInpatientScenario(medicaid);
    expect(result.amountCents).toBe(238396); // 1289.33 + 1094.63, archived Abbeville DPP rows.
    expect(result.lines.map(line => [line.units, line.unitRateCents])).toEqual([[1, 128933], [1, 109463]]);
    expect(result.lines.map(line => line.source.releaseId)).toEqual(["LA-IP-2025-07-01", "LA-IP-2026-07-01"]);
    expect(result.inputs.referenceFacilities).toEqual(["Abbeville General Hospital DPP"]);
  });

  it("does not substitute a hospital or FFS terms for managed care", () => {
    expect(calculateLaInpatientScenario({ ...medicaid, providerId: "" }).status).toBe("unpriced");
    expect(calculateLaInpatientScenario({ ...medicaid, providerId: "Dunder" }).status).toBe("unpriced");
    expect(calculateLaInpatientScenario({ ...medicaid, coverage: "managedCare" }).status).toBe("unpriced");
  });

  it("fails closed on real missing and ambiguous source rows", () => {
    const missing = calculateLaInpatientScenario({ ...medicaid, providerId: "1700070", rateType: "Acute" });
    expect(missing.amountCents).toBeNull();
    expect(missing.reasons.join()).toMatch(/missing rate/);
    const ambiguous = calculateLaInpatientScenario({ ...medicaid, providerId: "2700146", rateType: "Other Rural", lastEligibleDate: "2026-06-30" });
    expect(ambiguous.amountCents).toBeNull();
    expect(ambiguous.reasons.join()).toMatch(/ambiguous/);
  });

  it("keeps partially unsupported periods entirely unpriced", () => {
    const result = calculateLaInpatientScenario({ ...medicaid, firstEligibleDate: "2026-12-31", lastEligibleDate: "2027-01-01" });
    expect(result.amountCents).toBeNull();
    expect(result.lines).toEqual([]);
    expect(calculateLaInpatientScenario({ ...medicaid, firstEligibleDate: "2026-02-29" }).status).toBe("unpriced");
  });

  it("retains row-level effective date and zero-rate distinctions", () => {
    const source = LA_INPATIENT_RELEASES[1]!;
    const row = { ...source.rows.find(row => row.providerId === medicaid.providerId)!, perDiemCents: 0 };
    const releases = [{ ...source, rows: [row] }];
    const input = { ...medicaid, firstEligibleDate: "2026-07-01", lastEligibleDate: "2026-07-01" };
    expect(calculateLaInpatientScenario(input, releases).amountCents).toBe(0);
    expect(calculateLaInpatientScenario(input, [{ ...source, rows: [{ ...row, rowEffectiveFrom: "2026-07-02" }] }]).status).toBe("unpriced");
  });

  it("pins the complete public release extraction to archived source bytes", () => {
    expect(LA_INPATIENT_RELEASES.map(release => release.rows.length)).toEqual([566, 560]);
    for (const release of LA_INPATIENT_RELEASES) {
      expect(createHash("sha256").update(readFileSync(`data/public-rates/sources/${release.releaseId}.xlsx`)).digest("hex")).toBe(release.sha256);
      expect(release.rowCount).toBe(release.rows.length);
      expect(release.rows.every(row => row.providerId && row.rateType && row.sourceRow >= 2)).toBe(true);
    }
    expect(createHash("sha256").update(readFileSync("data/public-rates/sources/CMS-IPF-FY2026-ADDENDUM-A.pdf")).digest("hex")).toBe(IPF_2026_SOURCE.sha256);
  });

  it("reconciles every normalized public row to the archived provider, type, rate and effective date", async () => {
    for (const release of LA_INPATIENT_RELEASES) {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(`data/public-rates/sources/${release.releaseId}.xlsx`);
      const sheet = workbook.getWorksheet(release.sheet)!;
      for (const row of release.rows) {
        const original = sheet.getRow(row.sourceRow);
        expect(original.getCell(1).text.trim()).toBe(row.providerId);
        expect(original.getCell(2).text.trim()).toBe(row.facilityName);
        expect(original.getCell(4).text.trim()).toBe(row.rateType);
        const cell = original.getCell(10);
        const rateValue = cell.type === ExcelJS.ValueType.Formula ? cell.result : cell.value;
        expect(typeof rateValue === "number" ? Math.round(rateValue * 100) : null).toBe(row.perDiemCents);
        const effective = original.getCell(11).value;
        expect(effective instanceof Date ? effective.toISOString().slice(0, 10) : null).toBe(row.rowEffectiveFrom);
      }
    }
  });

  it("calculates both verified IPF quality branches as components only", () => {
    const normal = calculateIpfBaseComponent({ dischargeDate: "2026-09-30", wageIndex: "1", qualityReporting: "compliant" });
    expect(normal.amountCents).toBe(89287);
    expect(normal.status).toBe("componentOnly");
    expect(normal.reasons.join()).toMatch(/Final allowance is not calculated/);
    expect(calculateIpfBaseComponent({ dischargeDate: "2026-09-30", wageIndex: "1", qualityReporting: "reduced" }).amountCents).toBe(87544);
    expect(calculateIpfBaseComponent({ dischargeDate: "2026-09-30", wageIndex: "0.9", qualityReporting: "compliant" }).amountCents).toBe(82233);
  });

  it("uses discharge date and rejects unavailable FY2027 or missing wage indices", () => {
    expect(calculateIpfBaseComponent({ dischargeDate: "2026-10-01", wageIndex: "1", qualityReporting: "compliant" }).status).toBe("unpriced");
    expect(calculateIpfBaseComponent({ dischargeDate: "2026-09-30", wageIndex: "", qualityReporting: "compliant" }).status).toBe("unpriced");
    expect(calculateIpfBaseComponent({ dischargeDate: "2026-09-30", wageIndex: "0", qualityReporting: "compliant" }).status).toBe("unpriced");
  });
});
