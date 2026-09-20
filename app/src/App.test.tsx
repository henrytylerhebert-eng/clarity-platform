import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { CrisisOpsRoute } from "./App";
import { AuthProvider } from "./domain/AuthContext";
import { apiLogin } from "./domain/api";
import { resetAppState } from "./domain/storage";
import { roles } from "./domain/roles";

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

function App() {
  return (
    <MemoryRouter>
      <AuthProvider>
        <CrisisOpsRoute />
      </AuthProvider>
    </MemoryRouter>
  );
}

describe("App smoke", () => {
  beforeEach(async () => {
    await resetAppState();
  });

  it("loads seed cases and creates a new local case", async () => {
    const user = userEvent.setup();
    render(<App />);
    expect((await screen.findAllByText("Packet Ready Demo D")).length).toBeGreaterThan(0);

    await user.click(screen.getByRole("button", { name: "Intake" }));
    await user.click(screen.getByRole("button", { name: /New Case/i }));
    await user.clear(screen.getByLabelText(/Patient token/i));
    await user.type(screen.getByLabelText(/Patient token/i), "Smoke Demo");
    await user.click(screen.getByRole("button", { name: /Create case/i }));

    expect(await screen.findByText("Smoke Demo")).toBeInTheDocument();
    expect(screen.getByText(/clinical screening can begin/i)).toBeInTheDocument();
  });

  it("shows custody verification for seeded packet case", async () => {
    const user = userEvent.setup();
    render(<App />);
    expect((await screen.findAllByText("Packet Ready Demo D")).length).toBeGreaterThan(0);
    await user.click(screen.getByRole("button", { name: "More" }));
    await user.click(screen.getByRole("button", { name: /History & custody/i }));
    await user.click(screen.getByRole("button", { name: /Verify custody chain/i }));
    expect(await screen.findByText("Verified")).toBeInTheDocument();
  });

  it("issues an OPC and executes a sealed PEC for a fresh case in Legal Status", async () => {
    const user = userEvent.setup();
    render(<App />);
    expect((await screen.findAllByText("Packet Ready Demo D")).length).toBeGreaterThan(0);

    await user.click(screen.getByRole("button", { name: /New Case/i }));
    await user.clear(screen.getByLabelText(/Patient token/i));
    await user.type(screen.getByLabelText(/Patient token/i), "Legal Flow Demo");
    await user.click(screen.getByRole("button", { name: /Create case/i }));
    expect(await screen.findByText("Legal Flow Demo")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Review" }));
    await user.click(screen.getByRole("button", { name: /Legal Status/i }));
    expect(await screen.findByRole("heading", { name: /Order for Protective Custody/i })).toBeInTheDocument();

    await user.type(screen.getByPlaceholderText("Name, agency"), "Sgt. Broussard");
    await user.type(screen.getByPlaceholderText(/Officer, family member/i), "Responding officer");
    await user.type(screen.getByPlaceholderText(/Facts observed firsthand/i), "Subject stated intent to harm self and refused voluntary transport at the scene.");
    await user.click(screen.getAllByRole("checkbox", { name: /Dangerous to self/i })[0]);
    await user.click(screen.getByRole("button", { name: /Issue OPC/i }));
    expect(await screen.findByText("OPC issued")).toBeInTheDocument();

    await user.type(screen.getByPlaceholderText("Name, credentials"), "Dr. Thibodeaux");
    // datetime-local values are local wall-clock time with no timezone designator, so build the
    // string from local date parts rather than toISOString() (which is UTC and would misrepresent
    // "an hour ago" once new Date(value) re-parses it as local time).
    const recentDate = new Date(Date.now() - 60 * 60 * 1000);
    const pad = (n: number) => String(n).padStart(2, "0");
    const recentExam = `${recentDate.getFullYear()}-${pad(recentDate.getMonth() + 1)}-${pad(recentDate.getDate())}T${pad(recentDate.getHours())}:${pad(recentDate.getMinutes())}`;
    fireEvent.change(screen.getByLabelText(/Actual examination date/i), { target: { value: recentExam } });
    expect(screen.getByText(/Within the statutory window/i)).toBeInTheDocument();

    const findingCheckbox = screen.getByRole("checkbox", { name: /Dangerous to self/i });
    await user.click(findingCheckbox);
    expect(findingCheckbox).toBeChecked();
    const conditionCheckbox = screen.getByRole("checkbox", { name: /Unwilling to seek voluntary admission/i });
    await user.click(conditionCheckbox);
    expect(conditionCheckbox).toBeChecked();
    await user.type(
      screen.getByPlaceholderText(/Time-stamped observations/i),
      "Acute suicidal ideation with plan; refuses safety planning; requires inpatient stabilization.",
    );
    await user.click(screen.getByRole("button", { name: /Review certificate for signature/i }));

    // Review-and-confirm gate: sealing stays disabled until the signer acknowledges identity.
    expect(await screen.findByText(/Review before signing/i)).toBeInTheDocument();
    const sealButton = screen.getByRole("button", { name: /Sign, attest & seal certificate/i });
    expect(sealButton).toBeDisabled();
    await user.click(screen.getByRole("checkbox", { name: /I am Dr. Thibodeaux/i }));
    expect(sealButton).toBeEnabled();
    await user.click(sealButton);

    expect(await screen.findByText("PEC executed & sealed")).toBeInTheDocument();
  });

  it("keeps the mock inpatient cohort separate from canonical cases and exposes review-gated drafts", async () => {
    const user = userEvent.setup();
    render(<App />);
    expect((await screen.findAllByText("Packet Ready Demo D")).length).toBeGreaterThan(0);

    await user.click(screen.getByRole("button", { name: "More" }));
    await user.click(screen.getByRole("button", { name: "Mock Admit Lab" }));
    expect(await screen.findByRole("heading", { name: "Mock Inpatient Admit Lab" })).toBeInTheDocument();
    expect(screen.getByText("Synthetic mock-use only")).toBeInTheDocument();
    expect(screen.getAllByText("Leslie Knope").length).toBeGreaterThan(0);

    await user.click(screen.getByRole("button", { name: /Tom Haverford/ }));
    expect(screen.getAllByText("Employer-sponsored EPO").length).toBeGreaterThan(0);
    await user.click(screen.getByRole("tab", { name: "Decision path" }));
    expect(screen.getByText("Dual medical-behavioral review; psychiatric admission if medically cleared and behavioral-health need remains primary.")).toBeInTheDocument();
    await user.click(screen.getByRole("tab", { name: "UR / chart draft" }));
    expect(screen.getByRole("heading", { name: "Draft chart and UR summary" })).toBeInTheDocument();
    expect(screen.getByText("Do not copy this training draft into a real chart or authorization request.")).toBeInTheDocument();
  });

  it("opens the read-only Product Studio registry for the program director demo role", async () => {
    const user = userEvent.setup();
    render(<App />);
    expect((await screen.findAllByText("Packet Ready Demo D")).length).toBeGreaterThan(0);

    await user.selectOptions(screen.getByRole("combobox"), "executive");
    await user.click(screen.getByRole("button", { name: "More" }));
    await user.click(screen.getByRole("button", { name: "Product Studio" }));
    expect(await screen.findByRole("heading", { name: "Make the product inspectable." })).toBeInTheDocument();
    expect(screen.getByText(/Read-only prototype\. Demo role scoping is not authentication/)).toBeInTheDocument();
    await user.click(screen.getByRole("tab", { name: "Build" }));
    expect(screen.getByText("Technical placement")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Parking Lot" }));
    expect(screen.getByRole("heading", { name: "Production auth, tenancy, and release controls" })).toBeInTheDocument();
  });

  it("opens the synthetic IOP reconciliation workspace for the program director demo role", async () => {
    const user = userEvent.setup();
    render(<App />);
    expect((await screen.findAllByText("Packet Ready Demo D")).length).toBeGreaterThan(0);

    await user.selectOptions(screen.getByRole("combobox"), "executive");
    await user.click(screen.getByRole("button", { name: "More" }));
    await user.click(screen.getByRole("button", { name: "IOP Reconciliation" }));
    expect(await screen.findByRole("heading", { name: "Attendance reconciliation review" })).toBeInTheDocument();
    expect(screen.getByText(/does not determine clinical compliance or billing eligibility/)).toBeInTheDocument();
  });

  it("shares one session: signing in via the sidebar leaves IOP Reconciliation already signed in", async () => {
    const user = userEvent.setup();
    render(<App />);
    expect((await screen.findAllByText("Packet Ready Demo D")).length).toBeGreaterThan(0);

    await user.click(screen.getByText("Session & identity"));
    await user.type(screen.getByLabelText("Development assertion"), "syn-assert-api-physician-dev");
    await user.click(screen.getByRole("button", { name: "Sign in" }));
    expect(await screen.findByRole("button", { name: "Sign out" })).toBeInTheDocument();
    expect(apiLogin).toHaveBeenCalledExactlyOnceWith("syn-assert-api-physician-dev");

    await user.selectOptions(screen.getByRole("combobox"), "executive");
    await user.click(screen.getByRole("button", { name: "More" }));
    await user.click(screen.getByRole("button", { name: "IOP Reconciliation" }));

    const signedInNotice = await screen.findByText(/Signed in as/);
    expect(signedInNotice).toHaveTextContent("Synthetic Physician Reviewer");
    expect(screen.queryByLabelText("Development assertion")).not.toBeInTheDocument();
    expect(apiLogin).toHaveBeenCalledOnce();
  });

  it("removes the local demo patient identity from the parent shell while governed Case status is active", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click((await screen.findAllByRole("button", { name: /Packet Ready Demo D/i }))[0]!);
    expect(screen.getByRole("heading", { name: "Packet Ready Demo D" })).toBeInTheDocument();
    expect(screen.getByText("Prototype case")).toBeInTheDocument();

    await user.selectOptions(screen.getByRole("combobox"), "central");
    await user.click(screen.getByRole("button", { name: "Case status" }));

    // The workspace title is stable whether or not a session exists.
    expect((await screen.findAllByRole("heading", { name: "Case status" })).length).toBeGreaterThan(0);

    // The demo case chrome is absent from the DOM, not merely hidden.
    expect(screen.queryByRole("heading", { name: "Packet Ready Demo D" })).not.toBeInTheDocument();
    expect(screen.queryByText("Prototype case")).not.toBeInTheDocument();

    // Signed out: the shared sign-in form is offered and no case can be requested.
    expect(screen.queryByRole("button", { name: "Open case" })).not.toBeInTheDocument();
    // Scoped to the workspace: the app shell has its own sign-in control.
    await user.click(within(screen.getByRole("main")).getByRole("button", { name: "Sign in" }));

    // Signed in: the governed lookup appears and the demo identity is still absent.
    expect(await screen.findByRole("button", { name: "Open case" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Packet Ready Demo D" })).not.toBeInTheDocument();

    // Leaving Access restores the demo case chrome.
    await user.click(screen.getByRole("button", { name: /Case queue/i }));
    expect(screen.getByRole("heading", { name: "Cases" })).toBeInTheDocument();
    expect(screen.getAllByText("Packet Ready Demo D").length).toBeGreaterThan(0);
  });
});

/**
 * Which demo personas expose the Access Snapshot workspace.
 *
 * These lists are deliberately hard-coded rather than derived from `roles`: an expectation
 * computed from the same data it checks would move with the change and pass even if a grant
 * were deleted. The exhaustiveness test below keeps them honest when a persona is added.
 *
 * Demo personas are NOT an authorization boundary — the API decides by the verified
 * principal's roles (ACCESS_CASE_READ_POLICY). This covers navigation visibility only.
 */
const PERSONAS_WITH_ACCESS = ["all", "central", "clinician", "ur", "compliance", "executive"] as const;
const PERSONAS_WITHOUT_ACCESS = ["field", "facility", "nurse"] as const;

describe("Case status workspace visibility per demo persona", () => {
  beforeEach(async () => {
    await resetAppState();
  });

  it.each(PERSONAS_WITH_ACCESS)("persona %s can open the governed Case status workspace", async (persona) => {
    const user = userEvent.setup();
    render(<App />);
    // The shell loads its seed state asynchronously; the role picker appears with it.
    await user.selectOptions(await screen.findByRole("combobox"), persona);

    const navButton = screen.getByRole("button", { name: "Case status" });
    expect(navButton).toBeInTheDocument();

    // The grant is only real if the workspace actually opens.
    await user.click(navButton);
    expect((await screen.findAllByRole("heading", { name: "Case status" })).length).toBeGreaterThan(0);
  });

  it.each(PERSONAS_WITHOUT_ACCESS)("persona %s is not offered the governed Case status workspace", async (persona) => {
    const user = userEvent.setup();
    render(<App />);
    // The shell loads its seed state asynchronously; the role picker appears with it.
    await user.selectOptions(await screen.findByRole("combobox"), persona);

    expect(screen.queryByRole("button", { name: "Case status" })).not.toBeInTheDocument();
  });

  it("covers every persona, so adding one forces this test to be updated", () => {
    const listed = [...PERSONAS_WITH_ACCESS, ...PERSONAS_WITHOUT_ACCESS].sort();
    expect(roles.map((role) => role.id).sort()).toEqual(listed);
  });
});
