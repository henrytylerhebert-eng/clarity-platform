# Accessibility and Content Standards

## Accessibility target

Design and test toward WCAG 2.2 AA for the web application, while validating field/mobile use with actual users.

## Required behaviors

- Complete keyboard operation.
- Visible focus order and skip links.
- Screen-reader names, roles, states, and error associations.
- Color-independent status language and icons.
- Minimum touch-target size suitable for mobile field use.
- Reduced-motion support.
- Text resizing and responsive reflow.
- Form errors summarized and placed beside the field.
- Save state and recovery after interruption.
- Plain-language labels with access to technical/legal terminology.
- No timers that remove work without warning and extension.

## Content standards

- Use `Unknown` and `Not assessed`; never convert blank to “No.”
- Label observations, patient reports, collateral, records, and system-derived status.
- Avoid diagnostic or legal conclusions in field prompts unless the user is authorized and the workflow requires them.
- Explain why sensitive questions are asked.
- State who can see information before external users submit it.
- Avoid “cleared,” “approved,” or “qualified” without naming the authority and target.
- Use `Ready for Central Intake review`, not simply `Ready`.
- Use exact timestamps and timezone in legal/transport/custody views.

## Mobile/offline design

- Save drafts locally only through an approved encrypted mechanism.
- Display offline status and last successful sync.
- Prevent two conflicting attestations through server version checks.
- Allow rapid emergency interruption without losing draft work.
- Avoid requiring document upload before the user can record urgent facts.

## Error and stale states

Every workspace handles:

- loading;
- empty;
- offline;
- retrying;
- stale data;
- partial sync;
- version conflict;
- unauthorized;
- integration failure;
- missing facility profile;
- expired rule/profile;
- document rejected;
- source disagreement;
- corrected/superseded information.
