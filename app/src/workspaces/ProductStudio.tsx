import { useMemo, useState } from "react";
import { ArrowUpRight, GitBranch, Layers3, LockKeyhole, Map, Search, ShieldCheck, Workflow } from "lucide-react";

type Lens = "Product" | "Build" | "Run";
type RegistryFilter = "All" | "Active" | "Parking Lot";

type FeatureConcept = {
  id: string;
  title: string;
  stage: "Built" | "Candidate" | "Parked";
  visibility: "Internal" | "Pilot only" | "Private";
  owner: string;
  problem: string;
  outcome: string;
  users: string[];
  workflow: string;
  placement: string[];
  dependencies: string[];
  artifacts: string[];
  rollout: string;
  evidence: string;
  nextAction: string;
  risks: string[];
};

const featureConcepts: FeatureConcept[] = [
  {
    id: "FS-001",
    title: "Intake to packet traceability",
    stage: "Built",
    visibility: "Pilot only",
    owner: "Product + intake",
    problem: "Referral facts are repeated across intake, review, packet, and routing steps.",
    outcome: "A reviewer can follow one synthetic case from referral through response without retyping the story.",
    users: ["Central intake", "Clinician reviewer", "Receiving facility"],
    workflow: "Referral -> intake -> evidence -> packet -> routing",
    placement: ["app/src/workspaces/GuidedIntake.tsx", "app/src/workspaces/PacketPreview.tsx", "app/src/domain/packets.ts"],
    dependencies: ["Synthetic AppState", "Packet builder", "Custody ledger"],
    artifacts: ["Local prototype", "App smoke tests", "README workflow map"],
    rollout: "Local demo only; no live integration",
    evidence: "Implemented surface exists. Outcome measurement: No measurements found.",
    nextAction: "Run a structured synthetic walkthrough with intake and clinical reviewers.",
    risks: ["Not production authenticated", "No live-system reconciliation"],
  },
  {
    id: "FS-002",
    title: "Role-aware command center",
    stage: "Built",
    visibility: "Pilot only",
    owner: "Product + operations",
    problem: "Different stakeholders need different operational focus without separate copies of the workflow.",
    outcome: "The same case spine is viewed through role-scoped demo workspaces and focus indicators.",
    users: ["Intake coordinator", "Program director", "Compliance reviewer"],
    workflow: "Role lens -> queue -> escalation -> case workspace",
    placement: ["app/src/workspaces/CommandCenter.tsx", "app/src/domain/roles.ts", "app/src/domain/roleFocus.ts"],
    dependencies: ["Demo role configuration", "Case clocks", "Synthetic cases"],
    artifacts: ["Persona UX documentation", "Role invariant tests"],
    rollout: "Local role selector only; selector is not authorization",
    evidence: "Role scope is modeled and tested. Production RBAC/RLS: Unverified.",
    nextAction: "Define the first verified principal-to-role mapping before any live data use.",
    risks: ["Frontend scoping can be mistaken for security", "Role taxonomy needs stakeholder review"],
  },
  {
    id: "FS-003",
    title: "Product Studio feature registry",
    stage: "Candidate",
    visibility: "Internal",
    owner: "Platform owner",
    problem: "Current product maps and roadmap notes are useful but disconnected from build placement, release gates, and decision history.",
    outcome: "One concept record connects product intent, technical placement, rollout state, visibility, evidence, and next action.",
    users: ["Platform owner", "Product operations", "Engineering lead"],
    workflow: "Observe -> map -> decide -> build -> release -> learn",
    placement: ["New Product Studio workspace", "Future feature registry service", "Future audit history"],
    dependencies: ["Verified auth", "Object-level authorization", "Integration adapters"],
    artifacts: ["Synthetic registry in this prototype", "Product Studio evaluation docs"],
    rollout: "Read-only local prototype; no publication or flag mutation",
    evidence: "This slice is implemented. Production readiness: Unverified.",
    nextAction: "Validate the registry fields and visibility model with the platform owner.",
    risks: ["Static records are not canonical product state", "External sources may drift"],
  },
  {
    id: "FS-004",
    title: "Production auth, tenancy, and release controls",
    stage: "Parked",
    visibility: "Private",
    owner: "Platform + security",
    problem: "The prototype does not yet enforce production identity, tenant boundaries, feature-flag authority, or release approval.",
    outcome: "Authorized leaders can control product state with server-side policy, audit, rollout, and rollback evidence.",
    users: ["Platform owner", "Security reviewer", "Release manager"],
    workflow: "Principal -> policy -> preview -> approval -> rollout -> rollback",
    placement: ["API/auth service foundations", "Future Product Studio backend", "Deployment platform"],
    dependencies: ["Verified identity provider", "RLS/tenant policy", "Feature-flag adapter", "Observability"],
    artifacts: ["API service foundations", "Architecture ADR roadmap"],
    rollout: "Not started",
    evidence: "Production deployment and live integrations: Not started.",
    nextAction: "Resolve auth provider, tenancy strategy, and release authority as explicit architecture decisions.",
    risks: ["High security impact", "Must not be simulated as a local admin control"],
  },
];

const decisionLog = [
  { id: "DEC-001", decision: "Keep Studio read-only until verified authorization and audit controls exist.", state: "Review gate", owner: "Platform + security" },
  { id: "DEC-002", decision: "Treat public roadmap content as a sanitized projection, never as the feature registry.", state: "Recorded", owner: "Product owner" },
  { id: "DEC-003", decision: "Do not send concept text, PHI, or security detail to third-party analytics by default.", state: "Recorded", owner: "Privacy + product" },
];

const lensCopy: Record<Lens, { label: string; description: string }> = {
  Product: { label: "Product lens", description: "Problem, users, workflow, outcome, and the decision still needed." },
  Build: { label: "Build lens", description: "Technical placement, dependencies, linked artifacts, and implementation readiness." },
  Run: { label: "Run lens", description: "Visibility, rollout state, evidence, risks, and the next review action." },
};

function stageClass(stage: FeatureConcept["stage"]): string {
  if (stage === "Built") return "studio-stage studio-stage-good";
  if (stage === "Candidate") return "studio-stage studio-stage-info";
  return "studio-stage studio-stage-warn";
}

function lensDetails(concept: FeatureConcept, lens: Lens): Array<{ label: string; value: string | string[] }> {
  if (lens === "Product") {
    return [
      { label: "Problem", value: concept.problem },
      { label: "Who it affects", value: concept.users },
      { label: "Workflow", value: concept.workflow },
      { label: "Expected outcome", value: concept.outcome },
    ];
  }
  if (lens === "Build") {
    return [
      { label: "Technical placement", value: concept.placement },
      { label: "Dependencies", value: concept.dependencies },
      { label: "Linked artifacts", value: concept.artifacts },
      { label: "Build boundary", value: "Prototype evidence only; no production integration is implied." },
    ];
  }
  return [
    { label: "Visibility", value: concept.visibility },
    { label: "Rollout", value: concept.rollout },
    { label: "Evidence", value: concept.evidence },
    { label: "Risks", value: concept.risks },
  ];
}

export function ProductStudio() {
  const [lens, setLens] = useState<Lens>("Product");
  const [filter, setFilter] = useState<RegistryFilter>("All");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(featureConcepts[0].id);

  const filteredConcepts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return featureConcepts.filter((concept) => {
      const matchesFilter = filter === "All" || (filter === "Active" ? concept.stage !== "Parked" : concept.stage === "Parked");
      const matchesQuery = !normalizedQuery || `${concept.id} ${concept.title} ${concept.owner}`.toLowerCase().includes(normalizedQuery);
      return matchesFilter && matchesQuery;
    });
  }, [filter, query]);

  const selectedConcept = featureConcepts.find((concept) => concept.id === selectedId) ?? filteredConcepts[0] ?? featureConcepts[0];
  const details = lensDetails(selectedConcept, lens);

  return (
    <div className="stack studio-shell">
      <section className="panel studio-hero">
        <div className="studio-hero-copy">
          <span className="studio-eyebrow">INTERNAL PRODUCT CONTROL / SYNTHETIC DEMO REGISTRY</span>
          <h2>Make the product inspectable.</h2>
          <p>Product Studio connects what Clarity is, where it plugs in, who it affects, and what evidence should inform the next human decision.</p>
        </div>
        <div className="studio-safety-note">
          <ShieldCheck size={17} />
          <span>Read-only prototype. Demo role scoping is not authentication. No PHI, publication, flag mutation, or deployment control is available here.</span>
        </div>
      </section>

      <section className="status-strip studio-status-strip" aria-label="Product Studio registry summary">
        <div><span className="label">Registry records</span><strong>{featureConcepts.length}</strong><span className="subtext">one connected concept list</span></div>
        <div><span className="label">Built surfaces</span><strong>{featureConcepts.filter((concept) => concept.stage === "Built").length}</strong><span className="subtext">prototype evidence only</span></div>
        <div><span className="label">Decision gates</span><strong>{decisionLog.length}</strong><span className="subtext">human review required</span></div>
        <div><span className="label">Measurements</span><strong>None</strong><span className="subtext">No measurements found</span></div>
      </section>

      <section className="panel studio-lens-panel">
        <div className="panel-title">
          <div className="icon-title"><Layers3 size={18} /><div><h2>Three connected lenses</h2><p>{lensCopy[lens].description}</p></div></div>
          <div className="studio-lens-tabs" role="tablist" aria-label="Product Studio lens">
            {(Object.keys(lensCopy) as Lens[]).map((option) => (
              <button className={lens === option ? "studio-lens-tab active" : "studio-lens-tab"} key={option} type="button" role="tab" aria-selected={lens === option} onClick={() => setLens(option)}>{option}</button>
            ))}
          </div>
        </div>
        <div className="studio-lens-callout"><Workflow size={16} /><strong>{lensCopy[lens].label}</strong><span>{lensCopy[lens].description}</span></div>
      </section>

      <section className="studio-workspace">
        <section className="panel studio-registry-panel">
          <div className="panel-title">
            <div className="icon-title"><Map size={18} /><div><h2>Feature registry</h2><p>Lifecycle views share one synthetic concept record.</p></div></div>
            <span className="studio-private-label"><LockKeyhole size={14} /> Internal</span>
          </div>
          <label className="studio-search"><Search size={15} /><span className="sr-only">Search registry</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by concept, ID, or owner" /></label>
          <div className="studio-filter-row" aria-label="Registry filters">
            {(["All", "Active", "Parking Lot"] as RegistryFilter[]).map((option) => (
              <button className={filter === option ? "studio-filter active" : "studio-filter"} key={option} type="button" onClick={() => setFilter(option)}>{option}</button>
            ))}
          </div>
          <div className="studio-registry-list">
            {filteredConcepts.map((concept) => (
              <button className={selectedConcept.id === concept.id ? "studio-registry-row selected" : "studio-registry-row"} key={concept.id} type="button" onClick={() => setSelectedId(concept.id)}>
                <span className="studio-registry-row-head"><span className="mono">{concept.id}</span><span className={stageClass(concept.stage)}>{concept.stage}</span></span>
                <strong>{concept.title}</strong>
                <span className="subtext">Owner: {concept.owner} · {concept.visibility}</span>
              </button>
            ))}
            {!filteredConcepts.length ? <p className="subtext studio-no-results">No concepts match this filter.</p> : null}
          </div>
        </section>

        <section className="panel studio-inspector-panel" aria-live="polite">
          <div className="panel-title">
            <div><span className="studio-eyebrow">{selectedConcept.id}</span><h2>{selectedConcept.title}</h2><p>{selectedConcept.owner} · {selectedConcept.visibility}</p></div>
            <span className={stageClass(selectedConcept.stage)}>{selectedConcept.stage}</span>
          </div>
          <div className="studio-detail-list">
            {details.map((detail) => (
              <div className="studio-detail" key={detail.label}>
                <span className="label">{detail.label}</span>
                {Array.isArray(detail.value) ? <ul>{detail.value.map((value) => <li key={value}>{value}</li>)}</ul> : <p>{detail.value}</p>}
              </div>
            ))}
          </div>
          <div className="studio-next-action"><ArrowUpRight size={17} /><div><span className="label">Next human action</span><p>{selectedConcept.nextAction}</p></div></div>
        </section>
      </section>

      <section className="grid-two studio-bottom-grid">
        <section className="panel">
          <div className="panel-title"><div className="icon-title"><GitBranch size={18} /><div><h2>Decision history</h2><p>Feedback informs decisions; it does not make them automatically.</p></div></div></div>
          <div className="studio-decision-list">
            {decisionLog.map((item) => <article className="studio-decision-row" key={item.id}><div><span className="mono">{item.id}</span><strong>{item.decision}</strong></div><span className="studio-stage studio-stage-info">{item.state}</span><small>{item.owner}</small></article>)}
          </div>
        </section>
        <section className="panel">
          <div className="panel-title"><div className="icon-title"><LockKeyhole size={18} /><div><h2>Visibility boundary</h2><p>Audience projection is separate from feature activation.</p></div></div></div>
          <dl className="studio-visibility-list">
            <div><dt>Internal</dt><dd>Product and build context for authorized demo roles.</dd></div>
            <div><dt>Advisor</dt><dd>Sanitized workflow and structured feedback only.</dd></div>
            <div><dt>Public</dt><dd>Not enabled in this prototype; no commitment dates implied.</dd></div>
            <div><dt>Security detail</dt><dd>Not exposed; production policy is [Unverified].</dd></div>
          </dl>
        </section>
      </section>
    </div>
  );
}
