import { spawn, type ChildProcess } from "node:child_process";
import { createServer } from "node:net";
import { existsSync, lstatSync, mkdtempSync, readFileSync, readdirSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, isAbsolute, join, relative, resolve } from "node:path";

/**
 * Opt-in synthetic verification on macOS/Linux. Each invocation starts its
 * own loopback PostgreSQL instance, preserving the clarity_dev safety guard
 * without touching the developer's existing database. Dependencies must be
 * installed in this worktree first: npm ci.
 *
 * npm run test:ephemeral
 * npm run test:ephemeral -- node node_modules/vitest/vitest.mjs run tests/integration
 *
 * PostgreSQL server/client binaries must be on PATH. Arbitrary wrapped
 * commands receive only the disposable DATABASE_URL; their own behavior is
 * still the caller's responsibility. No shell or package download is used.
 */

const REPOSITORY = realpathSync(resolve(__dirname, ".."));
const HOST = "127.0.0.1";
const DATABASE = "clarity_dev";
const DATABASE_USER = "clarity";
const SIGNAL_STATUS = { SIGINT: 130, SIGTERM: 143 } as const;
type StopSignal = keyof typeof SIGNAL_STATUS;

class CommandFailed extends Error {
  constructor(readonly status: number, command: string) {
    super(`Command failed (${status}): ${command}`);
  }
}

/** Check missing output paths through their nearest existing parent too. */
function localPath(path: string): string {
  let ancestor = path;
  while (true) {
    try { lstatSync(ancestor); break; }
    catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
      ancestor = dirname(ancestor);
    }
  }
  const actual = resolve(realpathSync(ancestor), relative(ancestor, path));
  const suffix = relative(REPOSITORY, actual);
  if (suffix === ".." || suffix.startsWith("../") || isAbsolute(suffix)) {
    throw new Error(`Dependency/output resolves outside this worktree: ${path}. Run npm ci here.`);
  }
  return actual;
}

function toolchain(): { prisma: string; vitest: string; schema: string; clientSchema: string } {
  const modules = join(REPOSITORY, "node_modules");
  const prisma = localPath(join(modules, "prisma/build/index.js"));
  const vitest = localPath(join(modules, "vitest/vitest.mjs"));
  const client = localPath(join(modules, "@prisma/client/package.json"));
  for (const file of [prisma, vitest, client]) {
    if (!existsSync(file)) throw new Error(`Missing worktree dependency: ${file}. Run npm ci here.`);
  }
  const workspaceLinks = join(modules, "@clarity");
  if (existsSync(workspaceLinks)) {
    for (const entry of readdirSync(workspaceLinks)) localPath(join(workspaceLinks, entry));
  }
  const schema = localPath(join(REPOSITORY, "prisma/schema.prisma"));
  // This runner supports this repository's default client output only.
  if (/^\s*output\s*=/m.test(readFileSync(schema, "utf8"))) {
    throw new Error("Custom Prisma generator outputs require a separate isolation review.");
  }
  const clientSchema = localPath(join(modules, ".prisma/client/schema.prisma"));
  return { prisma, vitest, schema, clientSchema };
}

function freePort(): Promise<number> {
  return new Promise((resolvePort, reject) => {
    const server = createServer();
    server.once("error", reject);
    server.listen(0, HOST, () => {
      const address = server.address();
      if (address === null || typeof address === "string") {
        server.close();
        reject(new Error("Could not determine a loopback port"));
        return;
      }
      server.close((error) => error ? reject(error) : resolvePort(address.port));
    });
  });
}

function signalChild(child: ChildProcess, signal: NodeJS.Signals, group: boolean): void {
  if (child.pid === undefined) return;
  try {
    if (group) process.kill(-child.pid, signal);
    else child.kill(signal);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ESRCH") throw error;
  }
}

async function main(): Promise<number> {
  if (process.platform === "win32") throw new Error("This runner requires macOS or Linux process groups.");
  const tools = toolchain();
  const args = process.argv.slice(2);
  const [executable, ...commandArgs] = args.length ? args : [process.execPath, tools.vitest, "run"];
  if (!executable) throw new Error("No command to run");

  // Inherited libpq settings must not redirect any PostgreSQL command.
  const environment = Object.fromEntries(Object.entries(process.env).filter(([key]) => !key.startsWith("PG")));
  const postgresEnvironment = { ...environment, LC_ALL: "C" };
  let active: { child: ChildProcess; group: boolean; finishBeforeCleanup: boolean } | undefined;
  let requestedSignal: StopSignal | undefined;
  let killTimer: ReturnType<typeof setTimeout> | undefined;
  let cleaningUp = false;
  let dataDirectory: string | undefined;
  let socketDirectory: string | undefined;
  let exitCode = 0;

  const stop = (signal: StopSignal) => {
    requestedSignal ??= signal;
    if (cleaningUp || !active || active.finishBeforeCleanup) return;
    signalChild(active.child, signal, active.group);
    const target = active;
    killTimer ??= setTimeout(() => signalChild(target.child, "SIGKILL", target.group), 1000);
  };
  const onInt = () => stop("SIGINT");
  const onTerm = () => stop("SIGTERM");
  process.on("SIGINT", onInt);
  process.on("SIGTERM", onTerm);

  async function run(command: string, argv: string[], env: NodeJS.ProcessEnv, group = true, finishBeforeCleanup = false): Promise<void> {
    if (requestedSignal && !cleaningUp) throw new CommandFailed(SIGNAL_STATUS[requestedSignal], command);
    await new Promise<void>((resolveCommand, reject) => {
      const child = spawn(command, argv, { cwd: REPOSITORY, env, stdio: "inherit", detached: group });
      active = { child, group, finishBeforeCleanup };
      const finish = (failed = false) => {
        if (killTimer) clearTimeout(killTimer);
        killTimer = undefined;
        // A cancelled/failed child may exit before a descendant; remove its whole group.
        if ((requestedSignal || failed) && group) signalChild(child, "SIGKILL", true);
        active = undefined;
      };
      child.once("error", (error) => { finish(true); reject(error); });
      child.once("close", (code, signal) => {
        finish(code !== 0);
        if (code === 0) resolveCommand();
        else reject(new CommandFailed(code ?? (signal === "SIGINT" ? 130 : signal === "SIGTERM" ? 143 : 1), command));
      });
    });
  }

  try {
    for (const binary of ["initdb", "pg_ctl", "createdb"]) {
      await run(binary, ["--version"], postgresEnvironment, false);
    }
    dataDirectory = mkdtempSync(join(tmpdir(), "clarity-ephemeral-db-"));
    // Keep the socket path below macOS's 103-byte Unix socket limit.
    socketDirectory = mkdtempSync(join(existsSync("/tmp") ? "/tmp" : tmpdir(), "clarity-pgsock-"));
    const port = await freePort();
    const databaseUrl = `postgresql://${DATABASE_USER}@${HOST}:${port}/${DATABASE}?schema=public`;
    const commandEnvironment = { ...environment, DATABASE_URL: databaseUrl };
    const logFile = join(dataDirectory, "server.log");
    console.log(`[ephemeral-db] resources ${JSON.stringify({ dataDirectory, socketDirectory, port })}`);

    await run("initdb", ["-D", dataDirectory, "-U", DATABASE_USER, "--auth=trust", "--no-sync", "--encoding=UTF8"], postgresEnvironment, false);
    // Let a bounded startup finish before cancellation cleanup; killing pg_ctl
    // before postgres writes its PID file would make shutdown race startup.
    await run("pg_ctl", ["-D", dataDirectory, "-l", logFile, "-o", `-p ${port} -h ${HOST} -k ${socketDirectory} -c fsync=off`, "-w", "-t", "10", "start"], postgresEnvironment, false, true);
    await run("createdb", ["-h", HOST, "-p", String(port), "-U", DATABASE_USER, DATABASE], postgresEnvironment, false);
    // Prisma formats its generated schema. Normalize a disposable copy, never
    // the tracked source, so whitespace/index ordering is not a false mismatch.
    const sourceSchema = readFileSync(tools.schema);
    const normalizedSchema = join(socketDirectory, "source.prisma");
    writeFileSync(normalizedSchema, sourceSchema);
    await run(process.execPath, [tools.prisma, "format", "--schema", normalizedSchema], commandEnvironment);
    await run(process.execPath, [tools.prisma, "generate", "--schema", tools.schema], commandEnvironment);
    localPath(tools.clientSchema);
    if (!sourceSchema.equals(readFileSync(tools.schema)) ||
        !readFileSync(normalizedSchema).equals(readFileSync(tools.clientSchema))) {
      throw new Error("Generated Prisma schema does not match this worktree.");
    }
    await run(process.execPath, [tools.prisma, "migrate", "deploy", "--schema", tools.schema], commandEnvironment);
    console.log(`[ephemeral-db] ready ${HOST}:${port}/${DATABASE}`);
    await run(executable, commandArgs, commandEnvironment);
  } catch (error) {
    exitCode = error instanceof CommandFailed ? error.status : 1;
    console.error(error instanceof Error ? error.message : "Ephemeral verification failed");
  } finally {
    cleaningUp = true;
    if (killTimer) clearTimeout(killTimer);
    let stopped = true;
    if (dataDirectory && existsSync(join(dataDirectory, "postmaster.pid"))) {
      try {
        // Explicitly targets only this invocation's data directory, even if startup failed.
        await run("pg_ctl", ["-D", dataDirectory, "-m", "immediate", "-w", "-t", "10", "stop"], postgresEnvironment, false);
      } catch {
        stopped = false;
        exitCode ||= 1;
        console.error(`[ephemeral-db] stop failed; resources retained for recovery: ${dataDirectory}`);
      }
    }
    if (stopped) {
      if (dataDirectory) rmSync(dataDirectory, { recursive: true, force: true });
      if (socketDirectory) rmSync(socketDirectory, { recursive: true, force: true });
      console.log("[ephemeral-db] cleanup complete");
    }
    process.off("SIGINT", onInt);
    process.off("SIGTERM", onTerm);
  }
  return requestedSignal ? SIGNAL_STATUS[requestedSignal] : exitCode;
}

main().then(
  (code) => { process.exitCode = code; },
  (error: unknown) => {
    console.error(error instanceof Error ? error.message : "Ephemeral verification failed");
    process.exitCode = 1;
  },
);
