import type {
  SurveillanceFactValue,
  SurveillanceRuleExpression,
} from "@clarity/domain-contracts";
import { AssuranceValidationError } from "./errors.js";

export type SurveillanceFacts = Readonly<Record<string, SurveillanceFactValue>>;

function compareScalar(left: unknown, right: unknown, op: "gt" | "gte" | "lt" | "lte"): boolean {
  if (typeof left !== "number" || typeof right !== "number") return false;
  if (op === "gt") return left > right;
  if (op === "gte") return left >= right;
  if (op === "lt") return left < right;
  return left <= right;
}

function includes(container: unknown, value: unknown): boolean {
  if (typeof container === "string" && typeof value === "string") return container.includes(value);
  if (Array.isArray(container)) return container.includes(value);
  return false;
}

export function evaluateSurveillanceRule(
  expression: SurveillanceRuleExpression,
  facts: SurveillanceFacts,
): boolean {
  if ("all" in expression) return expression.all.every((node) => evaluateSurveillanceRule(node, facts));
  if ("any" in expression) return expression.any.some((node) => evaluateSurveillanceRule(node, facts));
  if ("not" in expression) return !evaluateSurveillanceRule(expression.not, facts);

  const actual = facts[expression.fact];
  switch (expression.op) {
    case "exists":
      return actual !== undefined && actual !== null;
    case "eq":
      return Object.is(actual, expression.value);
    case "ne":
      return !Object.is(actual, expression.value);
    case "in":
      return Array.isArray(expression.value) && expression.value.includes(actual as never);
    case "not_in":
      return Array.isArray(expression.value) && !expression.value.includes(actual as never);
    case "contains":
      return includes(actual, expression.value);
    case "gt":
    case "gte":
    case "lt":
    case "lte":
      return compareScalar(actual, expression.value, expression.op);
  }
}

export function validateSurveillanceFactNamespace(facts: SurveillanceFacts): void {
  const allowedPrefixes = ["facility.", "location.", "scene.", "subject.", "evidence.", "organization.", "request."];
  const invalid = Object.keys(facts).find((key) => !allowedPrefixes.some((prefix) => key.startsWith(prefix)));
  if (invalid) throw new AssuranceValidationError("surveillance_fact_namespace_invalid");
}
