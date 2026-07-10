import { ShieldAlert } from "lucide-react";
import { StatusBadge } from "../components/StatusBadge";
import type { LegalInstrument } from "../domain/types";

export function LegalStatus({ legalInstrument, onChange }: { legalInstrument?: LegalInstrument; onChange: (instrument: LegalInstrument) => void }) {
  if (!legalInstrument) {
    return (
      <section className="panel">
        <h2>Legal Status</h2>
        <p>No legal draft exists for this case. Louisiana statutory language remains counsel-validation required.</p>
      </section>
    );
  }

  return (
    <section className="panel">
      <div className="panel-title">
        <h2>Legal Status</h2>
        <p>Draft scaffold only. No production legal form generation.</p>
      </div>
      <div className="legal-warning">
        <ShieldAlert size={18} />
        <span>Exact Louisiana statutory timing, trigger events, e-signature validity, and attestation language require counsel validation.</span>
      </div>
      <div className="status-strip">
        <div><span className="label">OPC draft</span><strong>{legalInstrument.legalStatus === "OPC" ? "Draft" : "Unknown"}</strong></div>
        <div><span className="label">PEC draft</span><strong>{legalInstrument.legalStatus === "PEC" ? "Draft" : "Unknown"}</strong></div>
        <div><span className="label">CEC draft</span><strong>{legalInstrument.legalStatus === "CEC" ? "Draft" : "Unknown"}</strong></div>
        <div><span className="label">Legal clock</span><strong>{legalInstrument.clockStatus}</strong></div>
      </div>
      <div className="form-grid">
        <label>
          Legal status
          <select value={legalInstrument.legalStatus} onChange={(event) => onChange({ ...legalInstrument, legalStatus: event.target.value as LegalInstrument["legalStatus"] })}>
            <option>Unknown</option>
            <option>Voluntary</option>
            <option>OPC</option>
            <option>PEC</option>
            <option>CEC</option>
            <option>Court committed</option>
          </select>
        </label>
        <label>
          Clock status
          <select value={legalInstrument.clockStatus} onChange={(event) => onChange({ ...legalInstrument, clockStatus: event.target.value as LegalInstrument["clockStatus"] })}>
            <option>Display only</option>
            <option>Active</option>
            <option>Due soon</option>
            <option>Unknown</option>
          </select>
        </label>
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={legalInstrument.requiredFactsComplete}
            onChange={(event) => onChange({ ...legalInstrument, requiredFactsComplete: event.target.checked })}
          />
          Required source-linked facts complete
        </label>
        <label className="span-2">
          Draft text
          <textarea value={legalInstrument.draftText} onChange={(event) => onChange({ ...legalInstrument, draftText: event.target.value })} />
        </label>
      </div>
      <div className="grid-two">
        <article className="subtle-panel">
          <h3>Linked observations</h3>
          <p>Linked observations are references for clinician and counsel review only. Unknown facts stay Unknown.</p>
        </article>
        <article className="subtle-panel">
          <h3>Source references</h3>
          <p>Source references remain attached in the packet preview. This screen does not generate production legal forms.</p>
        </article>
      </div>
      <StatusBadge tone="warn">{legalInstrument.reviewStatus}</StatusBadge>
    </section>
  );
}
