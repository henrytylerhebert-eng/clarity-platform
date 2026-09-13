import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { App as CrisisOpsApp } from "./CrisisOpsApp";
import { StatusBadge } from "./components/StatusBadge";
import {
  apiLogin,
  apiLogout,
  describeApiError,
  type VerifiedPrincipal,
} from "./domain/api";
import { OperatingAssurance } from "./workspaces/OperatingAssurance";

/**
 * Router-addressable now (Phase 2A, commit 1): "/" and "/assurance" used to
 * be one component's local `module` toggle. Splitting them into two route
 * components makes the boundary a real URL — auth still local here; that
 * migrates in a later commit.
 */
export function CrisisOpsRoute() {
  const navigate = useNavigate();
  return (
    <>
      <button
        className="secondary-button"
        type="button"
        onClick={() => navigate("/assurance")}
        style={{ position: "fixed", right: 18, top: 14, zIndex: 50, display: "inline-flex", gap: 7, alignItems: "center" }}
      >
        <ShieldCheck size={16} /> Operating Assurance
      </button>
      <CrisisOpsApp />
    </>
  );
}

export function AssuranceRoute() {
  const navigate = useNavigate();
  const [principal, setPrincipal] = useState<VerifiedPrincipal | null>(null);
  const [assertion, setAssertion] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);

  async function handleLogin() {
    setLoginError(null);
    try {
      setPrincipal(await apiLogin(assertion.trim()));
      setAssertion("");
    } catch (error) {
      setPrincipal(null);
      setLoginError(describeApiError(error));
    }
  }

  async function handleLogout() {
    try {
      await apiLogout();
    } finally {
      setPrincipal(null);
    }
  }

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
              <button className="secondary-button" type="button" onClick={handleLogout}>Sign out</button>
            </>
          ) : (
            <>
              <p>Sign in with a synthetic dev assertion printed by <code>npm run api:dev</code>. No demo role can substitute for this session.</p>
              <label className="session-login">
                Dev assertion
                <input
                  aria-label="Operating Assurance dev assertion"
                  value={assertion}
                  onChange={(event) => setAssertion(event.target.value)}
                  placeholder="syn-assert-oa-reviewer-dev"
                />
              </label>
              <button
                className="secondary-button"
                type="button"
                disabled={assertion.trim().length < 16}
                onClick={handleLogin}
              >
                Sign in (verified session)
              </button>
              {loginError ? <p className="inline-warning" role="alert">{loginError}</p> : null}
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
