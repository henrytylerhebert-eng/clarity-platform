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
 * A tenant-owned model is covered when either:
 *   - the harness deletes it explicitly, or
 *   - it reaches an explicitly-deleted model through `onDelete: Cascade`, so the
 *     database removes it for us and an explicit delete would be redundant.
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

function harnessDeletedModels(): Set<string> {
  const source = readFileSync(HARNESS, "utf8");
  const deleted = new Set<string>();
  for (const m of source.matchAll(/prisma\.(\w+)\.deleteMany/g)) {
    const name = m[1];
    if (name) deleted.add(name.charAt(0).toUpperCase() + name.slice(1));
  }
  return deleted;
}

/** A model is covered if deleted outright, or if it cascades from a covered model. */
function isCovered(
  name: string,
  models: Map<string, ModelInfo>,
  deleted: Set<string>,
  seen = new Set<string>(),
): boolean {
  if (deleted.has(name)) return true;
  if (seen.has(name)) return false; // cycle guard
  seen.add(name);
  const info = models.get(name);
  if (!info) return false;
  return info.cascadeParents.some((parent) => isCovered(parent, models, deleted, seen));
}

describe("tenant cleanup coverage (schema-driven)", () => {
  const models = parseModels(readSchemas());
  const deleted = harnessDeletedModels();

  it("parses the Prisma schema and the harness delete list", () => {
    expect(models.size).toBeGreaterThan(40);
    expect(deleted.size).toBeGreaterThan(30);
  });

  it("every tenant-owned model is deleted explicitly or covered by a cascade", () => {
    const tenantOwned = [...models.values()].filter((m) => m.tenantFields.length > 0);
    expect(tenantOwned.length).toBeGreaterThan(0);

    const gaps = tenantOwned
      .filter((m) => !(m.name in ACKNOWLEDGED_GLOBAL))
      .filter((m) => !isCovered(m.name, models, deleted))
      .map((m) => `${m.name} (tenant field: ${m.tenantFields.join(", ")})`);

    expect(
      gaps,
      `These models are tenant-owned but the integration harness neither deletes them nor ` +
        `reaches them through onDelete: Cascade. Add them to deleteTenantRecords in ` +
        `tests/integration/helpers/harness.ts (or declare them in ACKNOWLEDGED_GLOBAL with a ` +
        `reason). Leaving a gap here leaks whole test tenants into the developer database.`,
    ).toEqual([]);
  });

  it("the two known non-standard tenant keys stay covered", () => {
    // Regression guards for the specific gaps found in Phase 3A forensics.
    expect(isCovered("PayerProfile", models, deleted)).toBe(true);
    expect(isCovered("RevOpsRateRelease", models, deleted)).toBe(true);
  });

  it("documents cascade-covered models rather than demanding redundant deletes", () => {
    // SourceDocument is tenant-owned but cascades from BehavioralHealthCase.
    const sourceDocument = models.get("SourceDocument");
    expect(sourceDocument?.tenantFields).toContain("organizationId");
    expect(deleted.has("SourceDocument")).toBe(false);
    expect(isCovered("SourceDocument", models, deleted)).toBe(true);
  });
});
