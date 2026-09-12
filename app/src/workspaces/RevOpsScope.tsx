const lanes = [
  {
    title: "Admissions & inpatient operations",
    status: "Partly available",
    scope: "Patient and encounter records, admissions geography, census, patient days, length of stay, and occupancy.",
    remaining: "Aggregate census is available. Encounter reconciliation and the remaining operating measures are to build.",
  },
  {
    title: "IOP operations & audit",
    status: "Partly available",
    scope: "Enrollment, frequency, attendance, groups, participant units, meals, independent note audit, and charge reconciliation.",
    remaining: "A separate review preview and backend exist. Connected program workflows and full workbook coverage are to build.",
  },
  {
    title: "Payers, rates & service valuation",
    status: "To build",
    scope: "Medicare, Louisiana Medicaid, commercial plans, effective contract rates, patient-month allowances, benefits, UR, and assistance.",
    remaining: "Published schedules and payment methods are in scope. The selected Louisiana hospital profile awaits its provider identifier and contract terms.",
  },
  {
    title: "Staffing & labor costs",
    status: "Partly available",
    scope: "Role hours, staffing budgets, rolling variance, agency and one-to-one costs, training, PTO, and productive-hour definitions.",
    remaining: "Daily hours and target comparison are available. Role detail, wages, and compatible cost budgets are to build.",
  },
  {
    title: "Budgets, invoices & collections",
    status: "Partly available",
    scope: "Revenue and labor budgets, ancillary invoices, leases, posted receipts, allocations, reversals, and balance reconciliation.",
    remaining: "Patient-day budget versions are available. Financial budgets, invoices, and cash records are to build.",
  },
  {
    title: "Forecast & management reports",
    status: "To build",
    scope: "Independent forecast scenarios, monthly and annual reports, charts, and drill-through to source records.",
    remaining: "The completed reports will keep actual activity, approved budget, forecast, and posted collections distinct.",
  },
  {
    title: "Setup, definitions & quality",
    status: "Partly available",
    scope: "Navigation, facility access, custom fields, metric definitions, rules, source decisions, history, checks, and expandable records.",
    remaining: "Setup and delegated permissions are available. Broader rule definitions and workbook parity checks are to build.",
  },
  {
    title: "Import, reconciliation & close",
    status: "Partly available",
    scope: "Source mappings, reviewed conflicts, close and reopen history, preserved receipts, and exports.",
    remaining: "Count imports and census close work today. Full workbook imports and consolidated close are to build.",
  },
];

export function RevOpsScope() {
  return (
    <section className="ro-mvp" aria-labelledby="mvp-scope-title">
      <div className="ro-scope-heading">
        <div>
          <h2 id="mvp-scope-title">Accepted workbook scope</h2>
          <p>Dunder Mifflin Hospital · Restored Operations 2026</p>
        </div>
        <span className="ro-accepted">Accepted by Tyler · September 9, 2026</span>
      </div>
      <p>
        The MVP target includes the full workbook workflows and financial-rate
        calculations. Census, patient-day budgets, staffing comparison,
        reconciliation, and reviewed close are available today.
      </p>
      <details className="ro-scope-details">
        <summary>View workbook coverage and remaining builds</summary>
        <div className="ro-scope-grid">
          {lanes.map((lane) => (
            <article key={lane.title}>
              <span className="ro-muted">{lane.status}</span>
              <h3>{lane.title}</h3>
              <p>{lane.scope}</p>
              <p className="ro-muted">{lane.remaining}</p>
            </article>
          ))}
        </div>
      </details>
    </section>
  );
}
