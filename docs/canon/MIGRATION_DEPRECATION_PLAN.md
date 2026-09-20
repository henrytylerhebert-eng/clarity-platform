# Migration & Deprecation Plan v1.0

## Classification labels

Every existing or proposed surface must be labeled:

- KEEP
- EXTEND
- DERIVE
- MIGRATE
- DEPRECATE
- REMOVE LATER

## KEEP

- PatientToken
- BehavioralHealthCase
- Prescreen domain
- CaseEpisodeLink
- Episode
- Episode authorization/review/day decision
- DocumentationGap
- GovernedEvent/outbox
- audit/correction/supersession patterns
- Tree 4 shell
- traditional Work paradigm

## EXTEND

- domain contracts
- governed read models
- History
- provenance/derivation trace
- 2D Explore
- Query/Trace
- longitudinal projections

## DERIVE

- JourneyPhase
- PendingDischarge
- TransitionReadiness
- barrier age
- LongitudinalCareJourney
- profiles that summarize independent governed facts/observations

## MIGRATE

- consequential localStorage-only experiences when governed service/read/write paths exist
- developer/QA labels into user-facing language
- prototype persona controls into explicit Scenario/Training boundaries

## DEPRECATE

- generic overloaded status semantics
- direct presentation of internal candidate IDs
- UX that makes demo role selection look like authentication/authority
- redundant navigation surfaces
- new canonical behavior added to localStorage-only pathways

## REMOVE LATER

Only after replacement is verified:

- superseded prototype-only screens;
- duplicated navigation;
- obsolete technical-language surfaces;
- any global classic/spatial product split.

## Safety rule

No legacy surface is removed solely because a new architecture document exists.

Replacement must be implemented and verified first.


