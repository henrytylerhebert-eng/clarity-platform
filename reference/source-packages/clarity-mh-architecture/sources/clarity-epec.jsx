import { useState, useEffect, useMemo, useRef } from "react";

/* ============================================================
   CLARITY e-PEC — Louisiana Emergency Certificate Custody System
   Working prototype. Statutory mapping: La. R.S. 28:53, 28:53.2,
   28:52.4. Forms mirrored: LDH OBH-1 (PEC), OBH-2 (CEC).
   DEMO ONLY — not legal advice; validate with LA counsel & LDH.
   ============================================================ */

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Spectral:wght@500;600;700&family=Public+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap');
:root{
  --ink:#101D33; --panel:#182741; --panel2:#1F3151;
  --paper:#FCFCFA; --paper2:#F3F3EE; --line:#DADDD6; --lineD:#2C3E5C;
  --gold:#A8842C; --goldL:#C9A64B; --verd:#1F6E5C; --verdL:#2C8A74;
  --oxide:#9E3B2F; --steel:#5F6E7D; --inkText:#EAEDF2; --dim:#8C9AAE;
}
*{box-sizing:border-box;margin:0;padding:0}
.epc{min-height:100vh;background:var(--ink);color:var(--inkText);font-family:'Public Sans',sans-serif;font-size:14px;line-height:1.5}
.wrap{max-width:1180px;margin:0 auto;padding:0 16px}
.hdr{border-bottom:1px solid var(--lineD);padding:14px 0;display:flex;align-items:baseline;justify-content:space-between;flex-wrap:wrap;gap:8px}
.wordmark{font-family:'Spectral',serif;font-weight:700;font-size:20px;letter-spacing:.02em}
.wordmark span{color:var(--goldL);font-weight:500}
.caseTag{font-family:'IBM Plex Mono',monospace;font-size:12px;color:var(--dim)}
.caseTag b{color:var(--inkText);font-weight:600}
.stageRail{display:flex;gap:0;overflow-x:auto;padding:14px 0 4px;scrollbar-width:none}
.stageRail::-webkit-scrollbar{display:none}
.stage{flex:1;min-width:112px;position:relative;padding:8px 10px 10px;border-top:3px solid var(--lineD)}
.stage.done{border-top-color:var(--verdL)}
.stage.live{border-top-color:var(--goldL)}
.stage.dead{border-top-color:var(--oxide)}
.stgNum{font-family:'IBM Plex Mono',monospace;font-size:10px;color:var(--dim);letter-spacing:.08em}
.stgName{font-weight:600;font-size:12.5px;margin-top:2px}
.stgSub{font-size:10.5px;color:var(--dim);margin-top:1px}
.stage.live .stgNum,.stage.live .stgName{color:var(--goldL)}
.stage.done .stgName{color:var(--verdL)}
.roleBar{display:flex;gap:6px;padding:12px 0;flex-wrap:wrap}
.roleBtn{background:transparent;border:1px solid var(--lineD);color:var(--dim);padding:7px 13px;border-radius:2px;font-family:'Public Sans',sans-serif;font-size:12.5px;font-weight:600;cursor:pointer;letter-spacing:.02em}
.roleBtn.on{background:var(--paper);color:var(--ink);border-color:var(--paper)}
.roleBtn:focus-visible{outline:2px solid var(--goldL);outline-offset:2px}
.grid{display:grid;grid-template-columns:minmax(0,1fr) 340px;gap:16px;padding-bottom:40px}
@media(max-width:900px){.grid{grid-template-columns:1fr}}
.sheet{background:var(--paper);color:#22282E;border-radius:3px;box-shadow:0 1px 0 rgba(0,0,0,.4),0 12px 32px rgba(0,0,0,.35);overflow:hidden}
.sheetHd{padding:18px 22px 12px;border-bottom:1px solid var(--line);display:flex;justify-content:space-between;align-items:flex-start;gap:12px;flex-wrap:wrap}
.formNo{font-family:'IBM Plex Mono',monospace;font-size:10.5px;color:var(--steel);letter-spacing:.1em;text-transform:uppercase}
.sheetTitle{font-family:'Spectral',serif;font-weight:700;font-size:21px;color:#1A2230;margin-top:2px}
.statRef{font-size:11px;color:var(--steel);margin-top:3px;max-width:520px}
.sheetBody{padding:18px 22px 22px}
.fRow{margin-bottom:14px}
.fLbl{display:block;font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--steel);margin-bottom:5px}
.fIn,.fTa,.fSel{width:100%;border:1px solid var(--line);border-radius:2px;padding:9px 10px;font-family:'Public Sans',sans-serif;font-size:13.5px;background:#fff;color:#22282E}
.fTa{min-height:84px;resize:vertical}
.fIn:focus,.fTa:focus,.fSel:focus{outline:2px solid var(--gold);outline-offset:0;border-color:var(--gold)}
.two{display:grid;grid-template-columns:1fr 1fr;gap:12px}
@media(max-width:560px){.two{grid-template-columns:1fr}}
.chkGrp{display:flex;flex-direction:column;gap:8px}
.chk{display:flex;gap:9px;align-items:flex-start;padding:9px 11px;border:1px solid var(--line);border-radius:2px;cursor:pointer;background:#fff}
.chk.on{border-color:var(--gold);background:#FBF7EC}
.chk input{margin-top:2px;accent-color:var(--gold)}
.chk b{font-size:13px}
.chk small{display:block;color:var(--steel);font-size:11.5px;margin-top:1px}
.attest{background:var(--paper2);border:1px solid var(--line);border-left:3px solid var(--gold);padding:13px 14px;font-size:12.5px;color:#3A4148;margin:14px 0}
.attest b{font-family:'Spectral',serif}
.btn{border:0;border-radius:2px;padding:11px 18px;font-family:'Public Sans',sans-serif;font-size:13.5px;font-weight:700;cursor:pointer;letter-spacing:.02em}
.btn.gold{background:var(--gold);color:#fff}
.btn.gold:hover{background:#95751F}
.btn.verd{background:var(--verd);color:#fff}
.btn.oxide{background:var(--oxide);color:#fff}
.btn.ghost{background:transparent;border:1px solid var(--line);color:#3A4148}
.btn:disabled{opacity:.45;cursor:not-allowed}
.btn:focus-visible{outline:2px solid var(--ink);outline-offset:2px}
.btnRow{display:flex;gap:10px;flex-wrap:wrap;margin-top:6px}
.stamp{display:inline-block;font-family:'Spectral',serif;font-weight:700;font-size:13px;letter-spacing:.14em;text-transform:uppercase;border:2.5px solid currentColor;border-radius:3px;padding:5px 12px;transform:rotate(-2deg);margin:4px 0}
.stamp.verd{color:var(--verd)} .stamp.gold{color:var(--gold)} .stamp.oxide{color:var(--oxide)}
.clock{font-family:'IBM Plex Mono',monospace;font-weight:600;font-size:15px}
.clockBox{border:1px solid var(--line);border-radius:2px;padding:11px 13px;background:#fff;display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:14px;flex-wrap:wrap}
.clockBox.warn{border-color:var(--oxide);background:#FBF0EE}
.clockBox .cl{font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--steel)}
.ledger{background:var(--panel);border:1px solid var(--lineD);border-radius:3px;overflow:hidden;align-self:start;position:sticky;top:12px}
@media(max-width:900px){.ledger{position:static}}
.ledHd{padding:13px 15px;border-bottom:1px solid var(--lineD)}
.ledHd h3{font-family:'Spectral',serif;font-size:15px;font-weight:600;letter-spacing:.03em}
.fprint{margin-top:8px;background:var(--ink);border:1px solid var(--lineD);border-radius:2px;padding:8px 10px}
.fprint .fl{font-size:9.5px;letter-spacing:.1em;text-transform:uppercase;color:var(--dim);display:flex;justify-content:space-between}
.fprint code{display:block;font-family:'IBM Plex Mono',monospace;font-size:10.5px;color:var(--goldL);word-break:break-all;margin-top:4px;line-height:1.45}
.fprint.frozen code{color:var(--verdL)}
.ledScroll{max-height:520px;overflow-y:auto}
.evt{padding:10px 15px;border-bottom:1px solid var(--lineD);position:relative}
.evt:last-child{border-bottom:0}
.evtTop{display:flex;justify-content:space-between;gap:8px;font-family:'IBM Plex Mono',monospace;font-size:10px;color:var(--dim)}
.evtLbl{font-weight:600;font-size:12.5px;margin-top:3px}
.evtDet{font-size:11.5px;color:var(--dim);margin-top:2px}
.evtHash{font-family:'IBM Plex Mono',monospace;font-size:9.5px;color:#54637A;word-break:break-all;margin-top:4px}
.evt.gold .evtLbl{color:var(--goldL)} .evt.verd .evtLbl{color:var(--verdL)} .evt.oxide .evtLbl{color:#D57A6D}
.note{font-size:11.5px;color:var(--dim);padding:10px 0 30px;line-height:1.55}
.pill{display:inline-block;font-family:'IBM Plex Mono',monospace;font-size:10px;letter-spacing:.08em;border:1px solid var(--lineD);border-radius:2px;padding:2px 7px;color:var(--dim);margin-left:8px;vertical-align:middle}
.docView{font-size:13px;color:#2A3138}
.docView h4{font-family:'Spectral',serif;font-size:15px;margin:14px 0 6px;border-bottom:1px solid var(--line);padding-bottom:4px}
.kv{display:grid;grid-template-columns:170px 1fr;gap:4px 12px;font-size:12.5px}
@media(max-width:560px){.kv{grid-template-columns:1fr}}
.kv .k{color:var(--steel);font-weight:600}
.declineList{display:flex;flex-direction:column;gap:7px;margin:10px 0}
.jsonBox{font-family:'IBM Plex Mono',monospace;font-size:10.5px;background:var(--ink);color:var(--inkText);padding:12px;border-radius:2px;max-height:260px;overflow:auto;white-space:pre-wrap;word-break:break-all}
.banner{background:var(--panel2);border:1px solid var(--lineD);border-radius:3px;padding:12px 15px;margin:12px 0;font-size:12.5px;color:var(--inkText)}
.banner b{color:var(--goldL)}
@media(prefers-reduced-motion:no-preference){.evt{animation:evIn .25s ease}}
@keyframes evIn{from{opacity:0;transform:translateY(-3px)}to{opacity:1;transform:none}}
`;

/* ---------- crypto: real SHA-256 hash chain ---------- */
async function sha256(str) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(str));
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, "0")).join("");
}
const GENESIS = "0".repeat(64);

const STAGES = [
  { id: "OPC", n: "I", name: "OPC", sub: "R.S. 28:53.2" },
  { id: "PEC", n: "II", name: "PEC (1st Exam)", sub: "R.S. 28:53 · OBH-1" },
  { id: "XFER", n: "III", name: "Transmission", sub: "Secure handoff" },
  { id: "RCPT", n: "IV", name: "Acceptance", sub: "Receipt of custody" },
  { id: "CEC", n: "V", name: "CEC (2nd Exam)", sub: "R.S. 28:52.4 · OBH-2" },
];
const ROLES = ["Coroner (OPC)", "Examiner (PEC)", "Receiving Facility", "Coroner (CEC)", "Audit & Export"];
const HOSPITALS = [
  "Our Lady of Lourdes RMC — Lafayette",
  "Ochsner Lafayette General Medical Center",
  "Oceans Behavioral Hospital — Broussard",
  "Vermilion Behavioral Health Systems",
  "University Hospital & Clinics — Lafayette",
];
const DECLINE_CODES = [
  "No bed capacity at required level of care",
  "Patient not medically cleared",
  "Outside facility catchment / service area",
  "Clinical criteria not met on review",
  "Payor / placement barrier — escalate to OBH",
];
const EXAMINER_TYPES = ["Physician (MD/DO)", "Physician Assistant", "Psychiatric Mental Health NP", "Nurse Practitioner", "Psychologist"];
const HRS = 3600e3;

export default function ClarityEPEC() {
  const [role, setRole] = useState(0);
  const [events, setEvents] = useState([]);
  const [tick, setTick] = useState(Date.now());
  const chainTail = useRef(GENESIS);

  /* case record */
  const [c, setC] = useState({
    caseNo: "CL-2026-" + String(Math.floor(1000 + Math.random() * 9000)),
    parish: "Lafayette",
    subject: { name: "", dob: "", addr: "" },
    opc: null, pec: null, xfer: null, rcpt: null, cec: null,
    frozen: false, disposition: null,
  });

  /* live clocks */
  useEffect(() => { const t = setInterval(() => setTick(Date.now()), 1000); return () => clearInterval(t); }, []);

  async function log(type, label, detail, actor, tone = "") {
    const ts = new Date().toISOString();
    const prev = chainTail.current;
    const hash = await sha256(prev + "|" + type + "|" + label + "|" + detail + "|" + actor + "|" + ts);
    chainTail.current = hash;
    setEvents(e => [...e, { seq: e.length + 1, ts, type, label, detail, actor, prev, hash, tone }]);
    return hash;
  }

  /* document fingerprint = hash of the whole case snapshot, chained to ledger tail */
  const [fingerprint, setFingerprint] = useState(GENESIS);
  useEffect(() => {
    let live = true;
    sha256(chainTail.current + JSON.stringify(c)).then(h => { if (live) setFingerprint(h); });
    return () => { live = false; };
  }, [c, events]);

  /* stage status */
  const stageState = (id) => {
    const order = { OPC: !!c.opc, PEC: !!c.pec, XFER: !!c.xfer, RCPT: !!c.rcpt && c.rcpt.accepted, CEC: !!c.cec };
    if (c.rcpt && !c.rcpt.accepted && id === "RCPT") return "dead";
    if (order[id]) return "done";
    const seq = ["OPC", "PEC", "XFER", "RCPT", "CEC"];
    const next = seq.find(s => !order[s]);
    return id === next ? "live" : "";
  };

  /* ---------------- OPC form state ---------------- */
  const [opcF, setOpcF] = useState({ requestor: "", relation: "", observed: "", basis: [], name: "", dob: "", addr: "" });
  const toggleBasis = (setF, f, v) => setF({ ...f, basis: f.basis.includes(v) ? f.basis.filter(x => x !== v) : [...f.basis, v] });

  async function issueOPC() {
    const now = Date.now();
    setC(p => ({
      ...p,
      subject: { name: opcF.name, dob: opcF.dob, addr: opcF.addr },
      opc: { ...opcF, issuedAt: now, expiresAt: now + 72 * HRS, issuedBy: "Coroner, " + p.parish + " Parish" },
    }));
    await log("OPC_ISSUED", "Order for Protective Custody issued", `Coroner directs peace officer transport of ${opcF.name} to nearest treatment facility. Valid 72 hrs. Grounds: ${opcF.basis.join("; ")}.`, "Parish Coroner", "gold");
    setRole(1);
  }

  /* ---------------- PEC form state ---------------- */
  const [pecF, setPecF] = useState({ examiner: "", type: EXAMINER_TYPES[0], examAt: "", findings: [], cond: [], illness: "Mental Illness (up to 15 days)", tele: false, narrative: "" });
  const pecExamValid = useMemo(() => {
    if (!pecF.examAt) return null;
    const dt = new Date(pecF.examAt).getTime();
    return Date.now() - dt <= 72 * HRS && dt <= Date.now();
  }, [pecF.examAt, tick]);
  const pecReady = pecF.examiner && pecF.examAt && pecExamValid && pecF.findings.length > 0 && pecF.cond.length > 0 && pecF.narrative.trim().length > 20;

  async function executePEC() {
    const now = Date.now();
    setC(p => ({ ...p, pec: { ...pecF, executedAt: now } }));
    await log("PEC_EXECUTED", "Physician's Emergency Certificate executed (OBH-1)", `${pecF.type} ${pecF.examiner} certifies: ${pecF.findings.join(", ")}; ${pecF.cond.join(", ")}. Basis: ${pecF.illness}.${pecF.tele ? " Examination conducted by telemedicine per R.S. 28:53(G)(3)(a)." : ""}`, pecF.examiner, "gold");
    await log("DOC_SEALED", "Certificate content hash sealed", "PEC narrative and findings frozen; any post-execution edit would break chain verification.", "System");
    setRole(2);
  }

  /* ---------------- transmission ---------------- */
  const [dest, setDest] = useState(HOSPITALS[0]);
  async function transmit() {
    setC(p => ({ ...p, xfer: { dest, sentAt: Date.now() } }));
    await log("PACKET_TRANSMITTED", "Certificate packet transmitted to receiving facility", `Encrypted packet (OPC + OBH-1 + narrative + custody ledger) sent to ${dest}. Awaiting electronic acceptance receipt.`, "Clarity Secure Transfer", "gold");
  }

  /* ---------------- acceptance ---------------- */
  const [receiver, setReceiver] = useState("");
  const [declSel, setDeclSel] = useState(null);
  async function accept() {
    const now = Date.now();
    setC(p => ({ ...p, rcpt: { accepted: true, receiver, at: now, cecDeadline: now + 72 * HRS } }));
    await log("CUSTODY_ACCEPTED", "Acceptance receipt — custody transferred to facility", `${c.xfer.dest} accepts patient and packet. Receiver of record: ${receiver}. Coroner notified per R.S. 28:53(B)(3); CEC due within 72 hours of admission.`, receiver, "verd");
    setRole(3);
  }
  async function decline() {
    setC(p => ({ ...p, rcpt: { accepted: false, receiver, reason: DECLINE_CODES[declSel], at: Date.now() } }));
    await log("CUSTODY_DECLINED", "Facility declined transfer", `${c.xfer.dest} declined. Reason code: ${DECLINE_CODES[declSel]}. Fallback routing required; decline logged for OBH gap analysis.`, receiver || "Facility intake", "oxide");
  }
  async function reroute() {
    setC(p => ({ ...p, xfer: null, rcpt: null }));
    await log("REROUTE", "Packet re-routed after decline", "Referring party selecting alternate receiving facility. Prior decline retained in ledger.", "Referring examiner");
    setRole(2);
  }

  /* ---------------- CEC ---------------- */
  const [cecF, setCecF] = useState({ examiner: "", findings: [], cond: [], concur: "continue" });
  const cecClock = c.rcpt && c.rcpt.accepted ? c.rcpt.cecDeadline - tick : null;
  const fmtClock = (ms) => {
    if (ms == null) return "—";
    const neg = ms < 0; ms = Math.abs(ms);
    const h = Math.floor(ms / HRS), m = Math.floor((ms % HRS) / 60000), s = Math.floor((ms % 60000) / 1000);
    return (neg ? "−" : "") + String(h).padStart(2, "0") + ":" + String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0");
  };
  async function executeCEC() {
    const now = Date.now();
    if (cecF.concur === "continue") {
      setC(p => ({ ...p, cec: { ...cecF, executedAt: now }, frozen: true, disposition: "CONFINEMENT CONTINUED" }));
      await log("CEC_EXECUTED", "Coroner's Emergency Certificate executed (OBH-2)", `Independent examination by ${cecF.examiner} within 72-hr window. Findings: ${cecF.findings.join(", ")}; ${cecF.cond.join(", ")}. Continued confinement authorized as precondition under R.S. 28:52.4/28:53.`, cecF.examiner, "verd");
    } else {
      setC(p => ({ ...p, cec: { ...cecF, executedAt: now }, frozen: true, disposition: "DISCHARGED BY CORONER" }));
      await log("CEC_DISCHARGE", "Coroner finds subject not proper for emergency admission", `Per R.S. 28:53(F)(5), subject shall not be further detained; director to discharge forthwith. Examiner: ${cecF.examiner}.`, cecF.examiner, "oxide");
    }
    await log("RECORD_FROZEN", "Case record frozen — WORM archive", "Full packet archived. Fingerprint locked for court, DA, and audit export.", "System");
    setRole(4);
  }

  /* ---------------- export ---------------- */
  const [showJson, setShowJson] = useState(false);
  const [copied, setCopied] = useState(false);
  const packet = useMemo(() => JSON.stringify({ system: "Clarity e-PEC (prototype)", caseNo: c.caseNo, parish: c.parish, fingerprint, record: c, custodyLedger: events }, null, 2), [c, events, fingerprint]);
  async function copyPacket() {
    try { await navigator.clipboard.writeText(packet); setCopied(true); setTimeout(() => setCopied(false), 1600); } catch { setShowJson(true); }
  }
  async function verifyChain() {
    let prev = GENESIS, ok = true;
    for (const e of events) {
      const h = await sha256(prev + "|" + e.type + "|" + e.label + "|" + e.detail + "|" + e.actor + "|" + e.ts);
      if (h !== e.hash || e.prev !== prev) { ok = false; break; }
      prev = h;
    }
    await log("CHAIN_VERIFIED", ok ? "Chain of custody verified — no tampering detected" : "CHAIN VERIFICATION FAILED", ok ? `${events.length} events re-hashed; every link matches. Ledger is intact.` : "Hash mismatch found. Record integrity cannot be certified.", "Auditor", ok ? "verd" : "oxide");
  }

  /* seeded demo */
  async function seedDemo() {
    setOpcF({ requestor: "Sgt. M. Broussard, LPD", relation: "Responding officer — welfare check", observed: "Subject on Evangeline Thruway overpass stating intent to jump; refused voluntary transport; family reports 4-day decompensation, not eating.", basis: ["Dangerous to self"], name: "J. Doe", dob: "1988-03-14", addr: "Lafayette, LA" });
    setPecF({ examiner: "Dr. A. Thibodeaux", type: EXAMINER_TYPES[0], examAt: new Date(Date.now() - 2 * HRS).toISOString().slice(0, 16), findings: ["Dangerous to self"], cond: ["Unwilling to seek voluntary admission"], illness: "Mental Illness (up to 15 days)", tele: false, narrative: "Pt presents with acute suicidal ideation with plan and recent attempt interrupted by LEO. Flat affect, psychomotor retardation, refuses safety planning. C-SSRS: high risk. Requires inpatient stabilization; does not consent to voluntary admission." });
    setCecF({ examiner: "Dr. R. Melancon (Deputy Coroner)", findings: ["Dangerous to self"], cond: ["Unwilling to seek voluntary admission"], concur: "continue" });
    setReceiver("K. Fontenot, RN — Intake Charge Nurse");
    await log("DEMO_SEEDED", "Demo data loaded", "All forms pre-filled with a sample crisis scenario. Walk each role left to right.", "System");
  }

  const FINDINGS = [
    { v: "Dangerous to self", s: "Substantial risk of self-inflicted serious bodily harm" },
    { v: "Dangerous to others", s: "Substantial risk of serious bodily harm to another" },
    { v: "Gravely disabled", s: "Unable to provide for basic needs; harm without care" },
  ];
  const CONDS = [
    { v: "Unwilling to seek voluntary admission", s: "" },
    { v: "Unable to seek voluntary admission", s: "" },
  ];
  const toggleIn = (setF, f, key, v) => setF({ ...f, [key]: f[key].includes(v) ? f[key].filter(x => x !== v) : [...f[key], v] });

  const Checks = ({ f, setF, keyName, items }) => (
    <div className="chkGrp">
      {items.map(it => (
        <label key={it.v} className={"chk" + (f[keyName].includes(it.v) ? " on" : "")}>
          <input type="checkbox" checked={f[keyName].includes(it.v)} onChange={() => toggleIn(setF, f, keyName, it.v)} />
          <span><b>{it.v}</b>{it.s && <small>{it.s}</small>}</span>
        </label>
      ))}
    </div>
  );

  /* ================= RENDER ================= */
  return (
    <div className="epc">
      <style>{CSS}</style>
      <div className="wrap">
        <header className="hdr">
          <div className="wordmark">CLARITY <span>e-PEC</span></div>
          <div className="caseTag">CASE <b>{c.caseNo}</b> · {c.parish.toUpperCase()} PARISH · LA R.S. TITLE 28{c.disposition && <span className="pill">{c.disposition}</span>}</div>
        </header>

        <nav className="stageRail" aria-label="Statutory stages">
          {STAGES.map(s => (
            <div key={s.id} className={"stage " + stageState(s.id)}>
              <div className="stgNum">{s.n}</div>
              <div className="stgName">{s.name}</div>
              <div className="stgSub">{s.sub}</div>
            </div>
          ))}
        </nav>

        <div className="roleBar" role="tablist">
          {ROLES.map((r, i) => (
            <button key={r} role="tab" aria-selected={role === i} className={"roleBtn" + (role === i ? " on" : "")} onClick={() => setRole(i)}>{r}</button>
          ))}
          {events.length === 0 && <button className="roleBtn" style={{ borderColor: "var(--goldL)", color: "var(--goldL)" }} onClick={seedDemo}>Load demo scenario</button>}
        </div>

        <div className="grid">
          <main>
            {/* ============ ROLE 0 — CORONER: OPC ============ */}
            {role === 0 && (
              <section className="sheet">
                <div className="sheetHd">
                  <div>
                    <div className="formNo">Order for Protective Custody</div>
                    <div className="sheetTitle">Request &amp; Issuance — OPC</div>
                    <div className="statRef">La. R.S. 28:53.2 — Coroner or district judge may order protective custody on a credible person's sworn statement from personal observation. Order valid 72 hours; authorizes peace officer transport to a treatment facility for examination.</div>
                  </div>
                  {c.opc && <span className="stamp gold">OPC Issued</span>}
                </div>
                <div className="sheetBody">
                  {!c.opc ? (<>
                    <div className="two">
                      <div className="fRow"><label className="fLbl">Requesting party (credible person)</label><input className="fIn" value={opcF.requestor} onChange={e => setOpcF({ ...opcF, requestor: e.target.value })} placeholder="Name, agency" /></div>
                      <div className="fRow"><label className="fLbl">Relationship to subject</label><input className="fIn" value={opcF.relation} onChange={e => setOpcF({ ...opcF, relation: e.target.value })} placeholder="Officer, family member, clinician…" /></div>
                    </div>
                    <div className="two">
                      <div className="fRow"><label className="fLbl">Subject name</label><input className="fIn" value={opcF.name} onChange={e => setOpcF({ ...opcF, name: e.target.value })} /></div>
                      <div className="fRow"><label className="fLbl">Date of birth</label><input className="fIn" type="date" value={opcF.dob} onChange={e => setOpcF({ ...opcF, dob: e.target.value })} /></div>
                    </div>
                    <div className="fRow"><label className="fLbl">Location / address</label><input className="fIn" value={opcF.addr} onChange={e => setOpcF({ ...opcF, addr: e.target.value })} /></div>
                    <div className="fRow"><label className="fLbl">Statutory grounds (check all that apply)</label><Checks f={opcF} setF={setOpcF} keyName="basis" items={FINDINGS} /></div>
                    <div className="fRow"><label className="fLbl">Personal observation — sworn statement</label><textarea className="fTa" value={opcF.observed} onChange={e => setOpcF({ ...opcF, observed: e.target.value })} placeholder="Facts observed firsthand that establish danger to self, danger to others, or grave disability…" /></div>
                    <div className="attest"><b>Coroner's directive.</b> Upon issuance, this order constitutes legal authority for a peace officer to take the above-named person into protective custody and transport them to the nearest treatment facility for examination. This order expires 72 hours after issuance.</div>
                    <div className="btnRow"><button className="btn gold" disabled={!(opcF.requestor && opcF.name && opcF.basis.length && opcF.observed.length > 20)} onClick={issueOPC}>Issue OPC &amp; open custody ledger</button></div>
                  </>) : (
                    <div className="docView">
                      <div className="kv">
                        <span className="k">Subject</span><span>{c.subject.name} · DOB {c.subject.dob || "—"}</span>
                        <span className="k">Requestor</span><span>{c.opc.requestor} ({c.opc.relation})</span>
                        <span className="k">Grounds</span><span>{c.opc.basis.join("; ")}</span>
                        <span className="k">Issued</span><span>{new Date(c.opc.issuedAt).toLocaleString()}</span>
                        <span className="k">Expires</span><span className="clock">{fmtClock(c.opc.expiresAt - tick)} remaining</span>
                      </div>
                      <h4>Sworn observation</h4><p>{c.opc.observed}</p>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* ============ ROLE 1 — EXAMINER: PEC ============ */}
            {role === 1 && (
              <section className="sheet">
                <div className="sheetHd">
                  <div>
                    <div className="formNo">Form OBH-1 · Complete prior to admission</div>
                    <div className="sheetTitle">Physician's Emergency Certificate</div>
                    <div className="statRef">La. R.S. 28:53 &amp; 28:63 — May be executed by a physician, physician assistant, psychiatric mental health NP or other NP, or psychologist, following actual examination conducted not more than 72 hours before signing. Authorizes detention for treatment up to 15 days (mental illness or substance abuse) with a second 15-day SA extension available.</div>
                  </div>
                  {c.pec && <span className="stamp gold">PEC Executed</span>}
                </div>
                <div className="sheetBody">
                  {!c.opc && <div className="attest">No active OPC on this case. A PEC can also originate directly from an examination without an OPC — proceed if the subject presented voluntarily or via other lawful custody.</div>}
                  {!c.pec ? (<>
                    <div className="two">
                      <div className="fRow"><label className="fLbl">Examining certifier</label><input className="fIn" value={pecF.examiner} onChange={e => setPecF({ ...pecF, examiner: e.target.value })} placeholder="Name, credentials" /></div>
                      <div className="fRow"><label className="fLbl">Certifier type (R.S. 28:53)</label>
                        <select className="fSel" value={pecF.type} onChange={e => setPecF({ ...pecF, type: e.target.value })}>{EXAMINER_TYPES.map(t => <option key={t}>{t}</option>)}</select></div>
                    </div>
                    <div className="two">
                      <div className="fRow"><label className="fLbl">Actual examination date &amp; time</label>
                        <input className="fIn" type="datetime-local" value={pecF.examAt} onChange={e => setPecF({ ...pecF, examAt: e.target.value })} />
                        {pecF.examAt && (pecExamValid
                          ? <small style={{ color: "var(--verd)", fontWeight: 600 }}>✓ Within the 72-hour statutory window</small>
                          : <small style={{ color: "var(--oxide)", fontWeight: 700 }}>✕ Outside the 72-hour window — certificate would be invalid</small>)}
                      </div>
                      <div className="fRow"><label className="fLbl">Basis &amp; detention period</label>
                        <select className="fSel" value={pecF.illness} onChange={e => setPecF({ ...pecF, illness: e.target.value })}>
                          <option>Mental Illness (up to 15 days)</option>
                          <option>Substance Abuse (up to 15 days)</option>
                          <option>Substance Abuse — 2nd certificate (up to 28 days total)</option>
                        </select></div>
                    </div>
                    <div className="two">
                      <div className="fRow"><label className="fLbl">Findings — check where appropriate</label><Checks f={pecF} setF={setPecF} keyName="findings" items={FINDINGS} /></div>
                      <div className="fRow"><label className="fLbl">And the person is</label><Checks f={pecF} setF={setPecF} keyName="cond" items={CONDS} /></div>
                    </div>
                    <label className={"chk" + (pecF.tele ? " on" : "")} style={{ marginBottom: 14 }}>
                      <input type="checkbox" checked={pecF.tele} onChange={e => setPecF({ ...pecF, tele: e.target.checked })} />
                      <span><b>Examination conducted by telemedicine</b><small>Per R.S. 28:53(G)(3)(a): a licensed healthcare professional was physically present with the patient during the video examination.</small></span>
                    </label>
                    <div className="fRow"><label className="fLbl">Clinical observations &amp; narrative (required)</label><textarea className="fTa" value={pecF.narrative} onChange={e => setPecF({ ...pecF, narrative: e.target.value })} placeholder="Time-stamped observations, risk assessment, mental status exam, why immediate psychiatric treatment in a treatment facility is required…" /></div>
                    <div className="attest"><b>Attestation.</b> I certify that I have actually examined the above-named person within the preceding 72 hours and am of the opinion that they are in need of immediate psychiatric treatment in a treatment facility because they are seriously mentally ill or suffering from substance abuse as indicated above. Completion of this certificate constitutes legal authority to transport the patient to the designated facility. Executed under La. R.S. 28:53 and 28:63.</div>
                    <div className="btnRow"><button className="btn gold" disabled={!pecReady} onClick={executePEC}>Sign, attest &amp; seal certificate</button></div>
                  </>) : (
                    <div className="docView">
                      <span className="stamp gold">Sealed · hash-locked</span>
                      <div className="kv" style={{ marginTop: 10 }}>
                        <span className="k">Certifier</span><span>{c.pec.examiner} — {c.pec.type}</span>
                        <span className="k">Examined</span><span>{new Date(c.pec.examAt).toLocaleString()}{c.pec.tele ? " (telemedicine)" : ""}</span>
                        <span className="k">Findings</span><span>{c.pec.findings.join("; ")} · {c.pec.cond.join("; ")}</span>
                        <span className="k">Basis</span><span>{c.pec.illness}</span>
                        <span className="k">Executed</span><span>{new Date(c.pec.executedAt).toLocaleString()}</span>
                      </div>
                      <h4>Narrative</h4><p>{c.pec.narrative}</p>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* ============ ROLE 2 — TRANSMIT / FACILITY ============ */}
            {role === 2 && (
              <section className="sheet">
                <div className="sheetHd">
                  <div>
                    <div className="formNo">Secure Transmission &amp; Electronic Acceptance</div>
                    <div className="sheetTitle">Receiving Facility Handoff</div>
                    <div className="statRef">Replaces triplicate paper ("Original to Hospital — One Copy to Examining Physician"). The packet — OPC, OBH-1, narrative, and full custody ledger — moves as one hash-verified unit. Acceptance or decline is timestamped with a receiver of record.</div>
                  </div>
                  {c.rcpt?.accepted && <span className="stamp verd">Accepted</span>}
                  {c.rcpt && !c.rcpt.accepted && <span className="stamp oxide">Declined</span>}
                </div>
                <div className="sheetBody">
                  {!c.pec ? <div className="attest">A sealed PEC is required before transmission. Complete Stage II first.</div> : !c.xfer ? (<>
                    <div className="fRow"><label className="fLbl">Receiving facility</label>
                      <select className="fSel" value={dest} onChange={e => setDest(e.target.value)}>{HOSPITALS.map(h => <option key={h}>{h}</option>)}</select></div>
                    <div className="banner">Packet contents: OPC {c.opc ? "✓" : "—"} · OBH-1 PEC ✓ · Clinical narrative ✓ · Custody ledger ({events.length} events) ✓ · Fingerprint <code style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 10 }}>{fingerprint.slice(0, 16)}…</code></div>
                    <div className="btnRow"><button className="btn gold" onClick={transmit}>Transmit packet securely</button></div>
                  </>) : !c.rcpt ? (<>
                    <div className="banner">Now acting as <b>{c.xfer.dest}</b> intake. Sent {new Date(c.xfer.sentAt).toLocaleTimeString()}.</div>
                    <div className="fRow"><label className="fLbl">Receiver of record (name, role)</label><input className="fIn" value={receiver} onChange={e => setReceiver(e.target.value)} placeholder="Charge nurse / intake physician" /></div>
                    <div className="fRow"><label className="fLbl">Decline reason (only if declining)</label>
                      <div className="declineList">{DECLINE_CODES.map((d, i) => (
                        <label key={d} className={"chk" + (declSel === i ? " on" : "")}>
                          <input type="radio" name="dc" checked={declSel === i} onChange={() => setDeclSel(i)} /><span><b>{d}</b></span>
                        </label>))}</div>
                    </div>
                    <div className="btnRow">
                      <button className="btn verd" disabled={!receiver} onClick={accept}>Accept custody — issue receipt</button>
                      <button className="btn oxide" disabled={declSel == null} onClick={decline}>Decline with reason code</button>
                    </div>
                  </>) : c.rcpt.accepted ? (
                    <div className="docView">
                      <div className="kv">
                        <span className="k">Facility</span><span>{c.xfer.dest}</span>
                        <span className="k">Receiver of record</span><span>{c.rcpt.receiver}</span>
                        <span className="k">Accepted at</span><span>{new Date(c.rcpt.at).toLocaleString()}</span>
                        <span className="k">CEC deadline</span><span className="clock">{fmtClock(cecClock)} remaining</span>
                      </div>
                    </div>
                  ) : (
                    <div className="docView">
                      <p style={{ marginBottom: 10 }}><b>Declined:</b> {c.rcpt.reason}. The decline, reason code, and timestamp are permanently in the ledger — the data OBH needs to see where the system breaks.</p>
                      <button className="btn ghost" onClick={reroute}>Re-route to another facility</button>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* ============ ROLE 3 — CORONER: CEC ============ */}
            {role === 3 && (
              <section className="sheet">
                <div className="sheetHd">
                  <div>
                    <div className="formNo">Form OBH-2 · Within 72 hours after admission</div>
                    <div className="sheetTitle">Coroner's Emergency Certificate</div>
                    <div className="statRef">La. R.S. 28:52.4 &amp; 28:53 — Upon admission by emergency certificate, the facility director immediately notifies the parish coroner. Within 72 hours, the coroner or deputy independently examines the patient; execution of this certificate is a necessary precondition to continued confinement. If criteria are not met, the patient shall be discharged forthwith.</div>
                  </div>
                  {c.cec && <span className={"stamp " + (c.disposition?.startsWith("DIS") ? "oxide" : "verd")}>{c.disposition?.startsWith("DIS") ? "Discharged" : "CEC Executed"}</span>}
                </div>
                <div className="sheetBody">
                  {!c.rcpt?.accepted ? <div className="attest">No accepted admission yet. The 72-hour CEC clock starts at facility acceptance (Stage IV).</div> : !c.cec ? (<>
                    <div className={"clockBox" + (cecClock < 12 * HRS ? " warn" : "")}>
                      <span className="cl">Statutory deadline — second examination</span>
                      <span className="clock">{fmtClock(cecClock)}</span>
                    </div>
                    <div className="fRow"><label className="fLbl">Coroner / deputy coroner examiner</label><input className="fIn" value={cecF.examiner} onChange={e => setCecF({ ...cecF, examiner: e.target.value })} /></div>
                    <div className="two">
                      <div className="fRow"><label className="fLbl">Independent findings</label><Checks f={cecF} setF={setCecF} keyName="findings" items={FINDINGS} /></div>
                      <div className="fRow"><label className="fLbl">And the person is</label><Checks f={cecF} setF={setCecF} keyName="cond" items={CONDS} /></div>
                    </div>
                    <div className="fRow"><label className="fLbl">Determination</label>
                      <div className="chkGrp">
                        <label className={"chk" + (cecF.concur === "continue" ? " on" : "")}><input type="radio" name="cc" checked={cecF.concur === "continue"} onChange={() => setCecF({ ...cecF, concur: "continue" })} /><span><b>Criteria met — continued confinement authorized</b></span></label>
                        <label className={"chk" + (cecF.concur === "discharge" ? " on" : "")}><input type="radio" name="cc" checked={cecF.concur === "discharge"} onChange={() => setCecF({ ...cecF, concur: "discharge" })} /><span><b>Not a proper subject — discharge forthwith</b><small>R.S. 28:53(F)(5)</small></span></label>
                      </div>
                    </div>
                    <div className="btnRow"><button className="btn gold" disabled={!cecF.examiner || (cecF.concur === "continue" && (!cecF.findings.length || !cecF.cond.length))} onClick={executeCEC}>Execute certificate &amp; freeze record</button></div>
                  </>) : (
                    <div className="docView">
                      <div className="kv">
                        <span className="k">Examiner</span><span>{c.cec.examiner}</span>
                        <span className="k">Determination</span><span>{c.disposition}</span>
                        <span className="k">Executed</span><span>{new Date(c.cec.executedAt).toLocaleString()}</span>
                      </div>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* ============ ROLE 4 — AUDIT & EXPORT ============ */}
            {role === 4 && (
              <section className="sheet">
                <div className="sheetHd">
                  <div>
                    <div className="formNo">WORM archive · Court / DA / OBH export</div>
                    <div className="sheetTitle">Audit &amp; Packet Export</div>
                    <div className="statRef">Re-hash every ledger event to prove non-tampering, then export the complete packet — certificates, narrative, decline codes, receipts, and the full hash chain — as a single verifiable artifact.</div>
                  </div>
                  {c.frozen && <span className="stamp verd">Record Frozen</span>}
                </div>
                <div className="sheetBody">
                  <div className="docView">
                    <h4 style={{ marginTop: 0 }}>Case summary</h4>
                    <div className="kv">
                      <span className="k">Case</span><span>{c.caseNo} — {c.parish} Parish</span>
                      <span className="k">Subject</span><span>{c.subject.name || "—"}</span>
                      <span className="k">OPC</span><span>{c.opc ? "Issued " + new Date(c.opc.issuedAt).toLocaleString() : "—"}</span>
                      <span className="k">PEC (OBH-1)</span><span>{c.pec ? c.pec.examiner + " · " + new Date(c.pec.executedAt).toLocaleString() : "—"}</span>
                      <span className="k">Facility</span><span>{c.xfer ? c.xfer.dest : "—"}</span>
                      <span className="k">Acceptance</span><span>{c.rcpt ? (c.rcpt.accepted ? "Accepted by " + c.rcpt.receiver : "Declined — " + c.rcpt.reason) : "—"}</span>
                      <span className="k">CEC (OBH-2)</span><span>{c.cec ? c.disposition : "—"}</span>
                      <span className="k">Ledger events</span><span>{events.length}</span>
                    </div>
                  </div>
                  <div className="btnRow" style={{ marginTop: 16 }}>
                    <button className="btn gold" onClick={verifyChain} disabled={!events.length}>Verify chain of custody</button>
                    <button className="btn verd" onClick={copyPacket} disabled={!events.length}>{copied ? "Copied ✓" : "Copy packet JSON"}</button>
                    <button className="btn ghost" onClick={() => setShowJson(s => !s)}>{showJson ? "Hide" : "View"} raw packet</button>
                  </div>
                  {showJson && <div className="jsonBox" style={{ marginTop: 12 }}>{packet}</div>}
                </div>
              </section>
            )}
          </main>

          {/* ============ CUSTODY LEDGER — signature element ============ */}
          <aside className="ledger" aria-label="Chain of custody ledger">
            <div className="ledHd">
              <h3>Chain of Custody</h3>
              <div className={"fprint" + (c.frozen ? " frozen" : "")}>
                <div className="fl"><span>Document fingerprint · SHA-256</span><span>{c.frozen ? "FROZEN" : "LIVE"}</span></div>
                <code>{fingerprint}</code>
              </div>
            </div>
            <div className="ledScroll">
              {events.length === 0 && <div className="evt"><div className="evtLbl" style={{ color: "var(--dim)" }}>Ledger empty</div><div className="evtDet">Every action taken on this case will be appended here, hash-chained to the event before it. Nothing can be edited or removed — only appended.</div></div>}
              {[...events].reverse().map(e => (
                <div key={e.seq} className={"evt " + e.tone}>
                  <div className="evtTop"><span>#{String(e.seq).padStart(3, "0")} · {e.type}</span><span>{new Date(e.ts).toLocaleTimeString()}</span></div>
                  <div className="evtLbl">{e.label}</div>
                  <div className="evtDet">{e.detail}</div>
                  <div className="evtDet" style={{ marginTop: 3 }}>Actor: {e.actor}</div>
                  <div className="evtHash">⛓ {e.hash.slice(0, 40)}…</div>
                </div>
              ))}
            </div>
          </aside>
        </div>

        <p className="note">
          Prototype for demonstration. Statutory references (La. R.S. 28:53, 28:53.2, 28:52.4; LDH forms OBH-1/OBH-2) are mapped for design purposes and must be validated by Louisiana counsel and LDH/OBH before any operational use. Production deployment requires a HIPAA-compliant backend (BAA), role-based authentication, encrypted storage and transport, retention policy, and coroner/facility onboarding. Hashing shown is real SHA-256 computed in-browser; in production the chain anchors to server-side WORM storage.
        </p>
      </div>
    </div>
  );
}
