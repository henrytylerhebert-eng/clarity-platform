import type { CustodyLedgerEvent } from "./types";

export function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map(canonicalJson).join(",")}]`;
  }
  return `{${Object.keys(value as Record<string, unknown>)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${canonicalJson((value as Record<string, unknown>)[key])}`)
    .join(",")}}`;
}

export async function sha256(input: string): Promise<string> {
  if (globalThis.crypto?.subtle) {
    const bytes = new TextEncoder().encode(input);
    const digest = await globalThis.crypto.subtle.digest("SHA-256", bytes);
    return Array.from(new Uint8Array(digest))
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("");
  }
  throw new Error("SHA-256 requires Web Crypto support.");
}

export async function buildEventHash(event: Omit<CustodyLedgerEvent, "eventHash">): Promise<string> {
  return sha256(canonicalJson({
    eventType: event.eventType,
    actor: event.actor,
    occurredAt: event.occurredAt,
    payload: event.payload,
    previousHash: event.previousHash,
  }));
}

export async function sealLedgerEvents(events: Array<Omit<CustodyLedgerEvent, "eventHash" | "previousHash">>): Promise<CustodyLedgerEvent[]> {
  const sealed: CustodyLedgerEvent[] = [];
  let previousHash: string | null = null;

  for (const event of events) {
    const withPrevious = { ...event, previousHash };
    const eventHash = await buildEventHash(withPrevious);
    sealed.push({ ...withPrevious, eventHash });
    previousHash = eventHash;
  }

  return sealed;
}

export async function verifyLedgerChain(events: CustodyLedgerEvent[]): Promise<{ valid: boolean; brokenEventId?: string }> {
  let previousHash: string | null = null;

  for (const event of events) {
    if (event.previousHash !== previousHash) {
      return { valid: false, brokenEventId: event.id };
    }
    const { eventHash: _eventHash, ...unsignedEvent } = event;
    const expectedHash = await buildEventHash(unsignedEvent);
    if (expectedHash !== event.eventHash) {
      return { valid: false, brokenEventId: event.id };
    }
    previousHash = event.eventHash;
  }

  return { valid: true };
}
