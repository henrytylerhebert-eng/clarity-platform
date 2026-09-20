# Current Repository State

**Verified repository:** `henrytylerhebert-eng/clarity-platform`  
**Verified `main`:** `43070937c9a912ebf155b81536d60e8595f7d09a`  
**Merged artifact:** PR #133 — `feat(contracts): longitudinal vertical slice v0.1`

## Verified implementation facts

At this anchor:

- `Episode` remains the admission-anchored inpatient stay.
- `CaseEpisodeLink` links Access and inpatient records without merging them.
- `JourneyPhase` is a derived projection.
- governed event and outbox foundations exist.
- Access Case has a governed read model and read-only Access Snapshot-derived surface.
- Episode authorization, authorization review, authorization day decisions, and DocumentationGap patterns exist.
- Longitudinal contract-only types, pure projection functions, Day 1 → Day 39 synthetic fixture, and unit acceptance tests are merged.

## Not yet authorized / not yet implemented as production persistence

- persisted `DischargePlan`
- persisted `TransitionBarrier`
- persisted `CareTransition`
- persisted `LevelOfCareRecommendation`
- persisted `ClinicalDischargeReadinessDecision`
- longitudinal mutating APIs
- actual-discharge governed command
- governed longitudinal UI mutation
- AI command execution
- monolithic `Continuity` entity
- persisted `PendingDischarge`
- persisted master `TransitionReadiness`
- persisted first-slice `LongitudinalCareJourney` parent aggregate

## Important product truth

The current repository remains a mixed-state product:

- some workflows are governed/API-backed;
- portions of the Crisis Ops UI remain prototype/local state;
- the UX architecture is ahead of some frontend implementation;
- the product is not a deployed clinical system;
- synthetic-only boundaries remain controlling.


