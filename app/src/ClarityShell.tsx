import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "./domain/AuthContext";

/**
 * The minimum shared shell (docs/ux/CLARITY_GLOBAL_SHELL_SPEC.md): one
 * persistent Clarity identity, one application-area switcher (replacing
 * the floating "Operating Assurance" button, the sidebar "Rev Ops" link,
 * and the RevOps wordmark link with one consistent mechanism), and one
 * authenticated-identity display, read from the same AuthProvider every
 * area now shares.
 *
 * Deliberately minimal: each area's own internal sidebar/header/banner
 * (Crisis Ops's "Clarity / Crisis Ops v0.2" brand block, RevOps's own
 * header, Operating Assurance's own sidebar) is untouched below this bar.
 * That produces a small, known redundancy -- two "Clarity" mentions
 * stacked on first load -- accepted deliberately for this slice rather
 * than editing any area's own screen content. See
 * docs/ux/CLARITY_UX_MIGRATION_PRECONDITIONS.md's "known limitations."
 */
const AREAS = [
  { to: "/", label: "Crisis Ops" },
  { to: "/assurance", label: "Operating Assurance" },
  { to: "/rev-ops", label: "Revenue Operations" },
] as const;

export function ClarityShell() {
  const { principal, logout } = useAuth();

  return (
    <div className="clarity-shell">
      <div className="clarity-shell-bar" role="navigation" aria-label="Clarity application areas">
        <span className="clarity-shell-mark">CLARITY</span>
        <nav className="clarity-shell-areas">
          {AREAS.map((area) => (
            <NavLink
              key={area.to}
              to={area.to}
              end={area.to === "/"}
              className={({ isActive }: { isActive: boolean }) => `clarity-shell-area${isActive ? " active" : ""}`}
            >
              {area.label}
            </NavLink>
          ))}
        </nav>
        <div className="clarity-shell-identity">
          {principal ? (
            <>
              <span>{principal.displayName} <small>{principal.organizationId}</small></span>
              <button type="button" className="clarity-shell-signout" onClick={() => void logout()}>
                Sign out
              </button>
            </>
          ) : (
            <span className="clarity-shell-signed-out">Not signed in</span>
          )}
        </div>
      </div>
      <Outlet />
    </div>
  );
}
