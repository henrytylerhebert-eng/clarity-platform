# Restored workbook acceptance

**Status: Owner accepted — 2026-09-09.** Full workbook parity and real financial-rate implementation are authorized development scope. Synthetic patient and operating data remain the test boundary.

## Owner decision

Tyler explicitly stated: “the work book is accepted” and authorized the MVP definition, interface update, workbook parity, and real financial-rate implementation. This closes the prior workbook-acceptance gate. Do not request the same acceptance again or use historical verification gaps to withhold the authorized development.

The accepted product baseline is **Dunder Mifflin Hospital - Restored Operations 2026**. Its operating functions, records, formulas, examples, reports, navigation, and reconciliation requirements define the parity target through the [workflow map](WORKBOOK_TO_PLATFORM_WORKFLOW_MAP.md) and [acceptance matrix](../testing/WORKBOOK_PLATFORM_ACCEPTANCE_MATRIX.md).

## Artifact and evidence

| Record | Value / status |
| --- | --- |
| Workbook | `/Users/tylerhebert/.codex/visualizations/2026/09/08/01a0828f-894b-74b1-adc9-903347636313/outputs/dunder-mifflin-restored-2026/Dunder Mifflin Hospital - Restored Operations 2026.xlsx` |
| Mapped and owner-accepted SHA-256 | `6e81bd61950c244e607ed03f8b0f13e1a4d0bea366ee7ad7cc54c053ef90de26` |
| Current SHA-256 checked 2026-09-09 | `6e81bd61950c244e607ed03f8b0f13e1a4d0bea366ee7ad7cc54c053ef90de26` — matches the accepted mapped artifact |
| Recorded inventory | 62 physical sheets, including 60 governed sheets and two empty tabs; retained as the accepted artifact |
| Earlier native-tested binary | `67892ab3fb25c8f2af313779e46c75235c08262f4f13a47bd221bab8ccbe96de` — historical evidence for another byte version |
| Current native recalculation / mutation rerun | **Unverified; not rerun in this acceptance update.** Historical test results are not relabeled as a new run. |
| Platform parity | **Partially implemented; remaining mapped gaps are authorized work.** Owner acceptance of the workbook does not make missing platform behavior implemented. |

The earlier mapping audit and its exact test/evidence limits remain in the [evidence manifest](evidence/WORKBOOK_PLATFORM_EVIDENCE.json). A native test receipt tied to the accepted artifact remains useful verification work; it is no longer a prerequisite for starting platform development.

## Authorized scope and completion evidence

- Update the MVP definition and interface to cover the complete workbook operating model.
- Implement all mapped workbook parity gaps, including IP/IOP activity, staffing, financial planning, invoices, collections, forecasting, reports, and audit/navigation behavior.
- Implement source-linked Medicare, Medicaid, and commercial payer distinctions and financial-rate calculations. Verify official source versions and effective dates; retain facility, service, product, network, and contract applicability. Synthetic workbook rates are not converted into official rates by acceptance.
- Preserve budget, actual activity, modeled reimbursement, billed amounts, forecast, and posted collections as separate quantities. Missing facility factors or private contract terms remain explicit missing inputs.
- The owner selected a Louisiana hospital payment profile and will provide its provider identifier. That identifier is pending only for the facility-specific rates needing it; shared rate implementation and other parity work proceed.
- Use the existing source-linked cases and acceptance IDs to prove each completed function. Financial calculations need reproducible expected results, boundary-date tests, missing/ambiguous applicability handling, and recorded source lineage before they are described as verified.

This decision authorizes development, including necessary contracts and persistence within the existing architecture. It does not assert production readiness, authorize real patient data or live source-system connections, or delegate autonomous clinical, legal, payer, or financial decisions.

## Build sequence

The [build plan](../roadmap/WORKBOOK_BASELINE_IOP_REVIEW_BUILD_PLAN.md) retains IOP review as an initial increment. Financial source/rate work can proceed in parallel; neither lane waits for renewed workbook acceptance. [OD-18](../decisions/OPEN_DECISIONS.md) records the closed acceptance decision. Remaining facility-specific inputs and source-system access decisions block only the calculations or connections that require them.
