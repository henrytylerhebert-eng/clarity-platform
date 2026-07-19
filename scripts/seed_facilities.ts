import { Prisma, PrismaClient, OrganizationType, CoverageType } from '@prisma/client';
import * as fs from 'fs';
import { parse } from 'csv-parse/sync';

const prisma = new PrismaClient();
type FacilityCsvRecord = Record<string, string | undefined>;

async function main() {
  console.log('Starting migration script...');

  // 1. Create or get the master organization
  let org = await prisma.organization.findFirst({
    where: { name: 'Louisiana Healthcare Network' }
  });
  if (!org) {
    org = await prisma.organization.create({
      data: {
        name: 'Louisiana Healthcare Network',
        type: OrganizationType.ADMINISTRATIVE,
      }
    });
    console.log(`Created new organization: ${org.id}`);
  } else {
    console.log(`Using existing organization: ${org.id}`);
  }

  // 2. Load the CSV
  const csvPath = '/Users/tylerhebert/Library/CloudStorage/GoogleDrive-henrytylerhebert@gmail.com/My Drive/Clarity-Platform/Louisiana_Master_Behavioral_Health_Directory.csv';
  const csvData = fs.readFileSync(csvPath, 'utf8');

  const records = parse(csvData, {
    columns: true,
    skip_empty_lines: true
  }) as FacilityCsvRecord[];

  console.log(`Parsed ${records.length} records from CSV.`);

  // 3. Prepare data for bulk insert
  const BATCH_SIZE = 500;
  let batch: Prisma.FacilityProfileCreateManyInput[] = [];
  let totalInserted = 0;

  for (const record of records) {
    const name = record['Facility Name']?.trim();
    if (!name) continue;

    // Map Coverage
    const coverageTypes: CoverageType[] = [];
    if (record['Medicare Enrolled (Y/N)'] === 'Y') coverageTypes.push(CoverageType.MEDICARE);
    if (record['Medicaid Enrolled (Y/N)'] === 'Y') coverageTypes.push(CoverageType.MEDICAID);
    
    // Convert to Prisma payload
    batch.push({
      organizationId: org.id,
      name: name.substring(0, 255),
      programs: [],
      acceptedCoverageTypes: coverageTypes,
      medicalCapabilities: [],
      exclusionCriteria: [],
      legalStatusCapabilities: [],
      transportationRules: [],
      referralRequirements: []
    });

    if (batch.length >= BATCH_SIZE) {
      await prisma.facilityProfile.createMany({
        data: batch,
        skipDuplicates: true
      });
      totalInserted += batch.length;
      console.log(`Inserted ${totalInserted} records so far...`);
      batch = [];
    }
  }

  if (batch.length > 0) {
    await prisma.facilityProfile.createMany({
      data: batch,
      skipDuplicates: true
    });
    totalInserted += batch.length;
    console.log(`Inserted ${totalInserted} records total.`);
  }

  console.log('Migration complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
