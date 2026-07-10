# Clarity Crisis Platform Architecture Packet

This packet converts the prior Clarity / Blue Partner behavioral-health crisis platform conversation into a buildable project architecture for a Claude Code or Codex implementation session.

## What This Project Is

Clarity is a behavioral-health crisis intake, statutory custody, transfer, and inpatient operations platform. The near-term product is not a generic bed board. It is a guided intake and legal/clinical documentation system that follows a patient from first contact through PEC/OPC/EC execution, hospital referral, acceptance, admission, and inpatient bed placement.

The defensible core is:

- Guided intake coaching with field and clinical modes.
- Louisiana-first statutory instrument execution.
- One-capture / many-output case packet generation.
- Hash-chained custody and decision ledger.
- Secure referral, transfer, and acceptance workflow.
- Compliance clocks and escalation routing.
- Milieu-aware inpatient bed assignment recommendations.

## Packet Contents

- `docs/00-architecture-index.md` - authority order for canonical docs, generated package, source context, and prototype references.
- `docs/01-project-architecture.md` - canonical architecture and module map.
- `docs/02-claude-code-handoff.md` - paste-ready handoff for the next build session.
- `docs/03-data-model.md` - first-pass entity model and relationships.
- `docs/04-build-roadmap.md` - priority roadmap, market-informed later work, and parking lot.
- `docs/05-source-document-index.md` - read-only source materials, availability, and product-claim status register.
- `docs/06-architecture-review.md` - architecture review and implementation risks.
- `docs/07-redundancy-priority-map.md` - duplication/complementarity analysis and feature priority map.
- `docs/08-reporting-metrics-rebuilder.md` - company-agnostic reporting metrics module oriented around utilization review excellence.
- `docs/09-personas-and-role-ux.md` - canonical stakeholder personas, per-role UX customizations, and the role-adaptive UX design rules implemented in `app/`.

## Current Evidence Status

Confirmed from provided thread/docs:

- The platform concept includes intake, legal custody documentation, transfer, bedboard, UR/payer support, and reporting.
- Louisiana PEC/OPC/CEC/statutory-clock handling is central, but exact statutory trigger/duration language still requires counsel review before enforcement in software.
- Central intake SOP and clinical assessment guidance map cleanly into the product workflow.

Unknown:

- Exact current Louisiana statutory wording and official form requirements.
- Current hospital-specific assessment forms.
- Current payer criteria packs and facility-specific authorization rules.
- Live competitor feature state beyond the prior thread synthesis.

No measurements found:

- Baseline transfer timing.
- First-submission acceptance rates.
- Current packet completeness rate.
- Documentation-error rate.
- Pilot outcome measurements.
