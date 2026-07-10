import type { AcuityProfile, AgeBand, Bed, PlacementFlag, Unit } from "./types";

function riskRank(risk: AcuityProfile["aggressionRisk"]): number {
  return { Low: 0, Moderate: 1, High: 2, Unknown: 1 }[risk];
}

export function evaluatePlacement(
  candidate: AcuityProfile,
  candidateAgeBand: AgeBand,
  bed: Bed,
  unit: Unit,
  unitBeds: Bed[],
): PlacementFlag[] {
  const flags: PlacementFlag[] = [];

  if (bed.status !== "Available") {
    flags.push({ severity: "Hard stop", code: "bed_unavailable", message: `Bed is ${bed.status.toLowerCase()}.` });
  }

  if (candidateAgeBand !== "Unknown" && candidateAgeBand !== unit.population) {
    flags.push({
      severity: "Hard stop",
      code: "population_mismatch",
      message: `${unit.name} serves a ${unit.population.toLowerCase()} population; candidate is ${candidateAgeBand.toLowerCase()}.`,
    });
  }

  const roommate = unitBeds.find(
    (other) => other.id !== bed.id && other.room === bed.room && other.status === "Occupied" && other.occupantAcuity,
  );
  if (roommate?.occupantAcuity) {
    if (riskRank(roommate.occupantAcuity.aggressionRisk) >= 2 && (candidate.vulnerableAdult || candidate.siPrecautions)) {
      flags.push({
        severity: "Hard stop",
        code: "roommate_aggression_vulnerable",
        message: `Roommate in ${bed.room} has high aggression risk; candidate is flagged vulnerable or on SI precautions.`,
      });
    } else if (riskRank(roommate.occupantAcuity.aggressionRisk) >= 2 || riskRank(candidate.aggressionRisk) >= 2) {
      flags.push({
        severity: "Warning",
        code: "roommate_aggression_mix",
        message: `Aggression-risk mix in ${bed.room} needs charge nurse review before placement.`,
      });
    }
    if (roommate.occupantAcuity.observationLevel === "1:1" && candidate.observationLevel === "1:1") {
      flags.push({
        severity: "Warning",
        code: "double_one_to_one",
        message: `Two 1:1 observation patients in one room strains staffing coverage.`,
      });
    }
  }

  if (candidate.elopementRisk === "High" && bed.nearExit) {
    flags.push({
      severity: "Warning",
      code: "elopement_near_exit",
      message: "High elopement risk placed adjacent to a unit exit. Prefer a bed near the nurse station.",
    });
  }

  if (candidate.siPrecautions && !bed.nearNurseStation) {
    flags.push({
      severity: "Info",
      code: "si_far_from_station",
      message: "SI precautions favor line-of-sight beds near the nurse station.",
    });
  }

  const projected = unitAcuitySummary(unit, unitBeds).averageAcuity;
  const occupiedCount = unitBeds.filter((other) => other.status === "Occupied").length;
  const projectedAverage = (projected * occupiedCount + candidate.acuityLevel) / (occupiedCount + 1);
  if (projectedAverage > unit.acuityCeiling) {
    flags.push({
      severity: "Warning",
      code: "unit_acuity_ceiling",
      message: `Placement pushes ${unit.name} average acuity to ${projectedAverage.toFixed(1)}, above its ceiling of ${unit.acuityCeiling}.`,
    });
  }

  return flags;
}

export interface UnitAcuitySummary {
  occupiedBeds: number;
  availableBeds: number;
  averageAcuity: number;
  oneToOneCount: number;
  q15Count: number;
}

export function unitAcuitySummary(unit: Unit, unitBeds: Bed[]): UnitAcuitySummary {
  const occupants = unitBeds
    .filter((bed) => bed.unitId === unit.id && bed.status === "Occupied" && bed.occupantAcuity)
    .map((bed) => bed.occupantAcuity as AcuityProfile);
  const averageAcuity = occupants.length
    ? occupants.reduce((sum, acuity) => sum + acuity.acuityLevel, 0) / occupants.length
    : 0;
  return {
    occupiedBeds: occupants.length,
    availableBeds: unitBeds.filter((bed) => bed.unitId === unit.id && bed.status === "Available").length,
    averageAcuity,
    oneToOneCount: occupants.filter((acuity) => acuity.observationLevel === "1:1").length,
    q15Count: occupants.filter((acuity) => acuity.observationLevel === "Q15").length,
  };
}

export function validatePlacementDecision(decision: "Accepted" | "Overridden", overrideReason?: string): string | null {
  if (decision === "Overridden" && !overrideReason?.trim()) {
    return "Override requires a documented reason. Charge nurse decision remains final.";
  }
  return null;
}
