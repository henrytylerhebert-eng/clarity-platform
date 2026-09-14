import { execFileSync, spawnSync } from "node:child_process";
import { createServer } from "node:net";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir, userInfo } from "node:os";
import { join } from "node:path";

/**
 * Runs a command against a throwaway PostgreSQL instance, then destroys it.
 *
 *   npm run test:ephemeral                 # defaults to `npx vitest run`
 *   npx tsx scripts/with-ephemeral-database.ts npx vitest run tests/integration
 *
 * Why an ephemeral *instance* rather than an ephemeral database: the suite's
 * safety guard (`assertLocalClarityDevDatabase`) requires the database to be
 * named exactly `clarity_dev` on localhost, so per-session databases cannot be
 * uniquely named without weakening that guard — which is not permitted. Two
 * `clarity_dev` databases cannot coexist on one server, so each session gets
 * its own server on its own port instead. The guard checks host and database
 * name, not port, so it passes unchanged.
 *
 * This never touches the developer's own `clarity_dev`: a fresh data directory
 * under the OS temp dir is initialised, started, migrated, used, stopped, and
 * deleted. Every session therefore sees a migration ledger containing exactly
 * the migrations on its own branch, which is what shared-database ledger
 * contention (issue #31) breaks.
 *
 * Mirrors the ephemeral Postgres service container used by
 * .github/workflows/ci.yml, so local runs and CI agree.
 */

const DATABASE_NAME = "clarity_dev";
const HOST = "127.0.0.1";

/** Fails early with an actionable message rather than midway through setup. */
function requireBinary(name: string): void {
  const probe = spawnSync("which", [name], { encoding: "utf8" });
  if (probe.status !== 0) {
    throw new Error(
      `"${name}" was not found on PATH. PostgreSQL client and server binaries are required; ` +
        `on macOS with Homebrew: brew install postgresql@18 (and add its bin directory to PATH).`,
    );
  }
}

/** Asks the OS for a free port so parallel sessions do not collide. */
function freePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.unref();
    server.on("error", reject);
    server.listen(0, HOST, () => {
      const address = server.address();
      if (address === null || typeof address === "string") {
        server.close();
        reject(new Error("Could not determine a free port"));
        return;
      }
      const { port } = address;
      server.close(() => resolve(port));
    });
  });
}

function run(binary: string, args: string[], env: NodeJS.ProcessEnv = process.env): void {
  execFileSync(binary, args, { stdio: "inherit", env });
}

/**
 * Environment for initdb/pg_ctl. LC_ALL is pinned because on macOS with
 * PostgreSQL 18 an unset or invalid locale makes the postmaster refuse to
 * start ("postmaster became multithreaded during startup"); the cluster and
 * the runtime must agree, so initdb gets the same value.
 */
const POSTGRES_ENV: NodeJS.ProcessEnv = { ...process.env, LC_ALL: "C" };

/**
 * Short directory for the Unix-domain socket. PostgreSQL caps the socket path
 * at 103 bytes, and macOS TMPDIR (/var/folders/…) is long enough on its own to
 * blow that budget, so the socket cannot live in the data directory. Clients
 * here connect over TCP; this exists only because the server always wants a
 * socket directory. mkdtemp creates it 0700.
 */
function makeSocketDirectory(): string {
  const shortRoot = existsSync("/tmp") ? "/tmp" : tmpdir();
  return mkdtempSync(join(shortRoot, "clarity-pgsock-"));
}

// Wrapped in a function rather than using top-level await: the root package has
// no "type": "module", so tsx loads this file as CommonJS.
async function main(): Promise<number> {
  const command = process.argv.slice(2);
  const [executable, ...executableArgs] = command.length > 0 ? command : ["npx", "vitest", "run"];
  if (executable === undefined) throw new Error("No command to run");

  for (const binary of ["initdb", "pg_ctl", "createdb"]) requireBinary(binary);

  const superuser = userInfo().username;
  const dataDirectory = mkdtempSync(join(tmpdir(), "clarity-ephemeral-db-"));
  const socketDirectory = makeSocketDirectory();
  const logFile = join(dataDirectory, "server.log");
  const port = await freePort();
  const databaseUrl = `postgresql://${superuser}@${HOST}:${port}/${DATABASE_NAME}?schema=public`;

  let started = false;
  let exitCode = 0;

  try {
    // --auth=trust and fsync=off are safe here and only here: this cluster is
    // reachable only on a loopback port, holds synthetic data, and is deleted
    // when this process exits. Never reuse these flags for a durable database.
    run(
      "initdb",
      ["-D", dataDirectory, "-U", superuser, "--auth=trust", "--no-sync", "--encoding=UTF8"],
      POSTGRES_ENV,
    );

    run(
      "pg_ctl",
      [
        "-D",
        dataDirectory,
        "-l",
        logFile,
        "-o",
        `-p ${port} -h ${HOST} -k ${socketDirectory} -c fsync=off`,
        "-w",
        "start",
      ],
      POSTGRES_ENV,
    );
    started = true;

    run("createdb", ["-h", HOST, "-p", String(port), "-U", superuser, DATABASE_NAME], POSTGRES_ENV);
    console.log(`[ephemeral-db] ${DATABASE_NAME} ready on ${HOST}:${port} (datadir ${dataDirectory})`);

    run("npx", ["prisma", "migrate", "deploy", "--schema", "prisma/schema.prisma"], {
      ...process.env,
      DATABASE_URL: databaseUrl,
    });

    run(executable, executableArgs, { ...process.env, DATABASE_URL: databaseUrl });
  } catch (error) {
    // A non-zero exit from the wrapped command is the caller's result, not a
    // failure of this harness; surface it without a misleading stack trace.
    const status = (error as { status?: number }).status;
    exitCode = typeof status === "number" && status !== 0 ? status : 1;
    if (status === undefined) console.error(error);
    // The server log is inside the data directory that the finally block
    // deletes, so a startup failure would otherwise be undiagnosable.
    if (!started && existsSync(logFile)) {
      console.error(`[ephemeral-db] server did not start; log follows:\n${readFileSync(logFile, "utf8")}`);
    }
  } finally {
    if (started) {
      try {
        run("pg_ctl", ["-D", dataDirectory, "-m", "immediate", "-w", "stop"], POSTGRES_ENV);
      } catch {
        // Already down, or never came up cleanly; the datadir removal below is
        // what actually reclaims the resources.
      }
    }
    rmSync(dataDirectory, { recursive: true, force: true });
    rmSync(socketDirectory, { recursive: true, force: true });
    console.log(`[ephemeral-db] destroyed ${dataDirectory}`);
  }

  return exitCode;
}

main().then(
  (code) => process.exit(code),
  (error: unknown) => {
    console.error(error);
    process.exit(1);
  },
);
