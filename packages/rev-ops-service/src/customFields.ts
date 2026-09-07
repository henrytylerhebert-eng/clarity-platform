import { randomUUID } from "node:crypto";
import type {
  RevOpsCommand,
  RevOpsState,
  RevOpsFieldScope,
  RevOpsFieldSnapshot,
  RevOpsFieldValues,
} from "../../domain-contracts/src/revOps.js";
import { RevOpsError } from "./error.js";

export function defineCustomField(
  state: RevOpsState,
  command: Extract<RevOpsCommand, { action: "defineField" }>,
): boolean {
  const fields = state.customFields ?? [];
  const current = fields.find((f) => f.id === command.id);
  if (command.id && !current)
    throw new RevOpsError("custom_field_not_found", 404);
  if (
    current &&
    (current.scope !== command.scope || current.type !== command.type)
  )
    throw new RevOpsError("field_type_and_scope_are_immutable", 400);
  if (!current && fields.filter((f) => f.scope === command.scope).length >= 20)
    throw new RevOpsError("custom_field_limit", 400);
  if (
    fields.some(
      (f) =>
        f.id !== command.id &&
        f.scope === command.scope &&
        f.label.toLowerCase() === command.label.toLowerCase(),
    )
  )
    throw new RevOpsError("duplicate_field_label", 400);
  if (command.type === "text" && command.options.length)
    throw new RevOpsError("text_field_cannot_have_options", 400);
  if (
    command.type === "select" &&
    (!command.options.length ||
      (!command.archived && !command.options.some((o) => !o.archived)))
  )
    throw new RevOpsError("active_select_requires_options", 400);
  const optionIds = command.options.filter((o) => o.id).map((o) => o.id);
  if (
    new Set(optionIds).size !== optionIds.length ||
    new Set(command.options.map((o) => o.label.toLowerCase())).size !==
      command.options.length
  )
    throw new RevOpsError("duplicate_field_option", 400);
  if (
    command.options.some(
      (o) => o.id && !current?.options.some((old) => old.id === o.id),
    )
  )
    throw new RevOpsError("unknown_field_option", 400);
  if (current?.options.some((old) => !optionIds.includes(old.id)))
    throw new RevOpsError("archive_options_instead_of_deleting", 400);
  const definition = {
    id: current?.id ?? randomUUID(),
    scope: command.scope,
    type: command.type,
    label: command.label,
    required: command.required,
    archived: command.archived,
    version: (current?.version ?? 0) + 1,
    options: command.options.map((o) => ({ ...o, id: o.id ?? randomUUID() })),
  };
  if (
    current &&
    current.label === definition.label &&
    current.required === definition.required &&
    current.archived === definition.archived &&
    current.options.length === definition.options.length &&
    current.options.every((o, i) => {
      const next = definition.options[i]!;
      return (
        o.id === next.id &&
        o.label === next.label &&
        o.archived === next.archived
      );
    })
  )
    return false;
  state.customFields = current
    ? fields.map((f) => (f.id === current.id ? definition : f))
    : [...fields, definition];
  return true;
}

// Full replacement of active values; archived values are retained read-only.
// Old snapshots never acquire a renamed label just because a definition changed.
export function fieldSnapshots(
  state: RevOpsState,
  scope: RevOpsFieldScope,
  values: RevOpsFieldValues,
  previous: RevOpsFieldSnapshot[] = [],
  enforceRequired = true,
): RevOpsFieldSnapshot[] {
  const definitions = (state.customFields ?? []).filter(
    (f) => f.scope === scope,
  );
  const supplied = new Map(values.map((v) => [v.fieldId, v.value]));
  if (supplied.size !== values.length || values.length > 20)
    throw new RevOpsError("duplicate_or_excess_fields", 400);
  for (const [id, value] of supplied) {
    const f = definitions.find((f) => f.id === id);
    if (!f || f.archived)
      throw new RevOpsError("unknown_wrong_scope_or_archived_field", 400);
    if (
      typeof value !== "string" ||
      value.length > 160 ||
      value === "[formula or object: export reviewed values]"
    )
      throw new RevOpsError("invalid_custom_field_value", 400);
  }
  return definitions.flatMap((f) => {
    const old = previous.find((v) => v.fieldId === f.id);
    if (f.archived) return old ? [old] : [];
    const value = supplied.get(f.id)?.trim() ?? "";
    if (!value) {
      if (f.required && enforceRequired)
        throw new RevOpsError("required_custom_field_missing", 400);
      return [];
    }
    const option =
      f.type === "select" ? f.options.find((o) => o.id === value) : undefined;
    if (
      f.type === "select" &&
      (!option || (option.archived && old?.value !== value))
    )
      throw new RevOpsError("invalid_or_retired_field_option", 400);
    if (option?.archived && old) return [old];
    return [
      {
        fieldId: f.id,
        version: f.version,
        label: f.label,
        type: f.type,
        value,
        ...(option ? { optionLabel: option.label } : {}),
      },
    ];
  });
}
export function sameFieldSnapshots(
  a: RevOpsFieldSnapshot[] = [],
  b: RevOpsFieldSnapshot[] = [],
): boolean {
  return (
    a.length === b.length &&
    a.every((v) => {
      const other = b.find((o) => o.fieldId === v.fieldId);
      return (
        other &&
        v.version === other.version &&
        v.label === other.label &&
        v.type === other.type &&
        v.value === other.value &&
        v.optionLabel === other.optionLabel
      );
    })
  );
}
export function sameFieldValues(
  a: RevOpsFieldSnapshot[] = [],
  b: RevOpsFieldSnapshot[] = [],
): boolean {
  const key = (values: RevOpsFieldSnapshot[]) =>
    JSON.stringify(
      values
        .map((v) => [v.fieldId, v.value])
        .sort(([a], [b]) => a!.localeCompare(b!)),
    );
  return key(a) === key(b);
}
function missingSetup(state: RevOpsState) {
  return (state.customFields ?? [])
    .filter(
      (f) =>
        f.scope === "setup" &&
        !f.archived &&
        f.required &&
        !state.setupValues?.some(
          (v) =>
            v.fieldId === f.id &&
            v.value &&
            (f.type === "text" || f.options.some((o) => o.id === v.value)),
        ),
    )
    .map((f) => f.label);
}
export function requireSetupValues(state: RevOpsState): void {
  if (missingSetup(state).length)
    throw new RevOpsError("required_setup_values_missing", 400);
}
export function onboardingStatus(state: RevOpsState, period: string) {
  const missing = missingSetup(state);
  const permissions = Object.values(state.grants).flat();
  const steps = [
    { label: "Required setup values", complete: missing.length === 0, missing },
    ...(
      ["budgetImport", "budgetApprove", "actualEnter", "actualCorrect"] as const
    ).map((p) => ({
      label: `${{ budgetImport: "Budget entry", budgetApprove: "Budget approval", actualEnter: "Census entry", actualCorrect: "Census correction" }[p]} delegation recorded`,
      complete: permissions.includes(p),
      missing: [],
    })),
    {
      label: `Approved budget for ${period}`,
      complete: state.budgets.some(
        (b) => b.period === period && b.status === "approved",
      ),
      missing: [],
    },
    {
      label: `First accepted actuals for ${period}`,
      complete: Object.entries(state.actuals).some(
        ([date, rows]) => date.startsWith(period) && rows.length > 0,
      ),
      missing: [],
    },
  ];
  return { complete: steps.every((s) => s.complete), steps };
}
