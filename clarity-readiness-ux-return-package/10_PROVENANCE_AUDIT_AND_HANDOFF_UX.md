# Provenance, Audit, And Handoff UX

## Provenance pattern

Each node exposes:

- Source.
- Review state.
- Provenance kind.
- Last changed time.
- Freshness.
- Restricted-detail flag.
- What would change the status.

## Handoff pattern

The synthetic digest includes:

- Changed workstream.
- Changed status or version.
- Actor/source.
- Primary blocker change.
- Facility response changes.
- Packet version state.

Runtime collaboration, concurrent editing, and production acknowledgement are documented-only for this slice.

