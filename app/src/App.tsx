import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { App as CrisisOpsApp } from "./CrisisOpsApp";
import { StatusBadge } from "./components/StatusBadge";
import { useAuth } from "./domain/AuthContext";
import { SignInForm } from "./components/SignInForm";
import { OperatingAssurance } from "./workspaces/OperatingAssurance";

/**
 * Router-addressable (Phase 2A, commit 1): "/" and "/assurance" used to be
 * one component's local `module` toggle, split into two route components so
 * the boundary is a real URL.
 */
export function CrisisOpsRoute() {
  return <CrisisOpsApp />;
}

export function AssuranceRoute() {
  const navigate = useNavigate();
  // Shared with every other application area via AuthProvider (Phase 2A,
  // commit 4) -- signing in here or anywhere else is now one session.
  const { principal, logout } = useAuth();

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-block">
          <span className="brand-mark">C</span>
          <div>
            <h1>Clarity</h1>
            <p>Operating Assurance</p>
          </div>
        </div>

        <button className="secondary-button" type="button" onClick={() => navigate("/")}>
          <ArrowLeft size={16} /> Crisis Ops
        </button>

        <div className="role-note" style={{ marginTop: 12 }}>
          Platform module switch only. Crisis Ops demo-role selections never grant Operating Assurance authority.
        </div>

        <details className="session-panel" open>
          <summary>Verified session{principal ? " — active" : ""}</summary>
          {principal ? (
            <>
              <p>Operating Assurance actions use the database-backed principal below. Backend permissions remain authoritative.</p>
              <dl>
                <dt>Principal</dt><dd>{principal.displayName} ({principal.userId})</dd>
                <dt>Organization</dt><dd>{principal.organizationId}</dd>
                <dt>Verified roles</dt><dd>{principal.roles.join(", ") || "none"}</dd>
                <dt>Expires</dt><dd>{new Date(principal.expiresAt).toLocaleTimeString()}</dd>
              </dl>
              <button className="secondary-button" type="button" onClick={() => void logout()}>Sign out</button>
            </>
          ) : (
            <>
              <p>Sign in with a synthetic dev assertion printed by <code>npm run api:dev</code>. No demo role can substitute for this session. Signing in here also signs in Crisis Ops, IOP Reconciliation, and RevOps.</p>
              <SignInForm placeholder="syn-assert-oa-reviewer-dev" />
            </>
          )}
        </details>
      </aside>

      <main className="main-surface">
        <header className="topbar">
          <div>
            <span className="label">Governed assurance workspace</span>
            <h2>Operating Assurance</h2>
          </div>
          <div className="topbar-badges">
            <StatusBadge tone="info">Verified API boundary</StatusBadge>
            <StatusBadge tone="warn">Human review required</StatusBadge>
          </div>
        </header>
        <section className="content-region">
          <OperatingAssurance principal={principal} />
        </section>
      </main>
    </div>
  );
}
