import { spawn, type ChildProcess } from "node:child_process";
import { createConnection } from "node:net";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { afterEach, describe, expect, it } from "vitest";

const source = readFileSync(resolve("scripts/with-ephemeral-database.ts"), "utf8");
const tsx = resolve("node_modules/tsx/dist/cli.mjs");
const fixtures: string[] = [];
const runs: Run[] = [];

interface Resources { dataDirectory: string; socketDirectory: string; port: number }
interface Run { child: ChildProcess; output(): string; result: Promise<number | null> }

async function waitFor(check: () => boolean, label: string): Promise<void> {
  for (let attempt = 0; attempt < 500; attempt++) {
    if (check()) return;
    await delay(20);
  }
  throw new Error(`Timed out waiting for ${label}`);
}

function alive(pid: number): boolean {
  try { process.kill(pid, 0); return true; }
  catch (error) { if ((error as NodeJS.ErrnoException).code === "ESRCH") return false; throw error; }
}

function resourceList(run: Run): Resources[] {
  return [...run.output().matchAll(/\[ephemeral-db\] resources (\{[^\n]+\})/g)]
    .map((match) => JSON.parse(match[1]!) as Resources);
}

function fixture(): string {
  const root = mkdtempSync(join(tmpdir(), "clarity-runner-test-"));
  fixtures.push(root);
  for (const directory of ["scripts", "prisma", "bin", "node_modules/prisma/build", "node_modules/vitest", "node_modules/@prisma/client"]) {
    mkdirSync(join(root, directory), { recursive: true });
  }
  writeFileSync(join(root, "package.json"), '{"private":true}');
  writeFileSync(join(root, "scripts/with-ephemeral-database.ts"), source);
  writeFileSync(join(root, "prisma/schema.prisma"), 'generator client {\n  provider = "prisma-client-js"\n}\n');
  writeFileSync(join(root, "node_modules/@prisma/client/package.json"), '{"name":"@prisma/client"}');
  writeFileSync(join(root, "node_modules/vitest/vitest.mjs"), 'console.log("default command completed");');
  writeFileSync(join(root, "node_modules/prisma/build/index.js"), `
const fs = require('node:fs');
const path = require('node:path');
const args = process.argv.slice(2);
fs.appendFileSync(process.env.TEST_LOG, JSON.stringify({tool:'prisma', args, url:process.env.DATABASE_URL})+'\\n');
if (args[0] === 'generate') {
  fs.mkdirSync('node_modules/.prisma/client', {recursive:true});
  fs.copyFileSync('prisma/schema.prisma', 'node_modules/.prisma/client/schema.prisma');
  if (process.env.TEST_STALE_CLIENT) fs.appendFileSync('node_modules/.prisma/client/schema.prisma', '\\n// Different branch schema');
}
`);
  writeFileSync(join(root, "fake-server.cjs"), `
const fs = require('node:fs');
const net = require('node:net');
const [directory, port] = process.argv.slice(2);
const server = net.createServer(socket => socket.end());
setTimeout(() => server.listen(Number(port), '127.0.0.1', () => {
  fs.writeFileSync(directory+'/postmaster.pid', String(process.pid));
  fs.writeFileSync(directory+'/ready', 'ready');
}), Number(process.env.TEST_START_DELAY || 0));
process.on('SIGTERM', () => {
  server.close(() => {
    fs.rmSync(directory+'/postmaster.pid', {force:true});
    process.exit(0);
  });
});
`);
  const fakePostgres = `#!${process.execPath}
const fs = require('node:fs');
const path = require('node:path');
const {spawn} = require('node:child_process');
const {setTimeout: delay} = require('node:timers/promises');
const args = process.argv.slice(2);
const tool = path.basename(process.argv[1]);
if (args.includes('--version')) process.exit(0);
const directory = args[args.indexOf('-D')+1];
const log = event => fs.appendFileSync(process.env.TEST_LOG, JSON.stringify({tool,args,...event})+'\\n');
log({pgKeys:Object.keys(process.env).filter(key=>key.startsWith('PG'))});
(async () => {
  if (tool === 'initdb' && process.env.TEST_FAIL === 'initdb') process.exit(11);
  if (tool !== 'pg_ctl') return;
  if (args.includes('start')) {
    const port = /-p (\\d+)/.exec(args[args.indexOf('-o')+1])[1];
    const server = spawn(process.execPath, [path.join(process.cwd(),'fake-server.cjs'),directory,port], {detached:true,stdio:'ignore'});
    log({serverPid:server.pid});
    server.unref();
    while (!fs.existsSync(directory+'/ready')) await delay(5);
    if (process.env.TEST_FAIL === 'start') process.exit(12);
  }
  if (args.includes('stop')) {
    if (process.env.TEST_FAIL === 'stop') process.exit(13);
    const pid = Number(fs.readFileSync(directory+'/postmaster.pid','utf8'));
    process.kill(pid,'SIGTERM');
    while (fs.existsSync(directory+'/postmaster.pid')) await delay(5);
  }
})().catch(error => {console.error(error); process.exitCode=1;});
`;
  for (const tool of ["initdb", "pg_ctl", "createdb"]) {
    writeFileSync(join(root, "bin", tool), fakePostgres, { mode: 0o755 });
  }
  writeFileSync(join(root, "wrapped.cjs"), `
const fs = require('node:fs');
const {spawn} = require('node:child_process');
fs.appendFileSync(process.env.TEST_LOG, JSON.stringify({tool:'wrapped', url:process.env.DATABASE_URL})+'\\n');
if (process.env.TEST_HOLD || process.env.TEST_CHILD_ON_FAILURE) {
  const descendant = spawn(process.execPath,['-e','setInterval(()=>{},1000)'],{stdio:'ignore'});
  fs.writeFileSync(process.env.TEST_READY,JSON.stringify({pid:process.pid,descendant:descendant.pid}));
  if (process.env.TEST_CHILD_ON_FAILURE) process.exit(7);
  setInterval(()=>{},1000);
} else process.exit(Number(process.env.TEST_EXIT || 0));
`);
  return root;
}

function start(root: string, extra: NodeJS.ProcessEnv = {}, command = true): Run {
  const child = spawn(process.execPath, [tsx, join(root, "scripts/with-ephemeral-database.ts"),
    ...(command ? [process.execPath, join(root, "wrapped.cjs")] : [])], {
    cwd: root,
    env: {
      ...process.env,
      PATH: `${join(root, "bin")}:${process.env.PATH}`,
      TEST_LOG: join(root, "events.jsonl"),
      TEST_READY: join(root, "wrapped-ready.json"),
      DATABASE_URL: "postgresql://unused@do-not-connect.invalid/developer_database",
      PGHOSTADDR: "do-not-connect.invalid",
      ...extra,
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  let output = "";
  child.stdout?.on("data", (chunk: Buffer) => { output += chunk.toString(); });
  child.stderr?.on("data", (chunk: Buffer) => { output += chunk.toString(); });
  const run = { child, output: () => output, result: new Promise<number | null>((done, reject) => {
    child.once("error", reject);
    child.once("close", done);
  }) };
  runs.push(run);
  return run;
}

function events(root: string): Array<{ tool: string; args?: string[]; url?: string; pgKeys?: string[]; serverPid?: number }> {
  const file = join(root, "events.jsonl");
  return existsSync(file) ? readFileSync(file, "utf8").trim().split("\n").filter(Boolean).map(line => JSON.parse(line)) : [];
}

async function assertClean(run: Run): Promise<void> {
  expect(run.output()).toContain("[ephemeral-db] cleanup complete");
  for (const resources of resourceList(run)) {
    expect(existsSync(resources.dataDirectory)).toBe(false);
    expect(existsSync(resources.socketDirectory)).toBe(false);
    const reachable = await new Promise<boolean>((done) => {
      const socket = createConnection({ host: "127.0.0.1", port: resources.port });
      socket.once("connect", () => { socket.destroy(); done(true); });
      socket.once("error", () => done(false));
    });
    expect(reachable).toBe(false);
  }
}

afterEach(async () => {
  // Fallback cleanup runs after assertions, so a leak still fails its test.
  for (const run of runs.splice(0)) {
    if (run.child.exitCode === null) run.child.kill("SIGTERM");
    await run.result;
    for (const resources of resourceList(run)) {
      const pidFile = join(resources.dataDirectory, "postmaster.pid");
      if (existsSync(pidFile)) {
        try { process.kill(Number(readFileSync(pidFile, "utf8")), "SIGTERM"); } catch { /* already stopped */ }
      }
      rmSync(resources.dataDirectory, { force: true, recursive: true });
      rmSync(resources.socketDirectory, { force: true, recursive: true });
    }
  }
  for (const root of fixtures.splice(0)) {
    const ready = join(root, "wrapped-ready.json");
    if (existsSync(ready)) {
      const ids = JSON.parse(readFileSync(ready, "utf8")) as { pid: number; descendant: number };
      for (const pid of [ids.pid, ids.descendant]) {
        if (alive(pid)) try { process.kill(pid, "SIGKILL"); } catch { /* already stopped */ }
      }
    }
    for (const event of events(root)) {
      if (event.serverPid && alive(event.serverPid)) {
        try { process.kill(event.serverPid, "SIGKILL"); } catch { /* already stopped */ }
      }
    }
    rmSync(root, { force: true, recursive: true });
  }
});

describe.skipIf(process.platform === "win32")("ephemeral database runner lifecycle", () => {
  it("generates this worktree's client, overrides inherited DB settings, runs, and cleans up", async () => {
    const root = fixture();
    const run = start(root);
    expect(await run.result, run.output()).toBe(0);
    const steps = events(root);
    expect(steps.filter(event => event.tool === "prisma").map(event => event.args?.slice(0, 2)))
      .toEqual([["format", "--schema"], ["generate", "--schema"], ["migrate", "deploy"]]);
    const wrapped = steps.find(event => event.tool === "wrapped")!;
    const url = new URL(wrapped.url!);
    expect(url.hostname).toBe("127.0.0.1");
    expect(url.pathname).toBe("/clarity_dev");
    expect(url.port).toBe(String(resourceList(run)[0]!.port));
    expect(steps.filter(event => event.pgKeys).every(event => event.pgKeys?.length === 0)).toBe(true);
    expect(steps.find(event => event.tool === "createdb")?.args).toContain("127.0.0.1");
    await assertClean(run);
  }, 15000);

  it("uses the local Vitest entrypoint when no command is supplied", async () => {
    const run = start(fixture(), {}, false);
    expect(await run.result, run.output()).toBe(0);
    expect(run.output()).toContain("default command completed");
    await assertClean(run);
  }, 15000);

  it("rejects a generated schema from a different branch before migrations or tests", async () => {
    const root = fixture();
    const run = start(root, { TEST_STALE_CLIENT: "1" });
    expect(await run.result, run.output()).toBe(1);
    expect(run.output()).toContain("Generated Prisma schema does not match this worktree");
    expect(events(root).some(event => event.tool === "wrapped" || event.args?.includes("migrate"))).toBe(false);
    await assertClean(run);
  }, 15000);

  it.each([{ TEST_EXIT: "7" }, { TEST_FAIL: "initdb" }, { TEST_FAIL: "start" }])("propagates failure and reclaims resources: %j", async (environment) => {
    const run = start(fixture(), environment);
    expect(await run.result, run.output()).toBe(environment.TEST_EXIT ? 7 : environment.TEST_FAIL === "initdb" ? 11 : 12);
    await assertClean(run);
  }, 15000);

  it.each(["SIGINT", "SIGTERM"] as const)("%s stops the wrapped process, descendants, and PostgreSQL", async (signal) => {
    const root = fixture();
    const run = start(root, { TEST_HOLD: "1" });
    const ready = join(root, "wrapped-ready.json");
    await waitFor(() => existsSync(ready), "wrapped process");
    const ids = JSON.parse(readFileSync(ready, "utf8")) as { pid: number; descendant: number };
    run.child.kill(signal);
    expect(await run.result, run.output()).toBe(signal === "SIGINT" ? 130 : 143);
    await waitFor(() => !alive(ids.pid) && !alive(ids.descendant), "process group teardown");
    await assertClean(run);
  }, 15000);

  it("a failed wrapped command does not leave its descendant running", async () => {
    const root = fixture();
    const run = start(root, { TEST_CHILD_ON_FAILURE: "1" });
    expect(await run.result, run.output()).toBe(7);
    const ids = JSON.parse(readFileSync(join(root, "wrapped-ready.json"), "utf8")) as { descendant: number };
    await waitFor(() => !alive(ids.descendant), "failed command descendant teardown");
    await assertClean(run);
  }, 15000);

  it("parallel invocations use independent ports, directories, and database URLs", async () => {
    const root = fixture();
    const first = start(root);
    const second = start(root);
    expect(await Promise.all([first.result, second.result])).toEqual([0, 0]);
    const [a, b] = [resourceList(first)[0]!, resourceList(second)[0]!];
    expect(a.port).not.toBe(b.port);
    expect(a.dataDirectory).not.toBe(b.dataDirectory);
    expect(a.socketDirectory).not.toBe(b.socketDirectory);
    await assertClean(first);
    await assertClean(second);
  }, 15000);

  it("cancellation during PostgreSQL startup waits for a stoppable server before cleanup", async () => {
    const root = fixture();
    const run = start(root, { TEST_START_DELAY: "500" });
    await waitFor(() => events(root).some(event => event.serverPid), "starting PostgreSQL");
    run.child.kill("SIGTERM");
    expect(await run.result, run.output()).toBe(143);
    expect(events(root).some(event => event.tool === "pg_ctl" && event.args?.includes("stop"))).toBe(true);
    expect(events(root).some(event => event.tool === "wrapped")).toBe(false);
    await assertClean(run);
  }, 15000);

  it.each([".prisma/client", "@clarity/prescreen-service"])("rejects external %s before launching PostgreSQL", async (dependency) => {
    const root = fixture();
    const outside = fixture();
    const link = join(root, "node_modules", dependency);
    mkdirSync(resolve(link, ".."), { recursive: true });
    symlinkSync(outside, link, "dir");
    const run = start(root);
    expect(await run.result, run.output()).toBe(1);
    expect(run.output()).toContain("outside this worktree");
    expect(events(root)).toEqual([]);
    expect(resourceList(run)).toEqual([]);
  }, 15000);

  it("rejects a dangling generated-client symlink before creating resources", async () => {
    const root = fixture();
    mkdirSync(join(root, "node_modules/.prisma"));
    symlinkSync(join(fixture(), "missing-output"), join(root, "node_modules/.prisma/client"), "dir");
    const run = start(root);
    expect(await run.result, run.output()).toBe(1);
    expect(events(root)).toEqual([]);
    expect(resourceList(run)).toEqual([]);
  }, 15000);

  it("reports failed teardown and retains the data instead of claiming cleanup", async () => {
    const run = start(fixture(), { TEST_FAIL: "stop" });
    expect(await run.result, run.output()).toBe(1);
    expect(run.output()).toContain("resources retained for recovery");
    expect(run.output()).not.toContain("cleanup complete");
    expect(existsSync(resourceList(run)[0]!.dataDirectory)).toBe(true);
  }, 15000);
});
