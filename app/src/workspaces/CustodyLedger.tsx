import { useState } from "react";
import { StatusBadge } from "../components/StatusBadge";
import { verifyLedgerChain } from "../domain/custodyLedger";
import type { CustodyLedgerEvent } from "../domain/types";

export function CustodyLedger({ events }: { events: CustodyLedgerEvent[] }) {
  const [verification, setVerification] = useState<string>("Not verified");
  const [tampered, setTampered] = useState(false);
  const displayedEvents = tampered ? events.map((event, index) => index === 0 ? { ...event, payload: { ...event.payload, demoTamper: true } } : event) : events;

  async function verify() {
    const result = await verifyLedgerChain(displayedEvents);
    setVerification(result.valid ? "Verified" : `Broken at ${result.brokenEventId}`);
  }

  return (
    <section className="panel">
      <div className="panel-title">
        <h2>Custody Ledger</h2>
        <p>Append-only hash chain simulation for material custody events.</p>
      </div>
      <button className="primary-button" type="button" onClick={verify}>Verify custody chain</button>
      <button className="secondary-button" type="button" onClick={() => { setTampered((current) => !current); setVerification("Not verified"); }}>
        {tampered ? "Clear demo tamper" : "Simulate demo tamper"}
      </button>
      <StatusBadge tone={verification === "Verified" ? "good" : "warn"}>{verification}</StatusBadge>
      <div className="ledger-list">
        {displayedEvents.map((event) => (
          <article className="ledger-event" key={event.id}>
            <strong>{event.eventType}</strong>
            <span>{event.actor} · {new Date(event.occurredAt).toLocaleString()}</span>
            <span className="mono">hash {event.eventHash.slice(0, 24)}...</span>
            <span className="mono">previous {event.previousHash ? `${event.previousHash.slice(0, 24)}...` : "genesis"}</span>
          </article>
        ))}
      </div>
    </section>
  );
}
