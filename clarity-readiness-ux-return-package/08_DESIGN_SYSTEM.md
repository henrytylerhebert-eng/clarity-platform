# Design System

The slice extends the existing Clarity prototype system instead of creating a parallel component library.

Preserved primitives:

- Sidebar navigation.
- Topbar status badges.
- Panels with 8px radius.
- Tables for dense structured review.
- `StatusBadge` tones: neutral, good, warn, danger, info.
- Existing `mode-toggle`, labels, select controls, and secondary buttons.

Added patterns:

- Dependency node with color-independent status badge and text label.
- Readiness summary strip.
- Read-only warning callout.
- Split activity/provenance panel.
- Queue scale grid.
- Visible focus state for buttons, inputs, selects, and textareas.

Accessibility constraints:

- Visual map has a structured table equivalent.
- Status is conveyed with text, not color alone.
- Filters are native selects.
- Workspace links are buttons with accessible names.

