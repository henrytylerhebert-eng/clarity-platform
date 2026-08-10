/**
 * Outbound fetch policy for regulatory-source acquisition.
 *
 * This tool retrieves PUBLIC federal regulatory text. It touches no patient
 * data, no tenant data, and no Clarity database. It is a development-time
 * reference-acquisition tool, not a platform runtime capability.
 *
 * Policy, in force for every request:
 *   1. Prefer a documented API over fetching a rendered page. Where an API
 *      exists (eCFR, Federal Register) it is the ONLY path used.
 *   2. Honour robots.txt. cms.gov publishes `Disallow: /*?`, so any cms.gov
 *      URL carrying a query string is refused here rather than at the server.
 *   3. Identify the client honestly, and rate-limit per host.
 *   4. Retry only idempotent GETs, only on 429/5xx, with capped backoff.
 */

export interface FetchPolicyOptions {
  /** Minimum milliseconds between requests to the same host. */
  minIntervalMs?: number;
  maxRetries?: number;
  timeoutMs?: number;
  /** Injected for tests; defaults to global fetch. */
  fetchImpl?: typeof fetch;
  /** Injected for tests so retry backoff does not actually sleep. */
  sleepImpl?: (ms: number) => Promise<void>;
  now?: () => number;
}

export const USER_AGENT =
  "clarity-platform-regulatory-corpus/0.1 (development reference tool; contact: repository owner)";

/**
 * Hosts whose robots.txt forbids query strings for the default user-agent.
 * Verified 2026-07-29: https://www.cms.gov/robots.txt contains `Disallow: /*?`.
 */
const QUERY_STRING_FORBIDDEN_HOSTS = new Set(["www.cms.gov", "cms.gov"]);

/**
 * Paths disallowed per-host by robots.txt that this tool must never request.
 * Verified 2026-07-29 against each host's robots.txt.
 */
const DISALLOWED_PREFIXES: Readonly<Record<string, readonly string[]>> = {
  "www.ecfr.gov": ["/search", "/recent-changes", "/on/", "/compare/", "/my/", "/auth/"],
  "www.cms.gov": ["/core/", "/profiles/", "/node/", "/media/", "/admin/", "/user/", "/es/"],
};

export class RobotsPolicyError extends Error {
  constructor(url: string, reason: string) {
    super(`Refusing to fetch ${url}: ${reason}`);
    this.name = "RobotsPolicyError";
  }
}

export class HttpError extends Error {
  constructor(
    readonly status: number,
    url: string,
  ) {
    super(`HTTP ${status} for ${url}`);
    this.name = "HttpError";
  }
}

/**
 * Throws if the URL is one this tool has committed not to request. Exported so
 * the rule is directly testable rather than only observable via a live fetch.
 */
export function assertRequestAllowed(url: string): void {
  const parsed = new URL(url);

  if (parsed.protocol !== "https:") {
    throw new RobotsPolicyError(url, "only https is permitted");
  }

  if (QUERY_STRING_FORBIDDEN_HOSTS.has(parsed.host) && parsed.search !== "") {
    throw new RobotsPolicyError(
      url,
      `${parsed.host} robots.txt disallows query strings (Disallow: /*?) — use a static path`,
    );
  }

  const prefixes = DISALLOWED_PREFIXES[parsed.host] ?? [];
  const hit = prefixes.find((prefix) => parsed.pathname.startsWith(prefix));
  if (hit !== undefined) {
    throw new RobotsPolicyError(url, `${parsed.host} robots.txt disallows ${hit}`);
  }
}

const RETRYABLE = new Set([429, 500, 502, 503, 504]);

export class PolicyFetcher {
  private readonly minIntervalMs: number;
  private readonly maxRetries: number;
  private readonly timeoutMs: number;
  private readonly fetchImpl: typeof fetch;
  private readonly sleepImpl: (ms: number) => Promise<void>;
  private readonly now: () => number;
  private readonly lastRequestAt = new Map<string, number>();

  constructor(options: FetchPolicyOptions = {}) {
    this.minIntervalMs = options.minIntervalMs ?? 1_100;
    this.maxRetries = options.maxRetries ?? 3;
    this.timeoutMs = options.timeoutMs ?? 30_000;
    this.fetchImpl = options.fetchImpl ?? globalThis.fetch;
    this.sleepImpl = options.sleepImpl ?? ((ms) => new Promise((r) => setTimeout(r, ms)));
    this.now = options.now ?? (() => Date.now());
  }

  /** Requests count against a host budget so a large sync stays polite. */
  private async throttle(host: string): Promise<void> {
    const previous = this.lastRequestAt.get(host);
    if (previous !== undefined) {
      const waitMs = previous + this.minIntervalMs - this.now();
      if (waitMs > 0) await this.sleepImpl(waitMs);
    }
    this.lastRequestAt.set(host, this.now());
  }

  async getText(url: string): Promise<string> {
    assertRequestAllowed(url);
    const host = new URL(url).host;

    let lastError: unknown;
    for (let attempt = 0; attempt <= this.maxRetries; attempt += 1) {
      await this.throttle(host);
      try {
        const response = await this.fetchImpl(url, {
          headers: { "user-agent": USER_AGENT, accept: "application/xml, application/json, */*" },
          signal: AbortSignal.timeout(this.timeoutMs),
          redirect: "follow",
        });

        if (response.ok) return await response.text();

        if (!RETRYABLE.has(response.status) || attempt === this.maxRetries) {
          throw new HttpError(response.status, url);
        }
        lastError = new HttpError(response.status, url);
      } catch (error) {
        if (error instanceof RobotsPolicyError) throw error;
        // A non-retryable status must escape immediately. Without this the
        // throw above lands in this catch and the request is retried anyway —
        // a 404 would be fetched maxRetries+1 times.
        if (error instanceof HttpError && !RETRYABLE.has(error.status)) throw error;
        if (attempt === this.maxRetries) throw error;
        lastError = error;
      }
      // 2s, 4s, 8s — capped, and skipped entirely under an injected sleep.
      await this.sleepImpl(Math.min(2_000 * 2 ** attempt, 30_000));
    }

    throw lastError instanceof Error ? lastError : new Error(`Failed to fetch ${url}`);
  }

  async getJson<T>(url: string): Promise<T> {
    return JSON.parse(await this.getText(url)) as T;
  }
}
