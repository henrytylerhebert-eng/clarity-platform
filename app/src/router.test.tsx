import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createMemoryRouter, Navigate, RouterProvider } from "react-router-dom";
import { AuthProvider } from "./domain/AuthContext";
import { ClarityShell } from "./ClarityShell";
import { CrisisOpsRoute, AssuranceRoute } from "./App";
import { RevOps } from "./workspaces/RevOps";
import { apiLogin } from "./domain/api";
import { resetAppState } from "./domain/storage";

/**
 * Phase 2A router coverage. Mirrors main.tsx's route tree exactly (see that
 * file) but through createMemoryRouter instead of createBrowserRouter, so
 * back/forward/deep-linking/invalid-route behavior is testable without a
 * real browser. main.tsx itself is not imported here -- it mounts to a real
 * #root element as an import-time side effect, which would crash under
 * jsdom with no DOM to mount into.
 */
function buildRouter(initialEntries: string[]) {
  return createMemoryRouter(
    [
      {
        element: <ClarityShell />,
        children: [
          { path: "/", element: <CrisisOpsRoute /> },
          { path: "/assurance", element: <AssuranceRoute /> },
          { path: "/rev-ops", element: <RevOps /> },
          { path: "*", element: <Navigate to="/" replace /> },
        ],
      },
    ],
    { initialEntries },
  );
}

function renderApp(initialEntries: string[]) {
  const router = buildRouter(initialEntries);
  render(
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>,
  );
  return router;
}

vi.mock("./domain/api", async () => {
  const actual = await vi.importActual<typeof import("./domain/api")>("./domain/api");
  return {
    ...actual,
    apiLogin: vi.fn(async () => ({
      displayName: "Synthetic Physician Reviewer",
      userId: "synthetic-user-api-physician",
      organizationId: "synthetic-org-api-dev",
      roles: ["PHYSICIAN_REVIEWER"],
      sessionId: "test-session",
      expiresAt: "2099-01-01T00:00:00.000Z",
    })),
    apiLogout: vi.fn(async () => {}),
  };
});

describe("canonical router", () => {
  beforeEach(async () => {
    await resetAppState();
    vi.clearAllMocks();
  });
  afterEach(() => vi.clearAllMocks());

  it("renders Crisis Ops at the default route", async () => {
    renderApp(["/"]);
    expect((await screen.findAllByText("Packet Ready Demo D")).length).toBeGreaterThan(0);
  });

  it("renders Operating Assurance directly via deep link, with no full reload required", async () => {
    renderApp(["/assurance"]);
    expect(await screen.findByText("Governed assurance workspace")).toBeInTheDocument();
  });

  it("renders RevOps directly via deep link, preserving the existing /rev-ops bookmark", async () => {
    renderApp(["/rev-ops"]);
    expect(await screen.findByText("RevOps MVP")).toBeInTheDocument();
  });

  it("redirects an invalid route to Crisis Ops instead of showing a dead end", async () => {
    const router = renderApp(["/no-such-place"]);
    await waitFor(() => expect(router.state.location.pathname).toBe("/"));
    expect((await screen.findAllByText("Packet Ready Demo D")).length).toBeGreaterThan(0);
  });

  it("supports back and forward between application areas without a full reload", async () => {
    const router = renderApp(["/"]);
    await screen.findAllByText("Packet Ready Demo D");

    await router.navigate("/assurance");
    await waitFor(() => expect(router.state.location.pathname).toBe("/assurance"));
    expect(await screen.findByText("Governed assurance workspace")).toBeInTheDocument();

    await router.navigate(-1);
    await waitFor(() => expect(router.state.location.pathname).toBe("/"));
    expect((await screen.findAllByText("Packet Ready Demo D")).length).toBeGreaterThan(0);

    await router.navigate(1);
    await waitFor(() => expect(router.state.location.pathname).toBe("/assurance"));
    expect(await screen.findByText("Governed assurance workspace")).toBeInTheDocument();
  });

  it("keeps one session across Crisis Ops and Operating Assurance reached via router navigation", async () => {
    const user = userEvent.setup();
    const router = renderApp(["/"]);
    await screen.findAllByText("Packet Ready Demo D");

    await user.click(screen.getByText("Session & identity"));
    await user.type(screen.getByLabelText("Development assertion"), "syn-assert-api-physician-dev");
    await user.click(screen.getByRole("button", { name: "Sign in" }));
    await waitFor(() => expect(screen.queryByLabelText("Development assertion")).not.toBeInTheDocument());
    expect(apiLogin).toHaveBeenCalledExactlyOnceWith("syn-assert-api-physician-dev");

    await router.navigate("/assurance");
    await waitFor(() => expect(router.state.location.pathname).toBe("/assurance"));

    expect(await screen.findByText(/Verified principal: Synthetic Physician Reviewer/)).toBeInTheDocument();
    expect(screen.queryByLabelText("Development assertion")).not.toBeInTheDocument();
    expect(apiLogin).toHaveBeenCalledOnce();
  });

  it("preserves tenant and role context across the same navigation", async () => {
    const user = userEvent.setup();
    const router = renderApp(["/"]);
    await screen.findAllByText("Packet Ready Demo D");
    await user.click(screen.getByText("Session & identity"));
    await user.type(screen.getByLabelText("Development assertion"), "syn-assert-api-physician-dev");
    await user.click(screen.getByRole("button", { name: "Sign in" }));
    await waitFor(() => expect(screen.queryByLabelText("Development assertion")).not.toBeInTheDocument());

    await router.navigate("/assurance");
    await waitFor(() => expect(router.state.location.pathname).toBe("/assurance"));

    // organizationId (tenant) is server-derived and carries over unchanged;
    // it is never a user selection, on either surface. It appears twice --
    // the shared shell's identity display, and Operating Assurance's own
    // role-note -- both reading the one shared principal.
    await waitFor(async () => expect((await screen.findAllByText(/synthetic-org-api-dev/)).length).toBeGreaterThanOrEqual(2));
  });
});
