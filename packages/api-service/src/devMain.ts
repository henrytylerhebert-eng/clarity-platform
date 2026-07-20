import {
  assertLocalClarityDevDatabase,
  createPrismaClient,
  PrismaAuthGateway,
  PrismaCaseCommandGateway,
  PrismaNetworkReviewGateway,
} from "@clarity/case-repository";
import { AuthenticationService, LocalDevIdentityProvider } from "@clarity/auth-service";
import { CaseCommandService } from "@clarity/case-service";
import {
  InMemoryPrescreenGateway,
  PRESCREEN_PRODUCTION_POLICY,
  PrescreenCommandService,
} from "@clarity/prescreen-service";
import { createApiServer } from "./server.js";
import { createNetworkEnrichmentReviewCommandCaller } from "./reviewCommandCaller.js";

/**
 * DEVELOPMENT-ONLY runner (same posture as LocalDevIdentityProvider): seeds a
 * synthetic tenant into the local clarity_dev database, registers synthetic
 * assertions, and serves the API for the prototype UI. Everything is
 * idempotent — safe to restart. Never fronts a real deployment.
 *
 *   npm run api:dev
 */

const ORG_ID = "synthetic-org-api-dev";
const CASE_KEY = "SYN-API-CASE-0001";
const LEGAL_RECORD_ID = "synthetic-legal-record-api-dev";

const DEV_USERS = [
  {
    id: "synthetic-user-api-physician",
    email: "syn-api-physician@example.test",
    displayName: "Synthetic Physician Reviewer",
    roles: ["PHYSICIAN_REVIEWER"],
    assertion: "syn-assert-api-physician-dev",
  },
  {
    id: "synthetic-user-api-sysadmin",
    email: "syn-api-sysadmin@example.test",
    displayName: "Synthetic System Admin",
    roles: ["SYSTEM_ADMIN"],
    assertion: "syn-assert-api-sysadmin-dev",
  },
  {
    id: "synthetic-user-api-intake",
    email: "syn-api-intake@example.test",
    displayName: "Synthetic Intake Coordinator",
    roles: ["INTAKE_COORDINATOR"],
    assertion: "syn-assert-api-intake-dev",
  },
] as const;

async function main(): Promise<void> {
  // Same guard as the test harness: refuse anything but local clarity_dev.
  assertLocalClarityDevDatabase();
  const prisma = createPrismaClient();

  await prisma.organization.upsert({
    where: { id: ORG_ID },
    update: {},
    create: {
      id: ORG_ID,
      name: "Synthetic API Dev Org",
      type: "SENDING_FACILITY",
      jurisdictionCodes: ["SYN"],
    },
  });

  const provider = new LocalDevIdentityProvider();
  for (const user of DEV_USERS) {
    await prisma.user.upsert({
      where: { id: user.id },
      update: { roles: [...user.roles], status: "ACTIVE" },
      create: {
        id: user.id,
        organizationId: ORG_ID,
        email: user.email,
        displayName: user.displayName,
        roles: [...user.roles],
        status: "ACTIVE",
      },
    });
    provider.register(user.assertion, user.email);
  }

  const patientToken = await prisma.patientToken.upsert({
    where: { id: "synthetic-pt-api-dev" },
    update: {},
    create: {
      id: "synthetic-pt-api-dev",
      organizationId: ORG_ID,
      externalPatientReference: "SYN-API-DEV",
      privacyFlags: ["SYNTHETIC_ONLY"],
    },
  });

  // caseKey maps onto the row primary key `id` (see case-repository mappers).
  const persistedCase = await prisma.behavioralHealthCase.upsert({
    where: { id: CASE_KEY },
    update: {},
    create: {
      id: CASE_KEY,
      organizationId: ORG_ID,
      patientTokenId: patientToken.id,
      status: "DRAFT",
      urgency: "ROUTINE",
    },
  });
  await prisma.legalStatusRecord.upsert({
    where: { id: LEGAL_RECORD_ID },
    update: {},
    create: {
      id: LEGAL_RECORD_ID,
      caseId: persistedCase.id,
      jurisdiction: "SYN",
      statusType: "INVOLUNTARY_EMERGENCY",
      authorizingAuthority: "Synthetic Physician Reviewer",
    },
  });

  const auth = new AuthenticationService(provider, new PrismaAuthGateway(prisma));
  const caseCommands = new CaseCommandService(new PrismaCaseCommandGateway(prisma));
  const networkEnrichmentReviewInvoker = createNetworkEnrichmentReviewCommandCaller({
    gateway: new PrismaNetworkReviewGateway(prisma),
  });
  // Phase 2 gateway: prescreen state is process-local and non-durable (ADR-0014).
  const prescreen = new PrescreenCommandService(new InMemoryPrescreenGateway(), PRESCREEN_PRODUCTION_POLICY);
  const server = createApiServer({ auth, caseCommands, networkEnrichmentReviewInvoker, prescreen });

  const port = Number(process.env.API_PORT ?? 4315);
  server.listen(port, "127.0.0.1", () => {
    console.log(`[api-service] listening on http://127.0.0.1:${port}`);
    console.log(`[api-service] synthetic tenant: ${ORG_ID}`);
    console.log(`[api-service] synthetic case:   ${CASE_KEY}`);
    console.log(`[api-service] citable legal record: ${LEGAL_RECORD_ID}`);
    console.log("[api-service] dev assertions (synthetic, dev-only):");
    for (const user of DEV_USERS) {
      console.log(`  ${user.assertion}  →  ${user.displayName} [${user.roles.join(", ")}]`);
    }
  });
}

main().catch((error) => {
  console.error("[api-service] failed to start:", error);
  process.exitCode = 1;
});
