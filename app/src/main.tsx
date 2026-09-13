import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, Navigate, RouterProvider } from "react-router-dom";
import { CrisisOpsRoute, AssuranceRoute } from "./App";
import { RevOps } from "./workspaces/RevOps";
import "./styles.css";

// Phase 2A, commit 1: one canonical router replaces the raw pathname check
// that used to decide between <App/> and <RevOps/>, and the client-state
// toggle that used to decide between Crisis Ops and Operating Assurance
// inside <App/>. See docs/ux/CLARITY_NAVIGATION_ARCHITECTURE.md.
export const router = createBrowserRouter([
  { path: "/", element: <CrisisOpsRoute /> },
  { path: "/assurance", element: <AssuranceRoute /> },
  { path: "/rev-ops", element: <RevOps /> },
  { path: "*", element: <Navigate to="/" replace /> },
]);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
