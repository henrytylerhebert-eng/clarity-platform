# Louisiana OBH Forms — Original Source Drop

Official Louisiana Department of Health / Office of Behavioral Health emergency-certificate
forms, supplied by the product owner 2026-07-17 (originally dropped at repo root as
"untitled folder"). Immutable source material — do not edit; revision dates are taken from the
face of each form.

| File | Form | Revision |
|---|---|---|
| `OBH-1_Physicians_Emergency_Certificate_Rev2025-08.pdf` | OBH-1 — Physician's Emergency Certificate (PEC) | Rev. 08/2025 |
| `OBH-2_Coroners_Emergency_Certificate_Rev2017-05.pdf` | OBH-2 — Coroner's Emergency Certificate (CEC) | Rev. 05/2017 |
| `OBH-20_Order_for_Protective_Custody_Rev2017-03.pdf` | OBH-20 — Order for Protective Custody (OPC) | Rev. 03/2017 |
| `Louisiana_Behavioral_Health_Forms_Review.docx` | Forms review / legal-accuracy analysis of the above | 2026-07 |

Provenance notes:

- The three PDFs are byte-identical (SHA-256 verified 2026-07-17) to the working copies at
  `packages/legal-hold-forms/src/assets/` (branch `claude/louisiana-opc-pec-cec-review-708607`),
  which also carries OBH-1A and OBH-19 and its own `PROVENANCE.md`.
- These forms are the ground truth used by `docs/legal/LOUISIANA_OPC_PEC_CEC_FORM_VERIFICATION.md`
  (same branch), which documents, among other findings, the OBH-20 8-hour examination text vs.
  La. R.S. 28:53.2 12-hour statutory conflict.
- Registration in `docs/05-source-document-index.md` and linkage from
  `docs/legal/LEGAL_STATUS_ARCHITECTURE.md` is deferred to branch-merge reconciliation, since both
  docs have pending edits on `claude/product-link-6760b0`.

All statutory timing, trigger events, and attestation language remain subject to counsel
validation before any enforcement in software.
