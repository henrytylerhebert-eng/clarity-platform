import { createPrismaClient } from "../../packages/case-repository/src/prismaClient.js";
import {
  ASSURANCE_DEV_FIXTURE,
  ASSURANCE_DEV_USERS,
  applyAssuranceDevReplayMutation,
  resetAssuranceDevFixture,
  type AssuranceReplayMutation,
} from "../../packages/api-service/src/assuranceDevFixture.js";

export { ASSURANCE_DEV_FIXTURE, ASSURANCE_DEV_USERS };

async function withPrisma<T>(work: (prisma: ReturnType<typeof createPrismaClient>) => Promise<T>): Promise<T> {
  const prisma = createPrismaClient();
  try {
    return await work(prisma);
  } finally {
    await prisma.$disconnect();
  }
}

/** Smoke-only direct reset against the inherited disposable clarity_dev DB. */
export function resetAssuranceFixtureForE2E() {
  return withPrisma((prisma) => resetAssuranceDevFixture(prisma));
}

/** Smoke-only source replay mutation. Never exposed through HTTP. */
export function mutateAssuranceFixtureForE2E(mutation: AssuranceReplayMutation) {
  return withPrisma((prisma) => applyAssuranceDevReplayMutation(prisma, mutation));
}
