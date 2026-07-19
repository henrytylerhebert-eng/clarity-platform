import { ArrowRight, Filter, History, ListTree, Network, ShieldAlert } from "lucide-react";
import { useMemo, useState } from "react";
import { StatusBadge } from "../components/StatusBadge";
import {
  MAP_WORKSTREAMS,
  TARGET_LABELS,
  TARGET_TRANSITIONS,
  buildCaseDependencyMap,
  buildSyntheticDependencyQueue,
  filterDependencyNodes,
  primaryBlocker,
  type BlockingClass,
  type DependencyNode,
  type TargetTransition,
} from "../domain/caseDependencyMap";
import type { WorkspaceId } from "../domain/roles";
import type { AppState } from "../domain/types";

interface Props {
  state: AppState;
  caseId: string;
  selectedTarget: TargetTransition;
  onTargetChange: (target: TargetTransition) => void;
  onCaseSelect: (caseId: string) => void;
  onNavigateWorkspace: (workspace: WorkspaceId) => void;
}

type ViewMode = "map" | "list";

const blockingLabels: Record<BlockingClass, string> = {
  "hard-blocker": "Hard blocker",
  "review-gate": "Review gate",
  "external-wait": "External wait",
  warning: "Warning",
  satisfied: "Satisfied",
  "not-applicable": "Not applicable",
};

function toneForNode(node: DependencyNode): "neutral" | "good" | "warn" | "danger" | "info" {
  if (node.blockingClass === "satisfied") return "good";
  if (node.blockingClass === "hard-blocker") return "danger";
  if (node.blockingClass === "review-gate" || node.blockingClass === "external-wait") return "warn";
  if (node.blockingClass === "not-applicable") return "neutral";
  return "info";
}

function summarizeRestricted(node: DependencyNode): string {
  return node.restrictedDetail ? "Restricted detail placeholder shown for this demo role." : node.source;
}

export function CaseDependencyMap({
  state,
  caseId,
  selectedTarget,
  onTargetChange,
  onCaseSelect,
  onNavigateWorkspace,
}: Props) {
  const [viewMode, setViewMode] = useState<ViewMode>("map");
  const [workstream, setWorkstream] = useState("all");
  const [ownerRole, setOwnerRole] = useState("all");
  const [status, setStatus] = useState("all");
  const [waitType, setWaitType] = useState("all");
  const [queueSize, setQueueSize] = useState<5 | 25 | 100>(5);
  const map = useMemo(() => buildCaseDependencyMap(state, caseId, selectedTarget), [state, caseId, selectedTarget]);
  const visibleNodes = filterDependencyNodes(map.nodes, { workstream, ownerRole, status, waitType });
  const blocker = primaryBlocker(map.nodes);
  const owners = [...new Set(map.nodes.map((node) => node.ownerRole))];
  const dependencyQueue = useMemo(
    () => buildSyntheticDependencyQueue(state, selectedTarget, queueSize),
    [state, selectedTarget, queueSize],
  );

  return (
    <section className="readiness-shell stack" aria-labelledby="dependency-map-heading">
      <div className="panel readiness-hero">
        <div className="panel-title">
          <div>
            <div className="icon-title"><Network size={19} /><h2 id="dependency-map-heading">Case Dependency Map</h2></div>
            <p>
              Read-only synthetic projection for protective-custody readiness. The map reads; existing
              workspaces write; the evaluator recalculates.
            </p>
          </div>
          <div className="mode-toggle" aria-label="Dependency view mode">
            <button className={viewMode === "map" ? "mode-option active" : "mode-option"} type="button" onClick={() => setViewMode("map")}>
              Map
            </button>
            <button className={viewMode === "list" ? "mode-option active" : "mode-option"} type="button" onClick={() => setViewMode("list")}>
              List
            </button>
          </div>
        </div>

        <div className="readiness-controls">
          <label>
            Case
            <select value={caseId} onChange={(event) => onCaseSelect(event.target.value)}>
              {state.cases.map((caseRecord) => (
                <option key={caseRecord.id} value={caseRecord.id}>
                  {caseRecord.patientToken.displayName} — {caseRecord.currentStage}
                </option>
              ))}
            </select>
          </label>
          <label>
            Target transition
            <select value={selectedTarget} onChange={(event) => onTargetChange(event.target.value as TargetTransition)}>
              {TARGET_TRANSITIONS.map((target) => (
                <option key={target} value={target}>{TARGET_LABELS[target]}</option>
              ))}
            </select>
          </label>
          <label>
            Scale scenario
            <select value={queueSize} onChange={(event) => setQueueSize(Number(event.target.value) as 5 | 25 | 100)}>
              <option value={5}>5 cases</option>
              <option value={25}>25 cases</option>
              <option value={100}>100 cases</option>
            </select>
          </label>
        </div>

        <div className="readiness-summary">
          <article>
            <span className="label">Primary blocker</span>
            <strong>{blocker?.label ?? "No blocker data available"}</strong>
            <p>{blocker?.explanation ?? "Insufficient evidence for this target in synthetic state."}</p>
          </article>
          <article>
            <span className="label">Target</span>
            <strong>{TARGET_LABELS[selectedTarget]}</strong>
            <p>{map.nodes.length} target-specific item(s), {map.edges.length} dependency edge(s).</p>
          </article>
          <article>
            <span className="label">Freshness and scope</span>
            <strong>{map.dataFreshness}</strong>
            <p>{map.permissionScope}; {map.rulesOrProjectionVersion}.</p>
          </article>
        </div>

        <div className="readiness-warning" role="note">
          <ShieldAlert size={17} />
          <span>{map.warnings[1]} {map.warnings[2]}</span>
        </div>
      </div>

      <div className="panel">
        <div className="panel-title">
          <div className="icon-title"><Filter size={18} /><h2>Filters</h2></div>
          <p aria-live="polite">{visibleNodes.length} visible of {map.nodes.length} target items.</p>
        </div>
        <div className="readiness-controls">
          <label>
            Workstream
            <select value={workstream} onChange={(event) => setWorkstream(event.target.value)}>
              <option value="all">All workstreams</option>
              {MAP_WORKSTREAMS.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>
          <label>
            Owner
            <select value={ownerRole} onChange={(event) => setOwnerRole(event.target.value)}>
              <option value="all">All owners</option>
              {owners.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>
          <label>
            Status
            <select value={status} onChange={(event) => setStatus(event.target.value)}>
              <option value="all">All statuses</option>
              {Object.entries(blockingLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              <option value="stale">Stale</option>
              <option value="unknown">Unknown</option>
            </select>
          </label>
          <label>
            Wait type
            <select value={waitType} onChange={(event) => setWaitType(event.target.value)}>
              <option value="all">Any wait</option>
              <option value="internal">Internal action</option>
              <option value="external">External party</option>
              <option value="none">No wait</option>
            </select>
          </label>
        </div>
      </div>

      {viewMode === "map" ? (
        <div className="panel dependency-canvas" aria-label="Visual dependency map">
          {visibleNodes.map((node, index) => (
            <article className={`dependency-node dependency-node-${node.blockingClass}`} key={node.id}>
              <div className="dependency-node-head">
                <span className="label">{node.workstream}</span>
                <StatusBadge tone={toneForNode(node)}>{blockingLabels[node.blockingClass]}</StatusBadge>
              </div>
              <h3>{node.label}</h3>
              <p>{node.explanation}</p>
              <dl className="readiness-meta">
                <dt>Status</dt><dd>{node.status}</dd>
                <dt>Owner</dt><dd>{node.ownerRole}</dd>
                <dt>Source</dt><dd>{summarizeRestricted(node)}</dd>
              </dl>
              <button className="secondary-button" type="button" onClick={() => onNavigateWorkspace(node.resolutionWorkspace)}>
                Open {node.resolutionWorkspace}
              </button>
              {index < visibleNodes.length - 1 ? <ArrowRight className="dependency-arrow" size={18} aria-hidden="true" /> : null}
            </article>
          ))}
        </div>
      ) : (
        <div className="panel">
          <div className="panel-title">
            <div className="icon-title"><ListTree size={18} /><h2>Structured Equivalent</h2></div>
            <p>Contains the same node data as the visual map for screen-reader and keyboard workflows.</p>
          </div>
          <div className="table-wrap">
            <table className="readiness-table" aria-label="Case dependency structured list">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Workstream</th>
                  <th>Status</th>
                  <th>Owner</th>
                  <th>Dependencies</th>
                  <th>Source</th>
                  <th>Resolve in</th>
                </tr>
              </thead>
              <tbody>
                {visibleNodes.map((node) => (
                  <tr key={node.id}>
                    <td data-label="Item">
                      <strong>{node.label}</strong>
                      <span className="subtext">{node.explanation}</span>
                    </td>
                    <td data-label="Workstream">{node.workstream}</td>
                    <td data-label="Status"><StatusBadge tone={toneForNode(node)}>{node.status}</StatusBadge></td>
                    <td data-label="Owner">{node.ownerRole}<span className="subtext">{node.assignedUser}</span></td>
                    <td data-label="Dependencies">{node.dependencyIds.length ? node.dependencyIds.join(", ") : "None"}</td>
                    <td data-label="Source">{summarizeRestricted(node)}</td>
                    <td data-label="Resolve in">
                      <button className="link-button" type="button" onClick={() => onNavigateWorkspace(node.resolutionWorkspace)}>
                        Open {node.resolutionWorkspace}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="grid-two">
        <section className="panel">
          <div className="panel-title">
            <div className="icon-title"><History size={18} /><h2>What Changed</h2></div>
            <p>Deterministic synthetic digest; no collaboration runtime is implemented.</p>
          </div>
          <ul className="gap-list">
            {map.changeDigest.map((item) => (
              <li key={item.id}>
                <StatusBadge tone={item.blockerChange === "new-blocker" ? "danger" : "info"}>{item.blockerChange}</StatusBadge>
                <span>{item.summary}<span className="subtext">{item.workstream} — {item.actorOrSource}</span></span>
              </li>
            ))}
          </ul>
        </section>

        <section className="panel">
          <div className="panel-title">
            <h2>Activity and Audit</h2>
            <p>User-facing history is separate from compliance-grade provenance.</p>
          </div>
          <div className="audit-split">
            <article>
              <h3>User activity</h3>
              <ul className="check-list">
                {state.auditLogs.filter((log) => log.caseId === caseId).slice(0, 3).map((log) => (
                  <li key={log.id}>{log.action} by {log.actor}</li>
                ))}
                {state.auditLogs.filter((log) => log.caseId === caseId).length === 0 ? <li>No user-facing activity recorded.</li> : null}
              </ul>
            </article>
            <article>
              <h3>Audit / provenance</h3>
              <ul className="check-list">
                <li>{map.edges.length} dependency edge(s) derived from local state.</li>
                <li>{map.unresolvedContradictions.length || "No"} unresolved contradiction(s) surfaced.</li>
                <li>{map.warnings[0]}</li>
              </ul>
            </article>
          </div>
        </section>
      </div>

      <section className="panel">
        <div className="panel-title">
          <h2>Queue Scale Check</h2>
          <p>{dependencyQueue.length} deterministic synthetic case map(s), no production measurement.</p>
        </div>
        <div className="readiness-scale-grid">
          {dependencyQueue.slice(0, 12).map((item, index) => {
            const queueBlocker = primaryBlocker(item.nodes);
            const caseRecord = state.cases[index % state.cases.length];
            return (
              <button className="scale-case" key={`${item.caseId}-${index}`} type="button" onClick={() => onCaseSelect(item.caseId)}>
                <strong>{caseRecord.patientToken.displayName}</strong>
                <span>{queueBlocker?.label ?? "No blocker data available"}</span>
              </button>
            );
          })}
        </div>
        <p className="panel-footer">No measurements found for baseline time-to-blocker, task completion, or handoff comprehension.</p>
      </section>
    </section>
  );
}
