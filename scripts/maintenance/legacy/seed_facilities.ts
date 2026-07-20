/**
 * LEGACY MAINTENANCE TOOL — REAL-WORLD DATA LOADER. NOT A TEST FIXTURE.
 *
 * Loads a real-world facility-directory CSV into FacilityProfile. This is
 * exactly the kind of data the repository's synthetic-only governance
 * excludes from clarity_dev, so the script is disabled by default and
 * every write requires BOTH an environment opt-in and an explicit flag:
 *
 *   ALLOW_REAL_WORLD_DIRECTORY_SEED=true \
 *     npx tsx scripts/maintenance/legacy/seed_facilities.ts \
 *     --file <path-to-csv> --confirm [--dataset-id <label>]
 *
 * Without --confirm the script runs in DRY-RUN mode: it parses and reports
 * what it WOULD insert and writes nothing. There is no default CSV path.
 * Never point this at a database used by the synthetic test harness.
 *
 * Governance record: docs/decisions/NETWORK_ENRICHMENT_REAL_DATA_INCIDENT.md
 * (2026-07-19 audit found zero rows loaded in clarity_dev; the original
 * unguarded script — hardcoded personal-drive path, wrote by default — is
 * preserved in git history at scripts/seed_facilities.ts).
 */
import * as fs from "node:fs";
import { parse } from "csv-parse/sync";
import { createPrismaClient } from "@clarity/case-repository";

type FacilityCsvRecord = Record<string, string | undefined>;

const BANNER = [
  "=".repeat(72),
  "WARNING: REAL-WORLD DATA LOADER (legacy maintenance tool)",
  "This inserts non-synthetic facility-directory rows. The repository's",
  "synthetic-only posture forbids running this against any database used",
  "by the test harness (local clarity_dev included).",
  "=".repeat(72),
].join("\n");

function argValue(flag: string): string | undefined {
  const index = process.argv.indexOf(flag);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

async function main() {
  console.log(BANNER);

  if (process.env.ALLOW_REAL_WORLD_DIRECTORY_SEED !== "true") {
    console.error(
      "Refusing to run: set ALLOW_REAL_WORLD_DIRECTORY_SEED=true to acknowledge this loads real-world data.",
    );
    process.exit(1);
  }

  const csvPath = argValue("--file");
  if (!csvPath) {
    console.error("Refusing to run: --file <path-to-csv> is required (no default path exists).");
    process.exit(1);
  }

  const dryRun = !process.argv.includes("--confirm");
  const datasetId = argValue("--dataset-id") ?? "unlabeled";
  console.log(`Mode: ${dryRun ? "DRY-RUN (no writes; pass --confirm to write)" : "WRITE"}`);
  console.log(`Dataset: ${datasetId}`);
  console.log(`Source: ${csvPath}`);

  const records = parse(fs.readFileSync(csvPath, "utf8"), {
    columns: true,
    skip_empty_lines: true,
  }) as FacilityCsvRecord[];
  console.log(`Parsed ${records.length} records from CSV.`);

  const rows = records.flatMap((record) => {
    const name = record["Facility Name"]?.trim();
    if (!name) return [];
    const acceptedCoverageTypes: ("MEDICARE" | "MEDICAID")[] = [];
    if (record["Medicare Enrolled (Y/N)"] === "Y") acceptedCoverageTypes.push("MEDICARE");
    if (record["Medicaid Enrolled (Y/N)"] === "Y") acceptedCoverageTypes.push("MEDICAID");
    return [{ name: name.substring(0, 255), acceptedCoverageTypes }];
  });
  console.log(`${rows.length} insertable rows (blank names skipped).`);

  if (dryRun) {
    console.log("DRY-RUN complete. Nothing was written.");
    return;
  }

  const prisma = createPrismaClient();
  try {
    let org = await prisma.organization.findFirst({
      where: { name: "Louisiana Healthcare Network" },
    });
    org ??= await prisma.organization.create({
      data: { name: "Louisiana Healthcare Network", type: "ADMINISTRATIVE" },
    });
    console.log(`Organization: ${org.id}`);

    const BATCH_SIZE = 500;
    let totalInserted = 0;
    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      const batch = rows.slice(i, i + BATCH_SIZE).map((row) => ({
        organizationId: org.id,
        name: row.name,
        programs: [],
        acceptedCoverageTypes: row.acceptedCoverageTypes,
        medicalCapabilities: [],
        exclusionCriteria: [],
        legalStatusCapabilities: [],
        transportationRules: [],
        referralRequirements: [],
      }));
      await prisma.facilityProfile.createMany({ data: batch, skipDuplicates: true });
      totalInserted += batch.length;
      console.log(`Inserted ${totalInserted} records so far...`);
    }
    console.log(`Done. ${totalInserted} rows written under dataset "${datasetId}".`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
