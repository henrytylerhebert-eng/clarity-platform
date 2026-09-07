import { expect, it } from "vitest";
import type { AuthenticatedPrincipal } from "@clarity/domain-contracts";
import {
  RevOpsCommandSchema,
  type RevOpsCommand,
  type RevOpsCustomField,
} from "../../packages/domain-contracts/src/revOps.js";
import {
  applyRevOpsCommand,
  createRevOpsState,
  compareRevOps,
  fieldSnapshots,
} from "../../packages/rev-ops-service/src/index.js";
import { parseRevOpsUpload } from "../../packages/api-service/src/revOpsImport.js";
const actor: AuthenticatedPrincipal = {
  userId: "synthetic-admin",
  roles: ["ORGANIZATION_ADMIN"],
  organizationId: "synthetic-org",
  displayName: "Synthetic Admin",
  sessionId: "synthetic-session",
  expiresAt: new Date("2028-03-01T00:00:00Z"),
};
const source = { kind: "manual" as const, name: "Synthetic test" };
const state = () =>
  createRevOpsState({
    name: "Synthetic",
    unit: "Geriatric",
    timezone: "America/Chicago",
    costCenterLabel: "Cost center",
    costCenterOptions: ["Inpatient"],
  });
function apply(s: ReturnType<typeof state>, c: RevOpsCommand) {
  return applyRevOpsCommand(
    s,
    RevOpsCommandSchema.parse(c),
    actor,
    source,
    "2028-02-08T00:00:00Z",
  );
}
function define(
  s: ReturnType<typeof state>,
  scope: "setup" | "budget" | "actual",
  type: "text" | "select" = "select",
) {
  apply(s, {
    action: "defineField",
    scope,
    type,
    label: `${scope} field`,
    required: true,
    archived: false,
    options:
      type === "select"
        ? [
            { label: "Pending", archived: false },
            { label: "Reconciled", archived: false },
          ]
        : [],
  });
  return s.customFields!.at(-1)!;
}
const values = (f: RevOpsCustomField, n = 0) => [
  { fieldId: f.id, value: f.type === "text" ? "SP-GERI" : f.options[n]!.id },
];
const budget = {
  action: "budget" as const,
  period: "2028-02",
  total: 290,
  costCenter: "Inpatient",
};
const actual = { action: "actual" as const, date: "2028-02-06", count: 8 };

it("keeps existing workspaces compatible while required setup gates new entry", () => {
  const s = state();
  apply(s, budget);
  apply(s, actual);
  const f = define(s, "setup", "text");
  apply(s, { action: "setupValues", values: [] }); // resumable incomplete setup
  expect(() => apply(s, { ...actual, date: "2028-02-07" })).toThrow(
    "required_setup_values_missing",
  );
  expect(compareRevOps(s, "2028-02", "2028-02-06").onboarding.complete).toBe(
    false,
  );
  apply(s, { action: "setupValues", values: values(f) });
  apply(s, { ...actual, date: "2028-02-07" });
  expect(s.setupValues?.[0]?.value).toBe("SP-GERI");
});
it("records metadata-only corrections, retains snapshots and ignores identical actuals", () => {
  const s = state(),
    f = define(s, "actual");
  apply(s, { ...actual, fields: values(f) });
  expect(() => apply(s, { ...actual, fields: values(f, 1) })).toThrow(
    "actual_conflict_requires_correction",
  );
  apply(s, {
    ...actual,
    action: "correct",
    fields: values(f, 1),
    reason: "Verified census",
  });
  expect(s.actuals[actual.date]?.map((r) => r.count)).toEqual([8, 8]);
  expect(s.actuals[actual.date]?.[0]?.fields?.[0]?.optionLabel).toBe("Pending");
  const { version: _version, ...definition } = f;
  apply(s, { action: "defineField", ...definition, label: "Renamed review" });
  expect(apply(s, { ...actual, fields: values(f, 1) })).toBe(false);
  apply(s, {
    ...actual,
    action: "correct",
    count: 9,
    fields: values(f, 1),
    reason: "Corrected count",
  });
  expect(s.actuals[actual.date]?.at(-1)?.fields?.[0]?.label).toBe(
    "Renamed review",
  );
  expect(s.actuals[actual.date]?.[0]?.fields?.[0]?.label).toBe("actual field");
  apply(s, { action: "defineField", ...definition, archived: true });
  apply(s, { ...actual, action: "correct", count: 10, reason: "Count only" });
  expect(s.actuals[actual.date]?.at(-1)?.fields).toEqual(
    s.actuals[actual.date]?.at(-2)?.fields,
  );
  expect(() =>
    apply(s, { ...actual, date: "2028-02-07", fields: values(f) }),
  ).toThrow("archived_field");
});
it("retains retired options on existing records but forbids new use or deletion", () => {
  const s = state(),
    f = define(s, "actual");
  apply(s, { ...actual, fields: values(f) });
  const { version: _version, ...definition } = f;
  apply(s, {
    action: "defineField",
    ...definition,
    options: f.options.map((o, i) => ({ ...o, archived: i === 0 })),
  });
  apply(s, {
    ...actual,
    action: "correct",
    count: 9,
    reason: "Count corrected",
    fields: values(f),
  });
  expect(() =>
    apply(s, { ...actual, date: "2028-02-07", fields: values(f) }),
  ).toThrow("retired_field_option");
  expect(() =>
    apply(s, {
      action: "defineField",
      ...definition,
      options: [f.options[1]!],
    }),
  ).toThrow("archive_options_instead_of_deleting");
});
it("keeps approved budget fields immutable and validates new draft/approval requirements", () => {
  const s = state(),
    f = define(s, "budget");
  expect(() => apply(s, budget)).toThrow("required_custom_field_missing");
  apply(s, { ...budget, fields: values(f) });
  apply(s, { action: "approve", budgetId: s.budgets[0]!.id });
  const approved = structuredClone(s.budgets[0]);
  apply(s, { ...budget, fields: values(f, 1) });
  apply(s, {
    action: "defineField",
    scope: "budget",
    type: "text",
    label: "Planning note",
    required: true,
    archived: false,
    options: [],
  });
  expect(() =>
    apply(s, { action: "approve", budgetId: s.budgets[1]!.id }),
  ).toThrow("required_custom_field_missing");
  expect(() => apply(s, { ...budget, fields: values(f) })).toThrow(
    "required_custom_field_missing",
  );
  expect(s.budgets[0]).toEqual(approved);
});
it("rejects wrong-scope fields, duplicate values, prototype keys, definition mutation and excessive fields", () => {
  const s = state(),
    f = define(s, "setup", "text");
  expect(() => fieldSnapshots(s, "actual", values(f))).toThrow("wrong_scope");
  expect(
    RevOpsCommandSchema.safeParse({
      ...actual,
      fields: [{ fieldId: "__proto__", value: "x" }],
    }).success,
  ).toBe(false);
  expect(
    RevOpsCommandSchema.safeParse({
      ...actual,
      fields: [...values(f), ...values(f)],
    }).success,
  ).toBe(false);
  const { version: _version, ...definition } = f;
  expect(() =>
    apply(s, { action: "defineField", ...definition, type: "select" }),
  ).toThrow("immutable");
  expect(() =>
    apply(s, { action: "defineField", ...definition, id: undefined }),
  ).toThrow("duplicate_field_label");
  for (let i = 1; i < 20; i++)
    apply(s, {
      action: "defineField",
      ...definition,
      id: undefined,
      label: `Field ${i}`,
    });
  expect(() =>
    apply(s, {
      action: "defineField",
      ...definition,
      id: undefined,
      label: "Field 21",
    }),
  ).toThrow("custom_field_limit");
});
it("previews custom imports with stable mappings and preserves accepted replay after archive", async () => {
  const s = state(),
    f = define(s, "actual");
  const input = {
    kind: "actuals" as const,
    name: "synthetic.csv",
    content: Buffer.from(
      "activity_date,patient_days,review\n2028-02-06,8,Reconciled\n",
    ).toString("base64"),
    mapping: {},
    fieldMapping: [{ fieldId: f.id, column: "review" }],
  };
  const p = await parseRevOpsUpload(input, s);
  expect(p.issues).toEqual([]);
  apply(s, p.commands[0]!);
  s.acceptedImports.push(p.importKey);
  const { version: _version, ...definition } = f;
  apply(s, { action: "defineField", ...definition, archived: true });
  const replay = await parseRevOpsUpload(input, s);
  expect(replay.replayed).toBe(true);
  expect(replay.issues).toEqual([]);
  expect(
    (
      await parseRevOpsUpload(
        {
          ...input,
          content: Buffer.from(
            "activity_date,patient_days,review\n2028-02-07,9,Reconciled\n",
          ).toString("base64"),
        },
        s,
      )
    ).issues.length,
  ).toBeGreaterThan(0);
});

it.each([false, true])(
  "distinguishes automatic and explicitly empty mappings in replay identity (empty first: %s)",
  async (emptyFirst) => {
    const s = state(),
      f = define(s, "actual", "text");
    const { version: _version, ...definition } = f;
    apply(s, { action: "defineField", ...definition, required: false });
    const input = {
      kind: "actuals" as const,
      name: "mapping-mode.csv",
      content: Buffer.from(
        "activity_date,patient_days,Field: actual field\n2028-02-06,8,Reviewed\n",
      ).toString("base64"),
      mapping: {},
    };
    const ignored = { ...input, fieldMapping: [] };
    const first = await parseRevOpsUpload(emptyFirst ? ignored : input, s);
    expect(first.issues).toEqual([]);
    apply(s, first.commands[0]!);
    s.acceptedImports.push(first.importKey);
    const saved = structuredClone(s);

    const changed = await parseRevOpsUpload(emptyFirst ? input : ignored, s);
    expect(changed.importKey).not.toBe(first.importKey);
    expect(changed.replayed).toBe(false);
    expect(changed.issues).toEqual([
      {
        row: 2,
        message:
          "Conflicts with existing custom values; use correction with a reason",
      },
    ]);
    const repeat = await parseRevOpsUpload(emptyFirst ? ignored : input, s);
    expect(repeat.replayed).toBe(true);
    expect(repeat.issues).toEqual([]);
    expect(s).toEqual(saved);
  },
);

it("validates custom values in XLSX and retains mapped physical source rows", async () => {
  const { default: ExcelJS } = await import("exceljs");
  const s = state(),
    f = define(s, "actual", "text");
  const wb = new ExcelJS.Workbook();
  const sheet = wb.addWorksheet("Actuals");
  sheet.addRows([
    ["activity_date", "patient_days", "Field: actual field"],
    ["2028-02-01", 0, "Zero verified"],
    ["2028-02-02", 4, { formula: '"Unsafe"', result: "Unsafe" }],
  ]);
  const p = await parseRevOpsUpload(
    {
      kind: "actuals",
      name: "fields.xlsx",
      content: Buffer.from(await wb.xlsx.writeBuffer()).toString("base64"),
      mapping: {},
    },
    s,
  );
  expect(p.issues).toHaveLength(1);
  expect(p.issues[0]?.row).toBe(3);
  expect(p.commands[0]).toMatchObject({
    count: 0,
    fields: [{ fieldId: f.id, value: "Zero verified" }],
  });
  expect(p.source.fieldMapping).toEqual([
    { fieldId: f.id, column: "Field: actual field" },
  ]);
  expect(p.source.rows).toEqual([2, 3]);
});

it("requires the record permission for custom writes and blocks data-only field authority", () => {
  const s = state();
  s.grants.staff = ["view", "actualEnter"];
  const staff = {
    ...actor,
    userId: "staff",
    roles: ["READ_ONLY_AUDITOR" as const],
  };
  const command = RevOpsCommandSchema.parse({
    action: "defineField",
    scope: "actual",
    type: "text",
    label: "Review",
    required: false,
    archived: false,
    options: [],
  });
  expect(() =>
    applyRevOpsCommand(s, command, staff, source, "2028-02-01"),
  ).toThrow("permission_denied");
  expect(() =>
    applyRevOpsCommand(
      s,
      { action: "setupValues", values: [] },
      staff,
      source,
      "2028-02-01",
    ),
  ).toThrow("permission_denied");
  const f = define(s, "actual", "text");
  expect(() =>
    apply(s, {
      ...actual,
      fields: [{ fieldId: f.id, value: "x".repeat(161) }],
    }),
  ).toThrow();
  expect(() =>
    apply(s, { ...actual, fields: [{ fieldId: f.id, value: "   " }] }),
  ).toThrow("required_custom_field_missing");
  apply(s, { ...actual, fields: values(f) });
  expect(() =>
    applyRevOpsCommand(
      s,
      {
        ...actual,
        action: "correct",
        fields: [{ fieldId: f.id, value: "changed" }],
        reason: "Metadata change",
      },
      staff,
      source,
      "2028-02-01",
    ),
  ).toThrow("permission_denied");
});

it("rejects ambiguous select identifiers in uploads instead of choosing the first match", async () => {
  const s = state(),
    f = define(s, "actual");
  const { version: _version, ...definition } = f;
  apply(s, {
    action: "defineField",
    ...definition,
    options: f.options.map((o, i) => ({
      ...o,
      label: i === 0 ? f.options[1]!.id : o.label,
    })),
  });
  const p = await parseRevOpsUpload(
    {
      kind: "actuals",
      name: "ambiguous.csv",
      content: Buffer.from(
        `activity_date,patient_days,review\n2028-02-01,9,${f.options[1]!.id}\n`,
      ).toString("base64"),
      mapping: {},
      fieldMapping: [{ fieldId: f.id, column: "review" }],
    },
    s,
  );
  expect(
    p.issues.some((i) => i.message === "Ambiguous custom field option"),
  ).toBe(true);
});
