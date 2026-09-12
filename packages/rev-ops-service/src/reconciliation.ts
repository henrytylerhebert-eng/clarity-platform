import {
  RevOpsReconciliationSchema,
  type RevOpsReconciliation,
  type RevOpsImportRow,
  type RevOpsState,
  type RevOpsReconciliationPlan,
} from "../../domain-contracts/src/revOps.js";
import { RevOpsError } from "./error.js";

// Rows are produced by the bounded server parser, never accepted from the client.
export function planReconciliation(
  state: RevOpsState,
  rows: RevOpsImportRow[],
  request: RevOpsReconciliation,
  importKey: string,
): RevOpsReconciliationPlan {
  const input = RevOpsReconciliationSchema.parse(request);
  if (input.importKey !== importKey)
    throw new RevOpsError("preview_source_changed");
  if (
    !rows.length ||
    rows.some((r) => r.status === "invalid" || !r.incoming || !r.date)
  )
    throw new RevOpsError("import_has_unresolved_rows", 400);
  if (rows.some((r) => !r.date!.startsWith(input.period + "-")))
    throw new RevOpsError("reconciliation_requires_selected_month", 400);
  const decisions = new Map(input.decisions.map((d) => [d.row, d]));
  const conflicts = rows.filter((r) => r.status === "conflict");
  if (
    decisions.size !== input.decisions.length ||
    decisions.size !== conflicts.length ||
    input.decisions.some(
      (d) => !conflicts.some((r) => r.row === d.row && r.date === d.date),
    )
  )
    throw new RevOpsError("every_conflict_requires_one_decision", 400);
  const plan: RevOpsReconciliationPlan = {
    period: input.period,
    commands: [],
    commandRows: [],
    rows: [],
    counts: { inserted: 0, corrected: 0, unchanged: 0, kept: 0 },
    patientDayChange: 0,
  };
  for (const row of rows) {
    const decision = decisions.get(row.row);
    const outcome =
      row.status === "new"
        ? "inserted"
        : row.status === "unchanged"
          ? "unchanged"
          : decision!.choice === "keep"
            ? "kept"
            : "corrected";
    const { status: _status, issues: _issues, ...evidence } = row;
    plan.rows.push({
      ...evidence,
      date: row.date!,
      outcome,
      ...(decision ? { reason: decision.reason } : {}),
    });
    plan.counts[outcome]++;
    if (outcome === "inserted" || outcome === "corrected") {
      const fields = row
        .incoming!.fields.filter((v) =>
          state.customFields?.some((f) => f.id === v.fieldId && !f.archived),
        )
        .map((v) => ({ fieldId: v.fieldId, value: v.value }));
      const command = { date: row.date!, count: row.incoming!.count, fields };
      plan.commands.push(
        outcome === "inserted"
          ? { action: "actual", ...command }
          : { action: "correct", ...command, reason: decision!.reason },
      );
      plan.commandRows.push(row.row);
      plan.patientDayChange += row.incoming!.count - (row.saved?.count ?? 0);
    }
  }
  return plan;
}
