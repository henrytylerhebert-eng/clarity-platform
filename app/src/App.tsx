import { useEffect, useMemo, useState } from "react";
import {
  BedDouble,
  BookOpenCheck,
  ClipboardList,
  FileCheck2,
  FileText,
  FlaskConical,
  Gauge,
  LayoutDashboard,
  Network,
  PlusCircle,
  RotateCcw,
  Scale,
  ShieldCheck,
} from "lucide-react";
import { CaseQueue } from "./workspaces/CaseQueue";
import { CommandCenter } from "./workspaces/CommandCenter";
import { Bedboard } from "./workspaces/Bedboard";
import { NewCase } from "./workspaces/NewCase";
import { CaseOverview } from "./workspaces/CaseOverview";
import { GuidedIntake } from "./workspaces/GuidedIntake";
import { MedicalNecessity } from "./workspaces/MedicalNecessity";
import { LegalStatus } from "./workspaces/LegalStatus";
import { PacketPreview } from "./workspaces/PacketPreview";
import { RoutingResponse } from "./workspaces/RoutingResponse";
import { CustodyLedger } from "./workspaces/CustodyLedger";
import { TrainingSops } from "./workspaces/TrainingSops";
import { MockAdmitLab } from "./workspaces/MockAdmitLab";
import { EmptyState, StatusBadge } from "./components/StatusBadge";
import { createAnalyticsEvent } from "./domain/analyticsEvents";
import { appendCustodyLedgerEvent } from "./domain/custodyLedger";
import { buildPacketForCase } from "./domain/packets";
import { getRole, roles, type RoleId, type WorkspaceId } from "./domain/roles";
import { getRoleFocus } from "./domain/roleFocus";
import { getCaseBundle } from "./domain/selectors";
import { loadAppState, resetAppState, saveAppState } from "./domain/storage";
import type {
  AppState,
  Assessment,
  Case,
  Encounter,
  FacilityResponse,
  LegalInstrument,
  MedicalNecessitySnapshot,
  PlacementRecommendation,
  ReferralPacket,
  RiskFinding,
  SourceReference,
} from "./domain/types";

const workspaceItems: Array<{ id: WorkspaceId; label: string; icon: typeof LayoutDashboard }> = [
  { id: "queue", label: "Case Queue", icon: LayoutDashboard },
  { id: "command", label: "Command Center", icon: Gauge },
  { id: "new", label: "New Case", icon: PlusCircle },
  { id: "overview", label: "Case Overview", icon: ClipboardList },
  { id: "intake", label: "Guided Intake", icon: FileText },
  { id: "medical", label: "Medical Necessity", icon: FileCheck2 },
  { id: "legal", label: "Legal Status", icon: Scale },
  { id: "packet", label: "Packet Preview", icon: ShieldCheck },
  { id: "routing", label: "Routing Response", icon: Network },
  { id: "bedboard", label: "Milieu Bedboard", icon: BedDouble },
  { id: "ledger", label: "Custody Ledger", icon: ShieldCheck },
  { id: "training", label: "Training & SOPs", icon: BookOpenCheck },
  { id: "mock-admits", label: "Mock Admit Lab", icon: FlaskConical },
];

export function App() {
  const [state, setState] = useState<AppState | null>(null);
  const [selectedCaseId, setSelectedCaseId] = useState("case-004");
  const [workspace, setWorkspace] = useState<WorkspaceId>("queue");
  const [roleId, setRoleId] = useState<RoleId>("all");

  const role = getRole(roleId);
  const visibleWorkspaceItems = workspaceItems.filter((item) => role.workspaces.includes(item.id));

  function handleRoleChange(nextRoleId: RoleId) {
    setRoleId(nextRoleId);
    const nextRole = getRole(nextRoleId);
    if (!nextRole.workspaces.includes(workspace)) {
      setWorkspace(nextRole.defaultWorkspace);
    }
  }

  useEffect(() => {
    void loadAppState().then(setState);
  }, []);

  useEffect(() => {
    if (state) {
      saveAppState(state);
    }
  }, [state]);

  const selectedCase = state?.cases.find((caseRecord) => caseRecord.id === selectedCaseId) ?? state?.cases[0];
  const bundle = useMemo(() => {
    if (!state || !selectedCase) return null;
    return getCaseBundle(state, selectedCase.id);
  }, [state, selectedCase]);

  if (!state) {
    return <div className="loading">Loading Clarity intake spine...</div>;
  }

  function updateState(updater: (current: AppState) => AppState) {
    setState((current) => (current ? updater(current) : current));
  }

  async function handleCreateCase(caseRecord: Case, encounter: Encounter, presentingConcern: string, briefNarrative: string) {
    if (!state) return;
    const occurredAt = new Date().toISOString();
    const assessment: Assessment = {
      id: `assess-${Date.now()}`,
      caseId: caseRecord.id,
      mode: "Field",
      presentingProblem: presentingConcern,
      precipitatingEvents: briefNarrative || "Unknown",
      dangerToSelf: "Not assessed",
      dangerToOthers: "Not assessed",
      graveDisability: "Unknown",
      orientation: "Unknown",
      psychosis: "Not assessed",
      moodSleepAppetite: "No measurements found",
      psychiatricHistory: "Unknown",
      treatmentHistory: "Unknown",
      substanceUse: "Not assessed",
      medicalConcerns: "Unknown",
      environmentalStressors: "Unknown",
      collateralContacts: "Missing",
      protectiveFactors: "Not assessed",
      lowerLevelConsidered: "Unknown",
      mentalStatus: "Unknown",
      collateralStatus: "Missing",
      formulation: "",
      reviewStatus: "Draft",
    };
    const custodyLedgerEvents = await appendCustodyLedgerEvent(state.custodyLedgerEvents, {
      id: `ledger-${Date.now()}`,
      caseId: caseRecord.id,
      eventType: "CASE_CREATED",
      actor: "Local prototype user",
      occurredAt,
      payload: { stage: "Referral", containsPhi: false },
    });
    setState({
      ...state,
      cases: [caseRecord, ...state.cases],
      encounters: [encounter, ...state.encounters],
      assessments: [assessment, ...state.assessments],
      custodyLedgerEvents,
      auditLogs: [
        { id: `audit-${Date.now()}`, caseId: caseRecord.id, action: "Case created", actor: "Local prototype user", occurredAt },
        ...state.auditLogs,
      ],
      analyticsEvents: [
        createAnalyticsEvent({
          eventType: "CASE_CREATED",
          caseId: caseRecord.id,
          metricsSafePayload: { containsPhi: false, priority: caseRecord.priority },
        }),
        ...state.analyticsEvents,
      ],
    });
    setSelectedCaseId(caseRecord.id);
    setWorkspace("overview");
  }

  function handleAssessmentChange(assessment: Assessment) {
    updateState((current) => ({
      ...current,
      assessments: current.assessments.map((item) => (item.id === assessment.id ? assessment : item)),
      analyticsEvents: [
        createAnalyticsEvent({
          eventType: "ASSESSMENT_UPDATED",
          caseId: assessment.caseId,
          metricsSafePayload: { containsPhi: false, reviewStatus: assessment.reviewStatus },
        }),
        ...current.analyticsEvents,
      ],
    }));
  }

  async function handleAddSourceAndRisk(source: SourceReference, risk: RiskFinding) {
    if (!state) return;
    const occurredAt = new Date().toISOString();
    const custodyLedgerEvents = await appendCustodyLedgerEvent(state.custodyLedgerEvents, {
      id: `ledger-${Date.now()}`,
      caseId: source.caseId,
      eventType: "RISK_FINDING_ADDED",
      actor: "Local prototype user",
      occurredAt,
      payload: { riskType: risk.type, sourceType: source.type, containsPhi: false },
    });
    setState({
      ...state,
      custodyLedgerEvents,
      sourceReferences: [source, ...state.sourceReferences],
      riskFindings: [risk, ...state.riskFindings],
      auditLogs: [
        { id: `audit-${Date.now()}`, caseId: source.caseId, action: "Risk finding added", actor: "Local prototype user", occurredAt },
        ...state.auditLogs,
      ],
      analyticsEvents: [
        createAnalyticsEvent({
          eventType: "RISK_FINDING_ADDED",
          caseId: source.caseId,
          metricsSafePayload: { containsPhi: false, riskType: risk.type },
        }),
        ...state.analyticsEvents,
      ],
    });
  }

  function handleMedicalChange(snapshot: MedicalNecessitySnapshot) {
    updateState((current) => ({
      ...current,
      medicalNecessitySnapshots: current.medicalNecessitySnapshots.map((item) => (item.id === snapshot.id ? snapshot : item)),
    }));
  }

  function handleLegalChange(legalInstrument: LegalInstrument) {
    updateState((current) => ({
      ...current,
      legalInstruments: current.legalInstruments.map((item) => (item.id === legalInstrument.id ? legalInstrument : item)),
      cases: current.cases.map((item) => item.id === legalInstrument.caseId ? { ...item, legalStatus: legalInstrument.legalStatus } : item),
    }));
  }

  async function handleFacilityResponse(response: FacilityResponse) {
    if (!state) return;
    const referral = state.facilityReferrals.find((item) => item.id === response.referralId);
    if (!referral) return;
    const occurredAt = response.respondedAt ?? new Date().toISOString();
    const status = response.response === "Accept"
      ? "Accepted"
      : response.response === "Decline"
        ? "Declined"
        : response.response === "Waitlist"
          ? "Waitlisted"
          : "Info requested";
    const custodyLedgerEvents = await appendCustodyLedgerEvent(state.custodyLedgerEvents, {
      id: `ledger-${Date.now()}`,
      caseId: referral.caseId,
      eventType: "ROUTING_RESPONSE_RECEIVED",
      actor: "Mock receiving facility",
      occurredAt,
      payload: { response: response.response, reasonCode: response.reasonCode ?? "Unknown", containsPhi: false },
    });
    setState({
      ...state,
      custodyLedgerEvents,
      facilityResponses: [...state.facilityResponses, response],
      facilityReferrals: state.facilityReferrals.map((item) => item.id === response.referralId ? { ...item, status } : item),
      cases: state.cases.map((item) => item.id === referral.caseId ? { ...item, routingStatus: status, currentStage: "Routing" } : item),
      auditLogs: [
        { id: `audit-${Date.now()}`, caseId: referral.caseId, action: "Routing response received", actor: "Mock receiving facility", occurredAt },
        ...state.auditLogs,
      ],
      analyticsEvents: [
        createAnalyticsEvent({
          eventType: "ROUTING_RESPONSE_RECEIVED",
          caseId: referral.caseId,
          metricsSafePayload: { containsPhi: false, response: response.response, reasonCode: response.reasonCode ?? null },
        }),
        ...state.analyticsEvents,
      ],
    });
  }

  async function handleGeneratePacket(caseId: string) {
    if (!state) return;
    const packet = await buildPacketForCase(state, caseId);
    const occurredAt = new Date().toISOString();
    const custodyLedgerEvents = await appendCustodyLedgerEvent(state.custodyLedgerEvents, {
      id: `ledger-${Date.now()}`,
      caseId,
      eventType: "PACKET_HASH_SEALED",
      actor: "Local prototype user",
      occurredAt,
      payload: { packetHash: packet.packetHash, completeness: packet.completeness, containsPhi: false },
    });
    setState({
      ...state,
      custodyLedgerEvents,
      referralPackets: [...state.referralPackets.filter((item) => item.caseId !== caseId), packet],
      cases: state.cases.map((item) => item.id === caseId ? { ...item, currentStage: "Packet", packetCompleteness: packet.completeness } : item),
      auditLogs: [
        { id: `audit-${Date.now()}`, caseId, action: "Packet generated and hash sealed", actor: "Local prototype user", occurredAt },
        ...state.auditLogs,
      ],
      analyticsEvents: [
        createAnalyticsEvent({
          eventType: "PACKET_PREVIEWED",
          caseId,
          metricsSafePayload: { containsPhi: false, completeness: packet.completeness },
        }),
        ...state.analyticsEvents,
      ],
    });
  }

  async function handleSendPacket(packet: ReferralPacket) {
    if (!state) return;
    const occurredAt = new Date().toISOString();
    const facilities = ["Bayou Vista Behavioral", "Cypress Recovery Hospital"];
    const newReferrals = facilities.map((facilityName, index) => ({
      id: `ref-${packet.caseId}-${Date.now()}-${index}`,
      caseId: packet.caseId,
      packetId: packet.id,
      facilityName,
      status: "Sent" as const,
      sentAt: occurredAt,
    }));
    const custodyLedgerEvents = await appendCustodyLedgerEvent(state.custodyLedgerEvents, {
      id: `ledger-${Date.now()}`,
      caseId: packet.caseId,
      eventType: "PACKET_SENT",
      actor: "Local prototype user",
      occurredAt,
      payload: { packetHash: packet.packetHash, facilities, containsPhi: false },
    });
    setState({
      ...state,
      custodyLedgerEvents,
      referralPackets: state.referralPackets.map((item) => item.id === packet.id ? { ...item, status: "Sent" } : item),
      facilityReferrals: [...state.facilityReferrals, ...newReferrals],
      cases: state.cases.map((item) => item.id === packet.caseId ? { ...item, currentStage: "Routing", routingStatus: "Sent" } : item),
      auditLogs: [
        { id: `audit-${Date.now()}`, caseId: packet.caseId, action: "Packet sent to facilities (simulated transmission)", actor: "Local prototype user", occurredAt },
        ...state.auditLogs,
      ],
      analyticsEvents: [
        createAnalyticsEvent({
          eventType: "PACKET_SENT",
          caseId: packet.caseId,
          metricsSafePayload: { containsPhi: false, facilityCount: facilities.length },
        }),
        ...state.analyticsEvents,
      ],
    });
  }

  async function handlePlacementDecision(recommendation: PlacementRecommendation, decision: "Accepted" | "Overridden", overrideReason?: string) {
    if (!state) return;
    const occurredAt = new Date().toISOString();
    const custodyLedgerEvents = await appendCustodyLedgerEvent(state.custodyLedgerEvents, {
      id: `ledger-${Date.now()}`,
      caseId: recommendation.caseId,
      eventType: "PLACEMENT_DECISION",
      actor: "Charge nurse (demo role)",
      occurredAt,
      payload: { bedId: recommendation.bedId, decision, overrideReason: overrideReason ?? null, containsPhi: false },
    });
    setState({
      ...state,
      custodyLedgerEvents,
      placementRecommendations: state.placementRecommendations.map((item) =>
        item.id === recommendation.id
          ? { ...item, status: decision, overrideReason, decidedBy: "Charge nurse (demo role)", decidedAt: occurredAt }
          : item,
      ),
      beds: decision === "Accepted"
        ? state.beds.map((bed) => bed.id === recommendation.bedId
            ? { ...bed, status: "Occupied" as const, occupantToken: recommendation.caseId, occupantAcuity: recommendation.candidateAcuity }
            : bed)
        : state.beds,
      auditLogs: [
        { id: `audit-${Date.now()}`, caseId: recommendation.caseId, action: `Placement ${decision.toLowerCase()}${overrideReason ? `: ${overrideReason}` : ""}`, actor: "Charge nurse (demo role)", occurredAt },
        ...state.auditLogs,
      ],
    });
  }

  async function handleReset() {
    const reset = await resetAppState();
    setState(reset);
    setSelectedCaseId("case-004");
    setWorkspace("queue");
  }

  const activeCase = selectedCase ?? state.cases[0];
  const isMockAdmitLab = workspace === "mock-admits";
  const focusChips = getRoleFocus(roleId, state, activeCase.id, new Date().toISOString());

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-block">
          <span className="brand-mark">C</span>
          <div>
            <h1>Clarity</h1>
            <p>Crisis Ops v0.2</p>
          </div>
        </div>
        <label className="role-select">
          Viewing as
          <select value={roleId} onChange={(event) => handleRoleChange(event.target.value as RoleId)}>
            {roles.map((item) => (
              <option key={item.id} value={item.id}>{item.label}</option>
            ))}
          </select>
          <span className="role-mission">{role.mission}</span>
          <span className="role-note">Demo role scoping only — not authentication.</span>
        </label>
        <nav className="nav-list" aria-label="Workspace navigation">
          {visibleWorkspaceItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                className={workspace === item.id ? "nav-item active" : "nav-item"}
                key={item.id}
                type="button"
                onClick={() => setWorkspace(item.id)}
              >
                <Icon size={17} />
                {item.label}
              </button>
            );
          })}
        </nav>
        <button className="reset-button" type="button" onClick={handleReset}>
          <RotateCcw size={16} /> Reset demo data
        </button>
      </aside>

      <main className="main-surface">
        <header className="topbar">
          <div>
            <span className="label">{isMockAdmitLab ? "Training workspace" : "Selected case"}</span>
            <h2>{isMockAdmitLab ? "Mock Admit Lab" : activeCase.patientToken.displayName}</h2>
          </div>
          <div className="topbar-badges">
            {isMockAdmitLab ? (
              <>
                <StatusBadge tone="danger">Synthetic only</StatusBadge>
                <StatusBadge tone="warn">Human review required</StatusBadge>
              </>
            ) : (
              <>
                <StatusBadge tone="info">{activeCase.currentStage}</StatusBadge>
                <StatusBadge tone={activeCase.priority === "Emergent" ? "danger" : "warn"}>{activeCase.priority}</StatusBadge>
                <StatusBadge tone="warn">Draft workflow</StatusBadge>
              </>
            )}
          </div>
        </header>

        {!isMockAdmitLab && focusChips.length ? (
          <div className="focus-strip" aria-label="Role focus summary">
            {focusChips.map((chip) => (
              <div className="focus-chip" key={chip.label}>
                <span className="label">{chip.label}</span>
                <StatusBadge tone={chip.tone}>{chip.value}</StatusBadge>
              </div>
            ))}
          </div>
        ) : null}

        <section className="content-region">
          {workspace === "queue" ? <CaseQueue state={state} selectedCaseId={activeCase.id} onSelect={(id) => { setSelectedCaseId(id); setWorkspace("overview"); }} /> : null}
          {workspace === "command" ? <CommandCenter state={state} onSelect={(id) => { setSelectedCaseId(id); setWorkspace("overview"); }} /> : null}
          {workspace === "new" ? <NewCase onCreate={handleCreateCase} /> : null}
          {workspace === "overview" ? <CaseOverview state={state} caseRecord={activeCase} /> : null}
          {workspace === "intake" ? <GuidedIntake state={state} caseId={activeCase.id} onAssessmentChange={handleAssessmentChange} onAddSourceAndRisk={handleAddSourceAndRisk} /> : null}
          {workspace === "medical" ? <MedicalNecessity snapshot={bundle?.medicalNecessity} onChange={handleMedicalChange} /> : null}
          {workspace === "legal" ? <LegalStatus legalInstrument={bundle?.legalInstrument} onChange={handleLegalChange} /> : null}
          {workspace === "packet" ? <PacketPreview state={state} caseId={activeCase.id} packet={bundle?.packet} onGenerate={handleGeneratePacket} onSend={handleSendPacket} /> : null}
          {workspace === "routing" ? <RoutingResponse referrals={bundle?.referrals ?? []} responses={state.facilityResponses} onResponse={handleFacilityResponse} /> : null}
          {workspace === "bedboard" ? <Bedboard state={state} onDecision={handlePlacementDecision} /> : null}
          {workspace === "ledger" ? (
            bundle?.ledgerEvents.length ? <CustodyLedger events={bundle.ledgerEvents} /> : <EmptyState title="No custody events">Material custody events appear here after legal drafts, packet sealing, transmission, or facility response.</EmptyState>
          ) : null}
          {workspace === "training" ? <TrainingSops roleId={roleId} /> : null}
          {workspace === "mock-admits" ? <MockAdmitLab /> : null}
        </section>
      </main>
    </div>
  );
}
