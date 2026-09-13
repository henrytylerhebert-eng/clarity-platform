import { fireEvent, render, screen, waitFor, cleanup } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { IopReconciliation } from "./IopReconciliation";
import { apiIopReconciliation } from "../domain/api";

vi.mock("../domain/api", async () => {
  const actual = await vi.importActual<typeof import("../domain/api")>("../domain/api");
  return {
    ...actual,
    apiLogin: vi.fn(async () => ({
      displayName: "Synthetic Rev Ops Admin",
      userId: "synthetic-revops-admin",
      organizationId: "synthetic-org-api-dev",
      roles: ["ORGANIZATION_ADMIN"],
      sessionId: "test-session",
      expiresAt: "2099-01-01T00:00:00.000Z",
    })),
    apiLogout: vi.fn(async () => {}),
    apiIopReconciliation: vi.fn(),
  };
});

interface Store {
  id: string;
  revision: number;
  payload: { reconciliation: unknown };
  exceptionReviews: { issueKey: string; disposition: string; reason: string; reviewerId: string; reviewedAt: string }[];
  closeReceipt: null | {
    reviewerId: string; reviewedAt: string; reason: string; sourceCutoffAt: string; issueCount: number; reviewedCount: number;
  };
}

let store: Store | null;

beforeEach(() => {
  store = null;
  vi.mocked(apiIopReconciliation).mockImplementation(async (path: string, body?: unknown) => {
    if (path === "/reconciliation-imports" && body) {
      const request = body as { reconciliation: unknown };
      store = { id: "iop-import-1", revision: 1, payload: { reconciliation: request.reconciliation }, exceptionReviews: [], closeReceipt: null };
      return { import: { id: store.id } };
    }
    if (/^\/reconciliation-imports\/[^/]+$/.test(path)) return structuredClone(store);
    const reviewMatch = /^\/reconciliation-imports\/[^/]+\/issues\/([^/]+)\/reviews$/.exec(path);
    if (reviewMatch && body && store) {
      const request = body as { disposition: string; reason: string };
      store.exceptionReviews.push({
        issueKey: decodeURIComponent(reviewMatch[1]),
        disposition: request.disposition,
        reason: request.reason,
        reviewerId: "synthetic-revops-admin",
        reviewedAt: "2028-02-08T13:00:00.000Z",
      });
      return { review: {} };
    }
    if (/^\/reconciliation-imports\/[^/]+\/close$/.test(path) && body && store) {
      const request = body as { reason: string };
      store.closeReceipt = {
        reviewerId: "synthetic-revops-admin",
        reviewedAt: "2028-02-08T14:00:00.000Z",
        reason: request.reason,
        sourceCutoffAt: "2028-02-07T23:59:59.999Z",
        issueCount: store.exceptionReviews.length,
        reviewedCount: store.exceptionReviews.length,
      };
      return { receipt: {} };
    }
    throw new Error(`Unhandled mock path: ${path}`);
  });
});
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const ISSUE_KEYS = [
  "enrollment:ENR_003:plan_missing",
  "attendance:ATT_002:note_audit_missing",
  "attendance:ATT_002:charge_missing",
  "attendance:ATT_004:charge_missing",
  "charge:CHARGE_005:emr_billable_missing",
];

it("requires a verified session before it will submit the loaded candidate", () => {
  render(<IopReconciliation />);
  fireEvent.click(screen.getByRole("button", { name: "Load synthetic source import" }));
  expect(screen.getByText("IOP_IMPORT_001")).toBeVisible();
  expect(screen.getByText("5 will need review after import")).toBeVisible();
  expect(screen.getByRole("button", { name: "Submit synthetic import" })).toBeDisabled();
  expect(screen.getByText("Sign in above to submit this import.")).toBeVisible();
});

it("imports through the real API, requires an authenticated review of every derived exception, then closes", async () => {
  render(<IopReconciliation />);

  fireEvent.click(screen.getByRole("button", { name: "Load synthetic source import" }));

  fireEvent.change(screen.getByLabelText("Development assertion"), {
    target: { value: "syn-assert-revops-admin-dev" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Sign in" }));
  await screen.findByText("Synthetic Rev Ops Admin", { exact: false });

  fireEvent.click(screen.getByRole("button", { name: "Submit synthetic import" }));
  await screen.findByText("iop-import-1");
  expect(screen.getByText("Blocked")).toBeVisible();

  for (const issueKey of ISSUE_KEYS) {
    fireEvent.change(screen.getByLabelText(`Review reason for ${issueKey}`), {
      target: { value: "Synthetic reviewer note." },
    });
    fireEvent.click(screen.getByRole("button", { name: `Record review for ${issueKey}` }));
    await waitFor(() => expect(screen.queryByLabelText(`Review reason for ${issueKey}`)).not.toBeInTheDocument());
  }

  expect(await screen.findByText("Ready")).toBeVisible();
  expect(screen.getByText("All derived gaps have reviewed exception records.")).toBeVisible();

  fireEvent.change(screen.getByLabelText("Close reason"), {
    target: { value: "All synthetic exceptions reviewed." },
  });
  fireEvent.click(screen.getByRole("button", { name: "Record reviewed close" }));

  expect(await screen.findByText("synthetic-revops-admin")).toBeVisible();
  expect(screen.getByText("5 reviewed of 5 derived")).toBeVisible();
});
