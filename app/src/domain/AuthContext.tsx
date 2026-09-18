import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { apiLogin, apiLogout, describeApiError, type VerifiedPrincipal } from "./api";

/**
 * Phase 2A: the one shared session-truth context. Wraps apiLogin/apiLogout
 * from ./api verbatim -- no change to the network layer, token storage, or
 * server contract. Before this, four surfaces (Crisis Ops sidebar, IOP
 * Reconciliation, Operating Assurance, RevOps) each held their own copy of
 * this exact state, so signing in on one left the other three still showing
 * "Sign in." See docs/ux/CLARITY_SESSION_CONTINUITY.md.
 *
 * Deliberately NOT in here: role selection (Crisis Ops's demo persona
 * picker stays local to CrisisOpsApp, unauthenticated, unaffected), tenant
 * selection (none exists -- organizationId is read-only, derived from
 * `principal`), and workspace context (unaffected by this provider).
 */
interface AuthContextValue {
  principal: VerifiedPrincipal | null;
  busy: boolean;
  error: string | null;
  login: (assertion: string) => Promise<VerifiedPrincipal>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [principal, setPrincipal] = useState<VerifiedPrincipal | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = useCallback(async (assertion: string) => {
    setBusy(true);
    setError(null);
    try {
      const verified = await apiLogin(assertion);
      setPrincipal(verified);
      return verified;
    } catch (cause) {
      setPrincipal(null);
      setError(describeApiError(cause));
      throw cause;
    } finally {
      setBusy(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiLogout();
    } finally {
      setPrincipal(null);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ principal, busy, error, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
