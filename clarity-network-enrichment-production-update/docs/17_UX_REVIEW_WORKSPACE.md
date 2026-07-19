# Network Review Workspace Specification

## Primary question

**What changed, what supports it, and may Clarity safely use it?**

## Information architecture

### Queue

Columns:

- entity and scope;
- candidate field;
- proposed value;
- current value;
- review state;
- source authority;
- freshness;
- conflict indicator;
- required reviewer;
- run age;
- operational-use status.

### Candidate detail

1. Entity-resolution panel with match signals and alternatives.
2. Side-by-side current and proposed value.
3. Evidence cards with source tier, URL, date, scope and minimum excerpt.
4. Conflict panel preserving all competing values.
5. Freshness timeline.
6. Review requirement and approval progress.
7. Audit history.
8. Actions: approve, reject, request clarification, resolve conflict, suspend.

## Required states

- loading;
- no candidates;
- ambiguous entity;
- conflict;
- stale source;
- partial source coverage;
- source unavailable;
- unauthorized scope;
- concurrency conflict;
- idempotent replay;
- dual-review pending;
- rejected/superseded;
- integration failure.

## Interaction rules

- Never preselect approve.
- Never hide lower-authority conflicting evidence.
- Show organization/location/program scope beside every value.
- Require rationale for rejection, override or conflict resolution.
- Disable operational activation until approval quorum is complete.
- Deep-link to the exact approved network profile after completion.

## Accessibility

- Keyboard-complete review flow.
- Status text and icons; never color alone.
- Evidence links have descriptive accessible names.
- Comparison tables preserve logical reading order.
- Conflicts and stale warnings are announced to assistive technology.
- Reduced-motion support.
