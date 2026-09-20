# Current → Target System Map

## Current spine

```text
app/
  mixed prototype + selected governed read surfaces
        │
packages/api-service
        │
domain services
        │
packages/case-repository
        │
Prisma / PostgreSQL

packages/domain-contracts
  shared contract/state-machine layer
```

## Preserve

- `PatientToken`
- `BehavioralHealthCase`
- Prescreen domain
- `CaseEpisodeLink`
- existing `Episode`
- Episode authorization/review/day decision
- `DocumentationGap`
- `GovernedEvent`
- outbox/audit/correction/supersession patterns
- derived `JourneyPhase`
- Access governed read model
- Tree 4 shell architecture

## Extend

- longitudinal contract layer
- read models spanning Access → Episode → transition → continuity
- provenance/derivation trace
- History projection
- read-only Explore relationship projection
- Query / Trace support for Ask Clarity

## Add only after semantic/authorization gate

- `DischargePlan`
- `TransitionBarrier`
- `CareTransition`
- append-only `LevelOfCareRecommendation`
- append-only `ClinicalDischargeReadinessDecision`
- actual-discharge command/event contract
- continuity source adapters/event ingestion

## Derive, never persist as master state

- `PendingDischarge`
- `TransitionReadiness`
- barrier age
- CareIntensityProfile
- RecoveryProfile
- EnvironmentSupportProfile
- LongitudinalCareJourney

## Deprecate / prevent expansion

- generic master `status` semantics that mix unrelated meanings
- new canonical functionality in consequential localStorage-only surfaces
- global Traditional vs 3D product toggle
- AI-generated scores used as authority
- direct UI/AI database mutation


