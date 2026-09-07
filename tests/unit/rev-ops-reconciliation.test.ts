import { expect, it } from "vitest";
import type { AuthenticatedPrincipal } from "@clarity/domain-contracts";
import {
  applyRevOpsCommand,
  createRevOpsState,
} from "../../packages/rev-ops-service/src/index.js";
import { planReconciliation } from "../../packages/rev-ops-service/src/reconciliation.js";
import { parseRevOpsUpload } from "../../packages/api-service/src/revOpsImport.js";
import type { RevOpsCommand } from "../../packages/domain-contracts/src/revOps.js";

const actor: AuthenticatedPrincipal = {
  userId: "synthetic-admin",
  organizationId: "synthetic-org",
  roles: ["ORGANIZATION_ADMIN"],
  displayName: "Synthetic",
  sessionId: "synthetic-session",
  expiresAt: new Date("2028-03-01"),
};
function fixture() {
  const state = createRevOpsState({
    name: "Synthetic",
    unit: "Geriatric",
    timezone: "America/Chicago",
    costCenterLabel: "Cost center",
    costCenterOptions: ["Inpatient"],
  });
  const apply = (c: RevOpsCommand) =>
    applyRevOpsCommand(
      state,
      c,
      actor,
      { kind: "manual", name: "Synthetic source" },
      "2028-02-08T12:00:00Z",
    );
  apply({
    action: "defineField",
    scope: "actual",
    type: "text",
    label: "Review",
    required: false,
    archived: false,
    options: [],
  });
  const field = state.customFields![0]!;
  apply({
    action: "actual",
    date: "2028-02-06",
    count: 8,
    fields: [{ fieldId: field.id, value: "Reviewed" }],
  });
  return { state, apply, field };
}
const upload = (csv: string) => ({
  kind: "actuals" as const,
  name: "review.csv",
  mapping: {},
  content: Buffer.from(csv).toString("base64"),
});
const header = "activity_date,patient_days,Field: Review\n";
it("classifies validated rows and plans only inserts/corrections with source-row alignment", async () => {
  const { state } = fixture();
  const parsed = await parseRevOpsUpload(
    upload(header + "2028-02-06,9,Pending\n2028-02-07,0,Reviewed\n"),
    state,
  );
  expect(parsed.rows.map((r) => r.status)).toEqual(["conflict", "new"]);
  const before = structuredClone(state);
  const plan = planReconciliation(
    state,
    parsed.rows,
    {
      period: "2028-02",
      importKey: parsed.importKey,
      decisions: [
        {
          row: 2,
          date: "2028-02-06",
          choice: "keep",
          reason: "Signed census takes precedence",
        },
      ],
    },
    parsed.importKey,
  );
  expect(plan.counts).toEqual({
    inserted: 1,
    corrected: 0,
    unchanged: 0,
    kept: 1,
  });
  expect(plan.commands).toEqual([
    expect.objectContaining({ action: "actual", date: "2028-02-07", count: 0 }),
  ]);
  expect(plan.commandRows).toEqual([3]);
  expect(plan.rows[0]).toMatchObject({
    outcome: "kept",
    saved: { count: 8 },
    incoming: { count: 9 },
  });
  expect(plan.patientDayChange).toBe(0);
  expect(state).toEqual(before);
});
it("requires accountable metadata-only clearing and retains archived values on corrections", async () => {
  const { state, field, apply } = fixture();
  const parsed = await parseRevOpsUpload(
    upload(header + "2028-02-06,8,\n"),
    state,
  );
  expect(parsed.rows[0]?.status).toBe("conflict");
  const plan = planReconciliation(
    state,
    parsed.rows,
    {
      period: "2028-02",
      importKey: parsed.importKey,
      decisions: [
        {
          row: 2,
          date: "2028-02-06",
          choice: "use",
          reason: "Clear unverified review",
        },
      ],
    },
    parsed.importKey,
  );
  expect(plan.commands[0]).toMatchObject({
    action: "correct",
    fields: [],
    count: 8,
  });
  expect(plan.patientDayChange).toBe(0);
  const { version: _version, ...definition } = field;
  apply({ action: "defineField", ...definition, archived: true });
  const archive = await parseRevOpsUpload(
    upload("activity_date,patient_days\n2028-02-06,9\n"),
    state,
  );
  const correction = planReconciliation(
    state,
    archive.rows,
    {
      period: "2028-02",
      importKey: archive.importKey,
      decisions: [
        {
          row: 2,
          date: "2028-02-06",
          choice: "use",
          reason: "Correct count only",
        },
      ],
    },
    archive.importKey,
  );
  apply(correction.commands[0]!);
  expect(state.actuals["2028-02-06"]?.at(-1)?.fields).toEqual(
    state.actuals["2028-02-06"]?.[0]?.fields,
  );
});
it.each([
  "2028-02-06,,Reviewed\n",
  "2028-02-06,9,[formula or object: export reviewed values]\n",
  "2028-02-06,9,Reviewed\n2028-02-06,10,Reviewed\n",
])(
  "cannot convert invalid rows into accepted keep decisions: %s",
  async (csv) => {
    const { state } = fixture();
    const parsed = await parseRevOpsUpload(upload(header + csv), state);
    expect(parsed.rows.some((r) => r.status === "invalid")).toBe(true);
    expect(() =>
      planReconciliation(
        state,
        parsed.rows,
        {
          period: "2028-02",
          importKey: parsed.importKey,
          decisions: [
            {
              row: 2,
              date: "2028-02-06",
              choice: "keep",
              reason: "Keep current",
            },
          ],
        },
        parsed.importKey,
      ),
    ).toThrow("import_has_unresolved_rows");
  },
);
it("rejects missing, duplicate, wrong-date and unknown decisions, changed source and month", async () => {
  const { state } = fixture();
  const parsed = await parseRevOpsUpload(
    upload(header + "2028-02-06,9,Reviewed\n"),
    state,
  );
  const d = {
    row: 2,
    date: "2028-02-06",
    choice: "use" as const,
    reason: "Verified count",
  };
  for (const decisions of [
    [],
    [d, d],
    [{ ...d, row: 99 }],
    [{ ...d, date: "2028-02-07" }],
  ])
    expect(() =>
      planReconciliation(
        state,
        parsed.rows,
        { period: "2028-02", importKey: parsed.importKey, decisions },
        parsed.importKey,
      ),
    ).toThrow("every_conflict_requires_one_decision");
  expect(() =>
    planReconciliation(
      state,
      parsed.rows,
      { period: "2028-02", importKey: "a".repeat(64), decisions: [d] },
      parsed.importKey,
    ),
  ).toThrow("preview_source_changed");
  expect(() =>
    planReconciliation(
      state,
      parsed.rows,
      { period: "2028-03", importKey: parsed.importKey, decisions: [d] },
      parsed.importKey,
    ),
  ).toThrow("reconciliation_requires_selected_month");
  expect(() =>
    planReconciliation(
      state,
      parsed.rows,
      {
        period: "2028-02",
        importKey: parsed.importKey,
        decisions: [{ ...d, reason: "  " }],
      },
      parsed.importKey,
    ),
  ).toThrow();
});
