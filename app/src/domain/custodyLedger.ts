import type { CustodyLedgerEvent } from "./types";
export { buildEventHash, canonicalJson, sealLedgerEvents, sha256, verifyLedgerChain } from "./hashLedger";
import { buildEventHash } from "./hashLedger";

export async function appendCustodyLedgerEvent(
  events: CustodyLedgerEvent[],
  event: Omit<CustodyLedgerEvent, "eventHash" | "previousHash">,
): Promise<CustodyLedgerEvent[]> {
  const caseEvents = events
    .filter((item) => item.caseId === event.caseId)
    .sort((a, b) => a.occurredAt.localeCompare(b.occurredAt));
  const previousHash = caseEvents[caseEvents.length - 1]?.eventHash ?? null;
  const unsignedEvent = { ...event, previousHash };
  const eventHash = await buildEventHash(unsignedEvent);
  return [...events, { ...unsignedEvent, eventHash }];
}
