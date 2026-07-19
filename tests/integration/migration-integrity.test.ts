import { readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createHarness, type Harness } from "./helpers/harness.js";

type MigrationRow = {
  migration_name: string;
  finished_at: Date | null;
  rolled_back_at: Date | null;
};

type IndexRow = {
  indexname: string;
  indexdef: string;
};

const migrationDirectory = fileURLToPath(new URL("../../prisma/migrations/", import.meta.url));

function repositoryMigrationNames(): string[] {
  return readdirSync(migrationDirectory, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && /^\d+_.+/.test(entry.name))
    .map((entry) => entry.name)
    .sort();
}

let h: Harness;

beforeAll(async () => {
  h = await createHarness();
});

afterAll(async () => h?.dispose());

describe("migration integrity", () => {
  it("has every repository migration recorded as successfully applied locally", async () => {
    const rows = await h.prisma.$queryRaw<MigrationRow[]>`
      SELECT migration_name, finished_at, rolled_back_at
      FROM "_prisma_migrations"
      ORDER BY migration_name
    `;

    expect(rows.map((row) => row.migration_name)).toEqual(repositoryMigrationNames());
    expect(rows.every((row) => row.finished_at !== null && row.rolled_back_at === null)).toBe(true);
  });

  it("records the active-admission guard as a unique partial index", async () => {
    const rows = await h.prisma.$queryRaw<IndexRow[]>`
      SELECT indexname, indexdef
      FROM pg_indexes
      WHERE schemaname = 'public'
        AND indexname = 'Episode_active_source_case_key'
    `;

    expect(rows).toHaveLength(1);
    expect(rows[0]?.indexname).toBe("Episode_active_source_case_key");
    expect(rows[0]?.indexdef).toContain('CREATE UNIQUE INDEX "Episode_active_source_case_key"');
    expect(rows[0]?.indexdef).toContain('public."Episode"');
    expect(rows[0]?.indexdef).toContain('"sourceCaseId"');
    expect(rows[0]?.indexdef).toContain("status = 'ACTIVE'");
  });
});
