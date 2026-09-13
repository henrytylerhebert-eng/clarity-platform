import laRates from "../../../data/public-rates/la-inpatient-2026.json";
import type {
  RevOpsContractRate,
  RevOpsContractScenario,
  RevOpsMedicaidRelease,
  RevOpsPricingResult,
  RevOpsRateSource,
} from "../../domain-contracts/src/revOpsPricing";

export const LA_INPATIENT_RELEASES: RevOpsMedicaidRelease[] = laRates.releases;

/** Shape returned by GET /api/rev-ops/rate-releases (ADR-0021). */
export interface PersistedRateReleaseRecord {
  releaseId: string;
  publisher: string;
  sourceUrl: string;
  sha256: string;
  retrievedAt: string;
  effectiveFrom: string;
  effectiveThrough: string;
  payload: { sheet: string; rowCount: number; rows: RevOpsMedicaidRelease["rows"] };
}

/** Pure mapper from the persisted registry's wire shape back to the shape
 * calculateLaInpatientScenario already accepts — that function is unchanged. */
export function mapPersistedRateRelease(
  record: PersistedRateReleaseRecord,
): RevOpsMedicaidRelease {
  return {
    releaseId: record.releaseId,
    publisher: record.publisher,
    sourceUrl: record.sourceUrl,
    sha256: record.sha256,
    retrievedAt: record.retrievedAt,
    sheet: record.payload.sheet,
    scenarioCoverageFrom: record.effectiveFrom.slice(0, 10),
    scenarioCoverageThrough: record.effectiveThrough.slice(0, 10),
    rowCount: record.payload.rowCount,
    rows: record.payload.rows,
  };
}
export const IPF_2026_SOURCE: RevOpsRateSource = {
  publisher: "Centers for Medicare & Medicaid Services",
  releaseId: "CMS-IPF-FY2026-ADDENDUM-A",
  sourceUrl: "https://www.cms.gov/files/document/fy-2026-addendum-ipf-pps-final-payment-updates.pdf",
  sha256: "b77f2efcc263a88567474425bff9bb8ff3a847ea81609370f9ccb9e8d46e19d9",
  locator: "Addendum A, page 1, federal per diem / labor share / non-labor share",
};

const dateIsValid = (value: string) => /^20\d{2}-\d{2}-\d{2}$/.test(value)
  && Number.isFinite(Date.parse(`${value}T00:00:00Z`))
  && new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value;
const centsIsValid = (value: number | null): value is number => value !== null
  && Number.isSafeInteger(value) && value >= 0 && value <= 100_000_000_000;

function result(methodVersion: string, inputs: object, financialMeaning: string): RevOpsPricingResult {
  return {
    status: "unpriced", amountCents: null, financialMeaning, methodVersion,
    reasons: [], lines: [], inputs: { ...inputs },
    rounding: "USD integer cents; round half up at the calculated line, then sum lines.",
  };
}

/** Parse dollars without a binary floating-point money conversion. Blank stays missing. */
export function dollarsToCents(value: string): number | null {
  if (!/^\d{1,9}(\.\d{1,2})?$/.test(value.trim())) return null;
  const [whole, fraction = ""] = value.trim().split(".");
  const cents = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  return centsIsValid(cents) ? cents : null;
}

export function validateContractRate(rate: RevOpsContractRate): string[] {
  const errors: string[] = [];
  if ([rate.id, rate.payer, rate.plan, rate.network, rate.funding, rate.facility, rate.program, rate.sourceReference].some(v => !v?.trim())) errors.push("Payer, plan, network, funding, facility, program and source reference are required.");
  if (!dateIsValid(rate.effectiveFrom) || !dateIsValid(rate.effectiveThrough) || rate.effectiveFrom > rate.effectiveThrough) errors.push("Enter a valid inclusive effective interval.");
  if (!["commercial", "medicareAdvantage", "medicaidManagedCare"].includes(rate.payerKind)) errors.push("Unsupported payer kind.");
  if (!["synthetic", "userEnteredUnverified"].includes(rate.provenance)) errors.push("Rate provenance is required.");
  if (rate.method === "percentCharges") {
    if (rate.percentBasisPoints === null || !Number.isInteger(rate.percentBasisPoints) || rate.percentBasisPoints < 0 || rate.percentBasisPoints > 10000) errors.push("Enter a percentage from 0 through 100, with up to two decimal places.");
  } else if (["perDiem", "perService", "perCase"].includes(rate.method)) {
    if (!centsIsValid(rate.unitRateCents)) errors.push("Enter a nonnegative rate in cents; missing is different from zero.");
  } else errors.push("Unsupported payment method.");
  return errors;
}

export function calculateContractScenario(rates: RevOpsContractRate[], scenario: RevOpsContractScenario): RevOpsPricingResult {
  const output = result("contract-simple-v1", scenario, "Modeled simple contract amount; excludes carve-outs, benefit liability and collections.");
  if (!dateIsValid(scenario.serviceDate)) { output.reasons.push("A valid service date is required."); return output; }
  const identityFields = ["payer", "payerKind", "plan", "network", "funding", "facility", "program", "method"] as const;
  const matches = rates.filter(rate => identityFields.every(key => rate[key] === scenario[key])
    && rate.effectiveFrom <= scenario.serviceDate && rate.effectiveThrough >= scenario.serviceDate);
  if (matches.length !== 1) {
    output.reasons.push(matches.length ? "Overlapping applicable contract versions: resolve the conflict before pricing." : "No exact payer, plan, network, funding, facility, program, method and date match.");
    return output;
  }
  const rate = matches[0]!; // Exactly one match was required above.
  output.reasons.push(...validateContractRate(rate));
  if (output.reasons.length) return output;
  let amount: number;
  let units: number;
  let unitRate: number;
  if (rate.method === "percentCharges") {
    if (!centsIsValid(scenario.chargesCents)) { output.reasons.push("Charges are missing or invalid; they were not converted to zero."); return output; }
    amount = Number((BigInt(scenario.chargesCents) * BigInt(rate.percentBasisPoints!) + 5000n) / 10000n);
    units = 1;
    unitRate = amount;
  } else {
    if (scenario.units === null || !Number.isSafeInteger(scenario.units) || scenario.units < 0 || scenario.units > 100000) { output.reasons.push("Enter nonnegative whole eligible units (maximum 100,000)."); return output; }
    units = scenario.units;
    unitRate = rate.unitRateCents!;
    amount = units * unitRate;
  }
  if (!Number.isSafeInteger(amount)) { output.reasons.push("Amount exceeds the supported integer-cent range."); return output; }
  output.inputs = { ...scenario, selectedRate: { ...rate } };
  output.status = "priced";
  output.amountCents = amount;
  output.lines.push({
    label: rate.method === "percentCharges" ? `${rate.percentBasisPoints! / 100}% of entered charges` : `${rate.method} × eligible units`,
    units, unitRateCents: unitRate, amountCents: amount,
    source: { publisher: "User-entered terms", releaseId: rate.id, sourceUrl: "", sha256: null, locator: rate.sourceReference },
  });
  output.reasons.push(rate.provenance === "synthetic" ? "Synthetic contract example; no real contracted rate is asserted." : "User-entered terms are unverified; this is a scenario, not an approved facility allowance.");
  return output;
}

export interface MedicaidScenario {
  providerId: string;
  rateType: string;
  firstEligibleDate: string;
  lastEligibleDate: string;
  coverage: "feeForService" | "managedCare";
}

export function calculateLaInpatientScenario(input: MedicaidScenario, releases = LA_INPATIENT_RELEASES): RevOpsPricingResult {
  const output = result("la-inpatient-published-per-diem-v1", input, "Published FFS per-diem subtotal for entered eligible days; excludes other payment adjustments and cash.");
  if (!input.providerId.trim() || !input.rateType.trim()) output.reasons.push("Enter an exact Louisiana Medicaid provider ID and covered rate type; no hospital is selected automatically.");
  if (input.coverage !== "feeForService") output.reasons.push("This public FFS schedule does not establish managed-care contract payment.");
  if (!dateIsValid(input.firstEligibleDate) || !dateIsValid(input.lastEligibleDate) || input.firstEligibleDate > input.lastEligibleDate) output.reasons.push("Enter a valid inclusive eligible-service date interval.");
  if (output.reasons.length) return output;
  const first = Date.parse(`${input.firstEligibleDate}T00:00:00Z`);
  const last = Date.parse(`${input.lastEligibleDate}T00:00:00Z`);
  if ((last - first) / 86400000 > 365) { output.reasons.push("Limit each scenario to at most 366 eligible days."); return output; }
  const reasons = new Set<string>();
  const facilityNames = new Set<string>();
  for (let stamp = first; stamp <= last; stamp += 86400000) {
    const date = new Date(stamp).toISOString().slice(0, 10);
    const selectedReleases = releases.filter(release => release.scenarioCoverageFrom <= date && release.scenarioCoverageThrough >= date);
    if (selectedReleases.length !== 1) { reasons.add(`No unique verified release for ${date}.`); continue; }
    const release = selectedReleases[0]!; // Exactly one release was required above.
    const rows = release.rows.filter(row => row.providerId === input.providerId.trim() && row.rateType === input.rateType);
    if (rows.length !== 1) { reasons.add(`${release.releaseId}: ${rows.length ? "ambiguous" : "missing"} exact provider/rate-type row.`); continue; }
    const row = rows[0]!; // Exactly one source row was required above.
    if (!centsIsValid(row.perDiemCents) || !row.rowEffectiveFrom || row.rowEffectiveFrom > date) { reasons.add(`${release.releaseId} row ${row.sourceRow}: missing rate or inapplicable row effective date.`); continue; }
    facilityNames.add(row.facilityName);
    const locator = `'${release.sheet}'!A${row.sourceRow}:K${row.sourceRow}; rate J${row.sourceRow}, effective K${row.sourceRow}`;
    const line = output.lines.find(entry => entry.source.releaseId === release.releaseId && entry.source.locator === locator);
    if (line) { line.units += 1; line.amountCents += row.perDiemCents; }
    else output.lines.push({ label: `${row.facilityName} — ${row.rateType}`, units: 1, unitRateCents: row.perDiemCents, amountCents: row.perDiemCents, source: { publisher: release.publisher, releaseId: release.releaseId, sourceUrl: release.sourceUrl, sha256: release.sha256, locator } });
  }
  if (reasons.size) {
    output.reasons = [...reasons];
    // Prevent a partially priced interval from looking like an all-period result.
    output.lines = [];
    return output;
  }
  output.status = "priced";
  output.amountCents = output.lines.reduce((sum, line) => sum + line.amountCents, 0);
  output.inputs = { ...input, referenceFacilities: [...facilityNames] };
  output.reasons.push("Public reference-provider scenario only. Eligibility, covered days and applicability must be reviewed; this does not bind the Dunder Mifflin profile.");
  return output;
}

export function calculateIpfBaseComponent(input: { dischargeDate: string; wageIndex: string; qualityReporting: "compliant" | "reduced" }): RevOpsPricingResult {
  const output = result("ipf-fy2026-wage-base-component-v1", input, "Wage-adjusted federal base component only; final IPF allowance unavailable.");
  if (!dateIsValid(input.dischargeDate) || input.dischargeDate < "2025-10-01" || input.dischargeDate > "2026-09-30") output.reasons.push("This verified FY2026 release applies by discharge date through September 30, 2026. Other fiscal years are unsupported.");
  if (!/^(\d{1,2})(\.\d{1,6})?$/.test(input.wageIndex) || Number(input.wageIndex) <= 0 || Number(input.wageIndex) > 10) output.reasons.push("Enter the applicable wage index greater than zero (up to six decimal places).");
  if (!["compliant", "reduced"].includes(input.qualityReporting)) output.reasons.push("Select the quality-reporting branch.");
  if (output.reasons.length) return output;
  const [whole, fraction = ""] = input.wageIndex.split(".");
  const wageMillionths = BigInt(Number(whole) * 1000000 + Number(fraction.padEnd(6, "0")));
  // Apply the published dollar labor/non-labor amounts from Addendum A, page 1.
  const labor = input.qualityReporting === "compliant" ? 70537 : 69160;
  const nonLabor = input.qualityReporting === "compliant" ? 18750 : 18384;
  const amount = Number((BigInt(labor) * wageMillionths + BigInt(nonLabor) * 1000000n + 500000n) / 1000000n);
  output.status = "componentOnly";
  output.amountCents = amount;
  output.inputs = { ...input, laborCents: labor, nonLaborCents: nonLabor };
  output.lines.push({ label: `(${labor / 100} labor × ${input.wageIndex}) + ${nonLabor / 100} non-labor`, units: 1, unitRateCents: amount, amountCents: amount, source: IPF_2026_SOURCE });
  output.reasons.push("Final allowance is not calculated: provider wage history/cap, rural/teaching, patient/day factors, interrupted stays, ECT and outlier applicability are unresolved. The entered wage index is a scenario input, not a verified selected-hospital value.");
  return output;
}
