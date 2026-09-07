import { useState, type FormEvent } from "react";
import type {
  RevOpsCommand,
  RevOpsView,
  RevOpsState,
  RevOpsFieldScope,
  RevOpsFieldSnapshot,
} from "../../../packages/domain-contracts/src/revOps";

export const customValues = (
  data: FormData,
  state: RevOpsState,
  scope: RevOpsFieldScope,
) =>
  (state.customFields ?? [])
    .filter((f) => f.scope === scope && !f.archived)
    .map((f) => ({
      fieldId: f.id,
      value: String(data.get(`custom-${f.id}`) ?? ""),
    }));

export function SnapshotValues({
  values = [],
  state,
  scope,
}: {
  values?: RevOpsFieldSnapshot[];
  state: RevOpsState;
  scope: RevOpsFieldScope;
}) {
  const missing = (state.customFields ?? []).filter(
    (f) =>
      f.scope === scope &&
      !f.archived &&
      !values.some((v) => v.fieldId === f.id),
  );
  if (!values.length && !missing.length) return null;
  return (
    <ul className="ro-field-values">
      {values.map((v) => (
        <li key={v.fieldId}>
          {v.label}: {v.optionLabel ?? v.value} <small>(v{v.version})</small>
        </li>
      ))}
      {missing.map((f) => (
        <li key={f.id}>{f.label}: Not recorded</li>
      ))}
    </ul>
  );
}
export function EntryFields({
  state,
  scope,
  values = [],
  required = true,
}: {
  state: RevOpsState;
  scope: RevOpsFieldScope;
  values?: RevOpsFieldSnapshot[];
  required?: boolean;
}) {
  return (
    <>
      {(state.customFields ?? [])
        .filter((f) => f.scope === scope)
        .map((f) => {
          const old = values.find((v) => v.fieldId === f.id);
          if (f.archived)
            return old ? (
              <p key={f.id}>
                {old.label}: {old.optionLabel ?? old.value} (archived, retained)
              </p>
            ) : null;
          return (
            <label key={`${f.id}-${f.version}`}>
              {f.label}
              {f.required ? " (required)" : ""}
              {f.type === "text" ? (
                <input
                  aria-label={`${f.label}${f.required ? " (required)" : ""}`}
                  name={`custom-${f.id}`}
                  defaultValue={old?.value ?? ""}
                  maxLength={160}
                  required={required && f.required}
                />
              ) : (
                <select
                  aria-label={`${f.label}${f.required ? " (required)" : ""}`}
                  name={`custom-${f.id}`}
                  defaultValue={old?.value ?? ""}
                  required={required && f.required}
                >
                  <option value="">Select a value</option>
                  {f.options
                    .filter((o) => !o.archived || o.id === old?.value)
                    .map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.label}
                        {o.archived ? " (retired, retained)" : ""}
                      </option>
                    ))}
                </select>
              )}
            </label>
          );
        })}
    </>
  );
}
type Props = {
  current: RevOpsView;
  busy: boolean;
  command: (c: RevOpsCommand) => Promise<void>;
};
const get = (d: FormData, name: string) => String(d.get(name) ?? "");
const newOptions = (d: FormData) =>
  get(d, "newOptions")
    .split(",")
    .map((label) => label.trim())
    .filter(Boolean)
    .map((label) => ({ label, archived: false }));
export function CustomFieldSetup({ current, busy, command }: Props) {
  const [type, setType] = useState<"text" | "select">("text");
  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    return new FormData(e.currentTarget);
  };
  return (
    <div className="ro-custom-setup">
      <h2>Additional fields</h2>
      <p>
        Fields belong to this hospital/unit. Choose setup, budget or daily
        actuals. Saved values keep their original labels and history.
      </p>
      <form
        className="ro-form"
        key={`add-${current.id}-${current.revision}`}
        onSubmit={(e) => {
          const d = submit(e);
          void command({
            action: "defineField",
            scope: get(d, "scope") as RevOpsFieldScope,
            type,
            label: get(d, "label"),
            required: d.has("required"),
            archived: false,
            options: type === "select" ? newOptions(d) : [],
          });
        }}
      >
        <label>
          New field label
          <input name="label" maxLength={160} required />
        </label>
        <label>
          Field placement
          <select name="scope" aria-label="Field placement">
            <option value="setup">Hospital/unit setup</option>
            <option value="budget">Budget entry</option>
            <option value="actual">Daily actuals</option>
          </select>
        </label>
        <label>
          Field type
          <select
            aria-label="Field type"
            value={type}
            onChange={(e) => setType(e.target.value as typeof type)}
          >
            <option value="text">Short text</option>
            <option value="select">Single select</option>
          </select>
        </label>
        {type === "select" ? (
          <label>
            New choices, comma separated
            <input name="newOptions" required />
          </label>
        ) : null}
        <label className="ro-check">
          <input type="checkbox" name="required" />
          Required for entry
        </label>
        <button disabled={busy}>Add field</button>
      </form>
      {(current.state.customFields ?? []).map((f) => (
        <details key={`${f.id}-${f.version}`} className="ro-field-definition">
          <summary>
            {f.label} · {f.scope} · version {f.version}
            {f.archived ? " · archived" : ""}
          </summary>
          <form
            className="ro-form"
            onSubmit={(e) => {
              const d = submit(e);
              void command({
                action: "defineField",
                id: f.id,
                scope: f.scope,
                type: f.type,
                label: get(d, "label"),
                required: d.has("required"),
                archived: d.has("archived"),
                options: [
                  ...f.options.map((o) => ({
                    id: o.id,
                    label: get(d, `option-${o.id}`),
                    archived: d.has(`retire-${o.id}`),
                  })),
                  ...newOptions(d),
                ],
              });
            }}
          >
            <label>
              Definition label
              <input
                name="label"
                defaultValue={f.label}
                maxLength={160}
                required
              />
            </label>
            <label className="ro-check">
              <input
                type="checkbox"
                name="required"
                defaultChecked={f.required}
              />
              Required for entry
            </label>
            <label className="ro-check">
              <input
                type="checkbox"
                name="archived"
                defaultChecked={f.archived}
              />
              Archive additional field
            </label>
            {f.options.map((o) => (
              <fieldset key={o.id}>
                <legend>Choice: {o.label}</legend>
                <label>
                  Choice label
                  <input
                    name={`option-${o.id}`}
                    defaultValue={o.label}
                    required
                    maxLength={160}
                  />
                </label>
                <label className="ro-check">
                  <input
                    type="checkbox"
                    name={`retire-${o.id}`}
                    defaultChecked={o.archived}
                  />
                  Retire choice
                </label>
              </fieldset>
            ))}
            {f.type === "select" ? (
              <label>
                Add choices, comma separated
                <input name="newOptions" />
              </label>
            ) : null}
            <button disabled={busy}>Save additional field</button>
          </form>
        </details>
      ))}
      <h2>Saved setup values</h2>
      <p>
        Save your progress and return later. Required setup values must be
        present before budget or actual entry.
      </p>
      <SnapshotValues
        state={current.state}
        scope="setup"
        values={current.state.setupValues}
      />
      <form
        className="ro-form"
        key={`values-${current.id}-${current.revision}`}
        onSubmit={(e) => {
          const d = submit(e);
          void command({
            action: "setupValues",
            values: customValues(d, current.state, "setup"),
          });
        }}
      >
        <EntryFields
          state={current.state}
          scope="setup"
          values={current.state.setupValues}
          required={false}
        />
        <button disabled={busy}>Save setup progress</button>
      </form>
    </div>
  );
}
export function ActualEntry({
  current,
  busy,
  command,
  through,
}: Props & { through: string }) {
  const [date, setDate] = useState(through);
  const latest = current.state.actuals[date]?.at(-1);
  return (
    <form
      key={`${date}-${latest?.at ?? "new"}-${(current.state.customFields ?? [])
        .filter((f) => f.scope === "actual")
        .map((f) => f.version)
        .join("-")}`}
      className="ro-form"
      onSubmit={(e) => {
        e.preventDefault();
        const d = new FormData(e.currentTarget),
          reason = get(d, "reason").trim();
        const common = {
          date,
          count: Number(d.get("count")),
          fields: customValues(d, current.state, "actual"),
        };
        void command(
          reason
            ? { action: "correct", ...common, reason }
            : { action: "actual", ...common },
        );
      }}
    >
      <label>
        Activity date
        <input
          type="date"
          name="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
        />
      </label>
      <label>
        Patient days
        <input
          type="number"
          name="count"
          min="0"
          step="1"
          defaultValue={latest?.count ?? ""}
          required
        />
      </label>
      <EntryFields
        state={current.state}
        scope="actual"
        values={latest?.fields}
      />
      <label>
        Correction reason (leave blank for a new entry)
        <input name="reason" />
      </label>
      <button disabled={busy}>Save actual</button>
    </form>
  );
}
