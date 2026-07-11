import { PrismaClient } from "@prisma/client";

/**
 * Single Prisma client factory for the repository layer.
 * Reads DATABASE_URL from the environment (root .env, untracked).
 */
export function createPrismaClient(): PrismaClient {
  return new PrismaClient();
}

/**
 * Test-safety guard: integration tests refuse to run against anything but a
 * local clarity_dev database. Called by the test harness before any write.
 */
export function assertLocalClarityDevDatabase(databaseUrl = process.env.DATABASE_URL): void {
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set; refusing to run database tests");
  }
  const url = new URL(databaseUrl);
  const dbName = url.pathname.replace(/^\//, "");
  const host = url.hostname;
  if (dbName !== "clarity_dev" || !["localhost", "127.0.0.1"].includes(host)) {
    throw new Error(
      `Refusing to run database tests against "${dbName}" on "${host}" — only local clarity_dev is permitted`,
    );
  }
}
