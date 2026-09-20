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

type TestUser = ReturnType<typeof userEvent.setup>;

async function openWorkspace(user: TestUser, group: string, workspace: string) {
  const groupButton = screen.getByRole("button", { name: group });
  await user.click(groupButton);
  await user.click(screen.getByRole("button", { name: workspace }));
}

async function selectPersona(user: TestUser, persona: string) {
  const summary = screen.getByText(/Demo view ·/);
  const details = summary.closest("details");
  if (details && !details.open) await user.click(summary);
  await user.selectOptions(screen.getByLabelText("Prototype persona"), persona);
}

describe("App smoke", () => {
  beforeEach(async () => {
    await resetAppState();
  });

  it("groups Crisis Ops into six primary destinations instead of a flat workspace list", async () => {
    const user = userEvent.setup();
    render(<App />);
    expect((await screen.findAllByText("Packet Ready Demo D")).length).toBeGreaterThan(0);

    for (const group of ["Home", "Cases", "Intake", "Review", "Placement", "More"]) {
      expect(screen.getByRole("button", { name: group })).toBeInTheDocument();
    }

    expect(screen.getByRole("heading", { name: "Command Center" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Command Center" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Case Queue" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Guided Intake" })).not.toBeInTheDocument();
    expect(screen.queryByText("Prototype case")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Cases" }));
    expect(screen.getByRole("button", { name: "Case Queue" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Intake" }));
    expect(screen.getByRole("button", { name: "New Case" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Guided Intake" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Evidence Review" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Case Queue" })).not.toBeInTheDocument();

    expect(screen.getByText(/Demo view ·/)).toBeInTheDocument();
    expect(screen.queryByText("Viewing as")).not.toBeInTheDocument();
  });

  it("loads seed cases and creates a new local case", async () => {
    const user = userEvent.setup();
    render(<App />);
    expect((await screen.findAllByText("Packet Ready Demo D")).length).toBeGreaterThan(0);

    await openWorkspace(user, "Intake", "New Case");
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
    await openWorkspace(user, "More", "Custody Ledger");
    await user.click(screen.getByRole("button", { name: /Verify custody chain/i }));
    expect(await screen.findByText("Verified")).toBeInTheDocument();
  });

  it("issues an OPC and executes a sealed PEC for a fresh case in Legal Status", async () => {
    const user = userEvent.setup();
    render(<App />);
    expect((await screen.findAllByText("Packet Ready Demo D")).length).toBeGreaterThan(0);

    await openWorkspace(user, "Intake", "New Case");
    await user.clear(screen.getByLabelText(/Patient token/i));
    await user.type(screen.getByLabelText(/Patient token/i), "Legal Flow Demo");
    await user.click(screen.getByRole("button", { name: /Create case/i }));
    expect(await screen.findByText("Legal Flow Demo")).toBeInTheDocument();

    await openWorkspace(user, "Review", "Legal Status");
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

    await openWorkspace(user, "More", "Mock Admit Lab");
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

    await selectPersona(user, "executive");
    await openWorkspace(user, "More", "Product Studio");
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

    await selectPersona(user, "executive");
    await openWorkspace(user, "More", "IOP Reconciliation");
    expect(await screen.findByRole("heading", { name: "Attendance reconciliation review" })).toBeInTheDocument();
    expect(screen.getByText(/does not determine clinical compliance or billing eligibility/)).toBeInTheDocument();
  });

  it("shares one session: signing in via the sidebar leaves IOP Reconciliation already signed in", async () => {
    const user = userEvent.setup();
    render(<App />);
    expect((await screen.findAllByText("Packet Ready Demo D")).length).toBeGreaterThan(0);

    await user.click(screen.getByText("Verified session"));
    await user.type(screen.getByLabelText("Development assertion"), "syn-assert-api-physician-dev");
    await user.click(screen.getByRole("button", { name: "Sign in" }));
    expect(await screen.findByRole("button", { name: "Sign out" })).toBeInTheDocument();
    expect(apiLogin).toHaveBeenCalledExactlyOnceWith("syn-assert-api-physician-dev");

    await selectPersona(user, "executive");
    await openWorkspace(user, "More", "IOP Reconciliation");

    const signedInNotice = await screen.findByText(/Signed in as/);
    expect(signedInNotice).toHaveTextContent("Synthetic Physician Reviewer");
    expect(screen.queryByLabelText("Development assertion")).not.toBeInTheDocument();
    expect(apiLogin).toHaveBeenCalledOnce();
  });

  it("removes the local demo patient identity from the parent shell while Case Status is active", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click((await screen.findAllByRole("button", { name: /Packet Ready Demo D/i }))[0]!);
    expect(screen.getByRole("heading", { name: "Packet Ready Demo D" })).toBeInTheDocument();
    expect(screen.getByText("Prototype case")).toBeInTheDocument();

    await selectPersona(user, "central");
    await openWorkspace(user, "Cases", "Case Status");

    // The workspace title is stable whether or not a session exists.
    expect(await screen.findByRole("heading", { name: "Case Status" })).toBeInTheDocument();

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

    // Aggregate Case Queue intentionally omits selected-case chrome; opening Case Overview restores it.
    await openWorkspace(user, "Cases", "Case Queue");
    expect(screen.getAllByRole("heading", { name: "Case Queue" }).length).toBeGreaterThan(0);
    expect(screen.queryByRole("heading", { name: "Packet Ready Demo D" })).not.toBeInTheDocument();

    await openWorkspace(user, "Cases", "Case Overview");
    expect(screen.getByRole("heading", { name: "Packet Ready Demo D" })).toBeInTheDocument();
  });
});

/**
 * Which demo personas expose the Case Status workspace.
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

describe("Case Status workspace visibility per demo persona", () => {
  beforeEach(async () => {
    await resetAppState();
  });

  it.each(PERSONAS_WITH_ACCESS)("persona %s can open the Case Status workspace", async (persona) => {
    const user = userEvent.setup();
    render(<App />);
    // The shell loads its seed state asynchronously; the role picker appears with it.
    await screen.findByText(/Demo view ·/);
    await selectPersona(user, persona);

    await user.click(screen.getByRole("button", { name: "Cases" }));
    const navButton = screen.getByRole("button", { name: "Case Status" });
    expect(navButton).toBeInTheDocument();

    // The grant is only real if the workspace actually opens.
    await user.click(navButton);
    expect(await screen.findByRole("heading", { name: "Case Status" })).toBeInTheDocument();
  });

  it.each(PERSONAS_WITHOUT_ACCESS)("persona %s is not offered the Case Status workspace", async (persona) => {
    const user = userEvent.setup();
    render(<App />);
    // The shell loads its seed state asynchronously; the role picker appears with it.
    await screen.findByText(/Demo view ·/);
    await selectPersona(user, persona);

    const casesGroup = screen.queryByRole("button", { name: "Cases" });
    if (casesGroup) await user.click(casesGroup);
    expect(screen.queryByRole("button", { name: "Case Status" })).not.toBeInTheDocument();
  });

  it("covers every persona, so adding one forces this test to be updated", () => {
    const listed = [...PERSONAS_WITH_ACCESS, ...PERSONAS_WITHOUT_ACCESS].sort();
    expect(roles.map((role) => role.id).sort()).toEqual(listed);
  });
});
