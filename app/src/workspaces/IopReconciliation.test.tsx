import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { IopReconciliation } from "./IopReconciliation";
import syntheticImport from "../../../docs/product/evidence/IOP_ATTENDANCE_RECONCILIATION_SYNTHETIC_IMPORT.json";
import {
  apiIopReconciliationClose,
  apiIopReconciliationGet,
  apiIopReconciliationImport,
  apiIopReconciliationReview,
  type IopReconciliationImportDetailDto,
  type VerifiedPrincipal,
} from "../domain/api";

vi.mock("../domain/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../domain/api")>();
  return {
    ...actual,
    apiIopReconciliationImport: vi.fn(),
    apiIopReconciliationGet: vi.fn(),
    apiIopReconciliationReview: vi.fn(),
    apiIopReconciliationClose: vi.fn(),
  };
});

const principal: VerifiedPrincipal = {
  userId: "syn-user-1",
  organizationId: "syn-org-1",
  displayName: "Synthetic reviewer",
  roles: ["ORGANIZATION_ADMIN"],
  sessionId: "syn-session-1",
  expiresAt: "2099-01-01T00:00:00.000Z",
};

const ISSUE_KEYS = [
  "enrollment:ENR_003:plan_missing",
  "attendance:ATT_002:note_audit_missing",
  "attendance:ATT_002:charge_missing",
  "attendance:ATT_004:charge_missing",
  "charge:CHARGE_005:emr_billable_missing",
];

function baseRecord(): IopReconciliationImportDetailDto {
  const reconciliation = { ...syntheticImport.reconciliation, exceptionReviews: [] };
  return {
    id: "syn-import-1",
    organizationId: principal.organizationId,
    facilityId: "synthetic-iop-facility-api-dev",
    programId: syntheticImport.reconciliation.programId,
    integrationId: "syn-integration-1",
    idempotencyKey: "syn-idem-import-1",
    requestHash: "syn-hash-1",
    snapshotHash: "syn-snapshot-1",
    exportedAt: syntheticImport.source.exportedAt,
    cutoffAt: syntheticImport.source.cutoffAt,
    sourceFileName: syntheticImport.source.fileName,
    payload: {
      facilityId: "synthetic-iop-facility-api-dev",
      programId: syntheticImport.reconciliation.programId,
      integrationKey: "SYNTHETIC_IOP_PROGRAM",
      idempotencyKey: "syn-idem-import-1",
      source: {
        fileName: syntheticImport.source.fileName,
        exportedAt: syntheticImport.source.exportedAt,
        cutoffAt: syntheticImport.source.cutoffAt,
      },
      sourceRecords: [],
      reconciliation,
    },
    revision: 1,
    acceptedBy: principal.userId,
    acceptedAt: "2028-02-08T15:00:00.000Z",
    exceptionReviews: [],
    closeReceipt: null,
    integration: { integrationKey: "SYNTHETIC_IOP_PROGRAM", label: "Synthetic IOP program source" },
  } as unknown as IopReconciliationImportDetailDto;
}

let record: IopReconciliationImportDetailDto;

beforeEach(() => {
  record = baseRecord();

  vi.mocked(apiIopReconciliationImport).mockImplementation(async () => ({
    import: record,
    replayed: false,
  }));

  vi.mocked(apiIopReconciliationGet).mockImplementation(async () => ({
    ...record,
    exceptionReviews: [...record.exceptionReviews],
    closeReceipt: record.closeReceipt,
  }));

  vi.mocked(apiIopReconciliationReview).mockImplementation(async (id, issueKey, input) => {
    const review = {
      id: `syn-review-${issueKey}`,
      importId: id,
      idempotencyKey: input.idempotencyKey,
      issueKey,
      disposition: input.disposition,
      reason: input.reason,
      reviewerId: principal.userId,
      reviewedAt: "2028-02-08T13:00:00.000Z",
    };
    record = { ...record, revision: record.revision + 1, exceptionReviews: [...record.exceptionReviews, review] };
    return { review, replayed: false };
  });

  vi.mocked(apiIopReconciliationClose).mockImplementation(async (id, input) => {
    const receipt = {
      id: "syn-receipt-1",
      importId: id,
      idempotencyKey: input.idempotencyKey,
      reviewerId: principal.userId,
      reviewedAt: "2028-02-08T14:00:00.000Z",
      reason: input.reason,
      sourceCutoffAt: record.cutoffAt,
      issueCount: ISSUE_KEYS.length,
      reviewedCount: record.exceptionReviews.length,
    };
    record = { ...record, closeReceipt: receipt };
    return { receipt, replayed: false };
  });
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

it("requires a verified session before import, review, or close", () => {
  render(<IopReconciliation apiPrincipal={null} />);
  expect(screen.getByRole("alert")).toHaveTextContent(/sign in with a verified api session/i);
  expect(screen.queryByRole("button", { name: "Load synthetic source import" })).not.toBeInTheDocument();
  expect(apiIopReconciliationImport).not.toHaveBeenCalled();
});

it("imports the synthetic sample, records a review for every derived issue, and closes the reconciliation", async () => {
  render(<IopReconciliation apiPrincipal={principal} />);

  fireEvent.click(screen.getByRole("button", { name: "Load synthetic source import" }));
  await waitFor(() => expect(screen.getByText("syn-import-1")).toBeVisible());
  expect(apiIopReconciliationImport).toHaveBeenCalledTimes(1);
  expect(screen.getByText("synthetic-iop-facility-api-dev")).toBeVisible();

  const closeButton = () => screen.getByRole("button", { name: "Record reviewed close" });
  expect(closeButton()).toBeDisabled();

  for (const issueKey of ISSUE_KEYS) {
    const item = screen.getByText(issueKey).closest("li")!;
    fireEvent.change(within(item).getByLabelText(`Reason for ${issueKey}`), {
      target: { value: `Synthetic review reason for ${issueKey}` },
    });
    fireEvent.click(within(item).getByRole("button", { name: "Record review" }));
    await waitFor(() => expect(within(item).queryByRole("button", { name: "Record review" })).not.toBeInTheDocument());
    expect(within(item).getByText(/synthetic review reason/i)).toBeVisible();
  }

  expect(screen.getByText("All derived gaps have reviewed exception records.")).toBeVisible();
  fireEvent.change(screen.getByLabelText("Close reason"), {
    target: { value: "Reviewed and reconciled for the source cutoff." },
  });
  expect(closeButton()).toBeEnabled();
  fireEvent.click(closeButton());

  await waitFor(() => expect(screen.getByText("5 reviewed of 5 derived")).toBeVisible());
  expect(screen.getByText("Reviewed and reconciled for the source cutoff.")).toBeVisible();
});
