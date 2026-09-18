import { fireEvent, render, screen, cleanup } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { RevOpsPricing } from "./RevOpsPricing";
import { apiRevOps } from "../domain/api";
import type { PersistedRateReleaseRecord } from "../../../packages/rev-ops-service/src/pricing";

vi.mock("../domain/api", async () => {
  const actual = await vi.importActual<typeof import("../domain/api")>("../domain/api");
  return { ...actual, apiRevOps: vi.fn() };
});

const RELEASE: PersistedRateReleaseRecord = {
  releaseId: "LA-IP-TEST-FRONTEND",
  publisher: "Louisiana Department of Health",
  sourceUrl: "https://example.test/la-inpatient.xlsx",
  sha256: "a".repeat(64),
  retrievedAt: "2026-09-09T12:22:45.404Z",
  effectiveFrom: "2026-07-01T00:00:00.000Z",
  effectiveThrough: "2026-12-31T00:00:00.000Z",
  payload: {
    sheet: "Current Providers 7.1.2026",
    rowCount: 1,
    rows: [
      {
        providerId: "1234567890",
        facilityName: "Synthetic Reference Hospital",
        hospitalType: "Free Standing Psychiatric",
        rateType: "Free Standing Psychiatric",
        perDiemCents: 45000,
        rowEffectiveFrom: "2026-07-01",
        medicareNumber: null,
        sourceRow: 12,
      },
    ],
  },
};

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

it("fetches the persisted rate-release registry and prices a scenario against it", async () => {
  vi.mocked(apiRevOps).mockImplementation(async (path: string) => {
    if (path.startsWith("/rate-releases")) return [RELEASE];
    throw new Error(`Unhandled mock path: ${path}`);
  });

  render(<RevOpsPricing />);

  await screen.findByText(
    /1 public active-provider rows across 1 published release, recorded in the shared rate-release registry \(ADR-0021\)\./,
  );
  expect(apiRevOps).toHaveBeenCalledWith(
    "/rate-releases?programMethod=LA_MEDICAID_INPATIENT_PER_DIEM",
  );

  fireEvent.change(screen.getByLabelText("Reference provider (scenario only)"), {
    target: { value: "1234567890" },
  });
  fireEvent.change(screen.getByLabelText("First eligible service day"), {
    target: { value: "2026-07-01" },
  });
  fireEvent.change(screen.getByLabelText("Last eligible service day (inclusive)"), {
    target: { value: "2026-07-01" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Calculate published per-diem subtotal" }));

  expect(await screen.findByText(/Scenario subtotal:/)).toHaveTextContent("$450.00");
});

it("surfaces the API error instead of a blank state when the registry fetch fails", async () => {
  vi.mocked(apiRevOps).mockRejectedValue(Object.assign(new Error("api_unreachable"), { name: "ApiError" }));

  render(<RevOpsPricing />);

  expect(await screen.findByRole("button", { name: "Calculate published per-diem subtotal" })).toBeDisabled();
});
