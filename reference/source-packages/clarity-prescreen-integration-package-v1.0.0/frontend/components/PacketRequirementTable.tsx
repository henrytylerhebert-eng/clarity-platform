// Proposed and unverified.
export interface PacketRequirementRow {
  requirementCode: string;
  label: string;
  requiredness: string;
  state: string;
  owner?: string;
  sourceRule: string;
  blockingTargets: string[];
  nextAction?: string;
}

export function PacketRequirementTable({ rows }: { rows: PacketRequirementRow[] }) {
  if (rows.length === 0) return <p>No packet requirements found for this target.</p>;
  return (
    <table>
      <caption>Referral packet requirements for the selected review target</caption>
      <thead><tr><th>Requirement</th><th>Requiredness</th><th>Status</th><th>Owner</th><th>Blocks</th><th>Source</th><th>Next action</th></tr></thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.requirementCode}>
            <th scope="row">{row.label}</th>
            <td>{row.requiredness}</td><td>{row.state}</td><td>{row.owner ?? "Unassigned"}</td>
            <td>{row.blockingTargets.length ? row.blockingTargets.join(", ") : "Non-blocking"}</td>
            <td>{row.sourceRule}</td><td>{row.nextAction ?? "No action available"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
