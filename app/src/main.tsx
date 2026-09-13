import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, Navigate, RouterProvider } from "react-router-dom";
import { AuthProvider } from "./domain/AuthContext";
import { ClarityShell } from "./ClarityShell";
import { CrisisOpsRoute, AssuranceRoute } from "./App";
import { RevOps } from "./workspaces/RevOps";
import "./styles.css";

// Phase 2A, commit 3: ClarityShell is the router's layout route, wrapping
// every application area in one AuthProvider. Crisis Ops (and IOP
// Reconciliation, nested inside it) now consume that shared session; see
// docs/ux/CLARITY_SESSION_CONTINUITY.md. Operating Assurance and RevOps are
// migrated in the two commits that follow this one.
export const router = createBrowserRouter([
  {
    element: <ClarityShell />,
    children: [
      { path: "/", element: <CrisisOpsRoute /> },
      { path: "/assurance", element: <AssuranceRoute /> },
      { path: "/rev-ops", element: <RevOps /> },
      { path: "*", element: <Navigate to="/" replace /> },
    ],
  },
]);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </StrictMode>,
);
