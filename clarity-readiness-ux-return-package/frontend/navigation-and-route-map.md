# Navigation And Route Map

The app does not use URL routes for workspace selection today. Workspace navigation is centralized in `app/src/App.tsx` and role visibility is centralized in `app/src/domain/roles.ts`.

Added workspace:

- ID: `dependency-map`
- Label: `Dependency Map`
- Visible to all-workspaces demo, central intake, compliance/legal, and executive roles.

Context preservation:

- Selected case remains in App state.
- Selected target transition remains in App state.
- Returning to Dependency Map restores the selected target.

