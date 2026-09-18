import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Tenant-cleanup coverage invariant (issue #24).
 *
 * The integration harness deletes a test tenant by walking an explicit list of
 * models. Every time a tenant-owned model is added to the Prisma schema without
 * being added to that list, the tenant stops deleting cleanly: either the final
 * `organization.deleteMany` throws on a restricting foreign key and the whole
 * tenant leaks, or the rows quietly survive their organization.
 *
 * This test proves coverage from the SCHEMA rather than from a hand-maintained
 * list of model names, so a future model cannot silently open a gap.
 *
 * Coverage is tracked per (model, tenant field) pair, not per model. A model can
 * be owned by more than one tenant — PrescreenSubmission has both
 * `organizationId` and `receivingOrganizationId` — and deleting by one field
 * leaves rows behind when the tenant being cleaned owns the row through the
 * other. A model-level boolean would report that gap as covered.
 *
 * A (model, field) pair is covered when either:
 *   - the harness's delete predicate for that model filters on that field, or
 *   - the model reaches an explicitly-deleted model through `onDelete: Cascade`,
 *     so the database removes it and an explicit delete would be redundant.
 *
 * Anything else must be declared in ACKNOWLEDGED_GLOBAL below with a reason.
 */

const REPO = new URL("../..", import.meta.url).pathname;
const SCHEMA_DIR = join(REPO, "prisma");
const HARNESS = join(REPO, "tests/integration/helpers/harness.ts");

/** Field names that mean "this row belongs to a tenant". */
const TENANT_FIELDS = [
  "organizationId",
  "recordedByOrganizationId",
  "receivingOrganizationId",
  "sendingOrganizationId",
];

/**
 * Models that carry a tenant field but are deliberately NOT tenant-scoped rows
 * to delete. Keep this empty unless there is a real reason; each entry is a
 * documented exception, not a place to silence the invariant.
 */
const ACKNOWLEDGED_GLOBAL: Record<string, string> = {};

interface ModelInfo {
  name: string;
  body: string;
  tenantFields: string[];
  /** parent models this model cascades from */
  cascadeParents: string[];
}

function readSchemas(): string {
  return readdirSync(SCHEMA_DIR)
    .filter((f) => f.endsWith(".prisma"))
    .map((f) => readFileSync(join(SCHEMA_DIR, f), "utf8"))
    .join("\n");
}

function parseModels(source: string): Map<string, ModelInfo> {
  const models = new Map<string, ModelInfo>();
  const modelRe = /^model\s+(\w+)\s*\{([\s\S]*?)^\}/gm;
  let m: RegExpExecArray | null;
  while ((m = modelRe.exec(source)) !== null) {
    const [, name, body] = m;
    if (!name || body === undefined) continue;
    const tenantFields = TENANT_FIELDS.filter((f) =>
      new RegExp(`^\\s*${f}\\s`, "m").test(body),
    );
    const cascadeParents: string[] = [];
    for (const line of body.split("\n")) {
      if (!line.includes("@relation") || !line.includes("onDelete: Cascade")) continue;
      // `case  BehavioralHealthCase  @relation(fields: [caseId], ...)` -> parent type is token 2
      const parts = line.trim().split(/\s+/);
      const parent = parts[1]?.replace(/[?[\]]/g, "");
      if (parent) cascadeParents.push(parent);
    }
    models.set(name, { name, body, tenantFields, cascadeParents });
  }
  return models;
}

/**
 * Model name -> the tenant fields its delete predicate actually filters on.
 *
 * Coverage is tracked per FIELD, not per model. A model with two ownership
 * fields (PrescreenSubmission has organizationId and receivingOrganizationId)
 * is only covered for the fields its `where` clause names: deleting by
 * organizationId alone leaves rows behind when the tenant being cleaned is only
 * the receiver.
 */
function harnessDeletePredicates(): Map<string, Set<string>> {
  const source = readFileSync(HARNESS, "utf8");
  const byModel = new Map<string, Set<string>>();
  // Capture each deleteMany call together with its argument object, balanced by
  // scanning braces from the opening parenthesis.
  const callRe = /prisma\.(\w+)\.deleteMany\(/g;
  let call: RegExpExecArray | null;
  while ((call = callRe.exec(source)) !== null) {
    const raw = call[1];
    if (!raw) continue;
    const model = raw.charAt(0).toUpperCase() + raw.slice(1);
    let depth = 0;
    let end = call.index + call[0].length;
    for (; end < source.length; end += 1) {
      const ch = source[end];
      if (ch === "(") depth += 1;
      else if (ch === ")") {
        if (depth === 0) break;
        depth -= 1;
      }
    }
    const args = source.slice(call.index + call[0].length, end);
    const fields = byModel.get(model) ?? new Set<string>();
    for (const field of TENANT_FIELDS) {
      if (new RegExp(`\\b${field}\\b`).test(args)) fields.add(field);
    }
    byModel.set(model, fields);
  }
  return byModel;
}

/** True when the database removes this model's rows via a cascade from a deleted model. */
function isCascadeCovered(
  name: string,
  models: Map<string, ModelInfo>,
  predicates: Map<string, Set<string>>,
  seen = new Set<string>(),
): boolean {
  if (seen.has(name)) return false; // cycle guard
  seen.add(name);
  const info = models.get(name);
  if (!info) return false;
  return info.cascadeParents.some(
    (parent) => predicates.has(parent) || isCascadeCovered(parent, models, predicates, seen),
  );
}

/** A (model, tenant field) pair is covered by an explicit predicate or by a cascade. */
function isFieldCovered(
  model: string,
  field: string,
  models: Map<string, ModelInfo>,
  predicates: Map<string, Set<string>>,
): boolean {
  if (predicates.get(model)?.has(field)) return true;
  return isCascadeCovered(model, models, predicates);
}

describe("tenant cleanup coverage (schema-driven)", () => {
  const models = parseModels(readSchemas());
  const predicates = harnessDeletePredicates();

  it("parses the Prisma schema and the harness delete predicates", () => {
    expect(models.size).toBeGreaterThan(40);
    expect(predicates.size).toBeGreaterThan(30);
  });

  it("every tenant field of every tenant-owned model is covered", () => {
    const tenantOwned = [...models.values()].filter((m) => m.tenantFields.length > 0);
    expect(tenantOwned.length).toBeGreaterThan(0);

    const gaps: string[] = [];
    for (const model of tenantOwned) {
      if (model.name in ACKNOWLEDGED_GLOBAL) continue;
      for (const field of model.tenantFields) {
        if (!isFieldCovered(model.name, field, models, predicates)) {
          gaps.push(`${model.name}.${field}`);
        }
      }
    }

    expect(
      gaps,
      `These tenant ownership fields are not covered by the integration harness: its ` +
        `delete predicate for the model does not filter on the field, and the model is not ` +
        `removed by an onDelete: Cascade. Add the field to the model's where clause in ` +
        `deleteTenantRecords (tests/integration/helpers/harness.ts), or declare the model in ` +
        `ACKNOWLEDGED_GLOBAL with a reason. An uncovered field leaks rows whose tenant is ` +
        `reached only through that field.`,
    ).toEqual([]);
  });

  it("covers both ownership fields of the one multi-tenant model", () => {
    // PrescreenSubmission is owned by the sender AND the receiver. Deleting by
    // organizationId alone left receiver-owned submissions behind.
    const submission = models.get("PrescreenSubmission");
    expect(submission?.tenantFields.sort()).toEqual(["organizationId", "receivingOrganizationId"]);
    expect(predicates.get("PrescreenSubmission")).toContain("organizationId");
    expect(predicates.get("PrescreenSubmission")).toContain("receivingOrganizationId");
  });

  it("the two known non-standard tenant keys stay covered", () => {
    // Regression guards for the specific gaps found in Phase 3A forensics.
    expect(isFieldCovered("PayerProfile", "organizationId", models, predicates)).toBe(true);
    expect(
      isFieldCovered("RevOpsRateRelease", "recordedByOrganizationId", models, predicates),
    ).toBe(true);
  });

  it("accepts cascade coverage rather than demanding redundant deletes", () => {
    // SourceDocument is tenant-owned but cascades from BehavioralHealthCase.
    expect(models.get("SourceDocument")?.tenantFields).toContain("organizationId");
    expect(predicates.has("SourceDocument")).toBe(false);
    expect(isFieldCovered("SourceDocument", "organizationId", models, predicates)).toBe(true);
  });
});
