import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { readFileSync, unlinkSync } from "node:fs";

const envFile = readFileSync(".env", "utf8");
const fileDatabaseUrl = envFile.match(/^DATABASE_URL=(.*)$/m)?.[1];
const baseUrl = (process.env.DATABASE_URL ?? fileDatabaseUrl ?? "").replace(/^['"]|['"]$/g, "");
if (!baseUrl) throw new Error("DATABASE_URL is required");

const parsed = new URL(baseUrl);
const databaseName = parsed.pathname.replace(/^\//, "");
if (parsed.hostname !== "localhost" || databaseName !== "clarity_dev") {
  throw new Error("This verifier only permits the local clarity_dev database URL");
}

const suffix = `${Date.now()}_${randomUUID().slice(0, 8)}`;
const replayDatabase = `clarity_replay_${suffix}`;
const restoreDatabase = `clarity_restore_${suffix}`;
const dumpPath = `/tmp/${replayDatabase}.dump`;

function databaseUrl(name: string): string {
  const next = new URL(baseUrl);
  next.pathname = `/${name}`;
  return next.toString();
}

function sqlDatabaseUrl(name: string): string {
  const next = new URL(databaseUrl(name));
  next.searchParams.delete("schema");
  return next.toString();
}

function run(command: string, args: string[], env: NodeJS.ProcessEnv = process.env): void {
  execFileSync(command, args, { stdio: "inherit", env });
}

function query(url: string, sql: string): string {
  return execFileSync("psql", [url, "-Atqc", sql], { encoding: "utf8", env: process.env }).trim();
}

const replayUrl = databaseUrl(replayDatabase);
const sqlBaseUrl = sqlDatabaseUrl(databaseName);
const sqlReplayUrl = sqlDatabaseUrl(replayDatabase);
const sqlRestoreUrl = sqlDatabaseUrl(restoreDatabase);

try {
  run("psql", [sqlBaseUrl, "-v", "ON_ERROR_STOP=1", "-c", `CREATE DATABASE "${replayDatabase}"`]);
  run("npx", ["prisma", "migrate", "deploy", "--schema", "prisma/schema.prisma"], {
    ...process.env,
    DATABASE_URL: replayUrl,
  });
  const replayMigrations = query(sqlReplayUrl, "SELECT count(*) FROM _prisma_migrations WHERE finished_at IS NOT NULL");
  const replayEpisodeTable = query(sqlReplayUrl, `SELECT to_regclass('"Episode"') IS NOT NULL`);
  console.log(`LOCAL_REPLAY migrations=${replayMigrations} episode_table=${replayEpisodeTable}`);

  run("pg_dump", ["--format=custom", "--file", dumpPath, sqlReplayUrl]);
  run("psql", [sqlBaseUrl, "-v", "ON_ERROR_STOP=1", "-c", `CREATE DATABASE "${restoreDatabase}"`]);
  run("pg_restore", ["--no-owner", "--dbname", sqlRestoreUrl, dumpPath]);
  const restoredMigrations = query(sqlRestoreUrl, "SELECT count(*) FROM _prisma_migrations WHERE finished_at IS NOT NULL");
  const restoredEpisodeTable = query(sqlRestoreUrl, `SELECT to_regclass('"Episode"') IS NOT NULL`);
  console.log(`LOCAL_RESTORE migrations=${restoredMigrations} episode_table=${restoredEpisodeTable}`);
} finally {
  try {
    unlinkSync(dumpPath);
  } catch {
    // The dump may not exist if replay failed before backup creation.
  }
  run("psql", [sqlBaseUrl, "-v", "ON_ERROR_STOP=1", "-c", `DROP DATABASE IF EXISTS "${restoreDatabase}"`]);
  run("psql", [sqlBaseUrl, "-v", "ON_ERROR_STOP=1", "-c", `DROP DATABASE IF EXISTS "${replayDatabase}"`]);
}
