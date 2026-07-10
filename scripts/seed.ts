import { PrismaClient } from "@prisma/client";
import fs from "node:fs";
import path from "node:path";

const prisma = new PrismaClient();

async function main() {
  const org = await prisma.organization.upsert({
    where: { id: "synthetic-org" },
    update: {},
    create: {
      id: "synthetic-org",
      name: "Synthetic Behavioral Health Hospital",
      type: "HOSPITAL_SYSTEM",
      status: "ACTIVE",
      jurisdictionCodes: ["US-LA"]
    }
  });

  const user = await prisma.user.upsert({
    where: { email: "synthetic.intake@example.invalid" },
    update: {},
    create: {
      organizationId: org.id,
      email: "synthetic.intake@example.invalid",
      displayName: "Synthetic Intake User",
      roles: [
        "INTAKE_COORDINATOR",
        "BENEFITS_VERIFICATION_SPECIALIST",
        "AUTHORIZATION_SPECIALIST"
      ],
      status: "ACTIVE"
    }
  });

  const seedDirectory = path.join(process.cwd(), "data", "synthetic-cases");
  const files = fs.readdirSync(seedDirectory).filter((file) => file.endsWith(".json"));

  for (const file of files) {
    const payload = JSON.parse(
      fs.readFileSync(path.join(seedDirectory, file), "utf8")
    );

    console.log(`Loaded synthetic case definition: ${payload.caseKey}`);
  }

  console.log("Base synthetic organization and user created.");
  console.log("Case-specific seed insertion should be added after migration validation.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });