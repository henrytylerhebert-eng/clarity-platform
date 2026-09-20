# Clarity Whole Shippable Product Specification v1.0

## 1. Product boundary

Clarity is one governed platform with multiple operational applications and representations.

For the UX/semantic work covered by this package, the core experience is a governed behavioral-health operational world where authorized people can:

- understand a Case and Episode;
- see current state without collapsing independent truths;
- know what requires attention;
- trace why Clarity believes something;
- understand what is missing or unknown;
- reconstruct change through time;
- understand relationships and dependencies;
- carry a person’s longitudinal history across bounded Cases, Episodes, transitions, and continuity observations;
- use AI to query and trace the world without surrendering human authority.

## 2. Primary interaction grammar

`Object → Context → Time → State → Attention → Query/Trace → Evidence → Authorized Action → History`

## 3. Platform representations

### Work
Traditional operating interface. Precision and authorized mutation.

### History
Temporal reconstruction and comparison.

### Explore
2D relationship understanding, with a conventional inspector.

### Flow
Cross-Case operational movement and bottlenecks.

### Ask Clarity
Language interface over Query / Trace first; governed Command later.

## 4. Core governed objects

Existing:

- PatientToken
- BehavioralHealthCase
- PrescreenEncounter
- Facility referral/response
- Episode
- EpisodeAuthorization
- AuthorizationReview
- AuthorizationDayDecision
- DocumentationGap
- GovernedEvent
- CaseEpisodeLink

Target after authorization:

- DischargePlan
- TransitionBarrier
- CareTransition
- append-only LevelOfCareRecommendation
- append-only ClinicalDischargeReadinessDecision
- typed continuity events

Derived:

- JourneyPhase
- PendingDischarge
- TransitionReadiness
- LongitudinalCareJourney
- barrier aging
- care intensity profile
- recovery/function profile
- environment/support profile
- continuity profile

## 5. Role and authority

UI visibility is not authority.

Authority is modeled as:

SEE / DO / REVIEW / DECIDE / OWN.

Qualified decision authority must be configured/governed, not guessed from job title or diagnosis.

## 6. Longitudinal product behavior

The person persists across time.

Each operational record remains bounded.

The product tells the longitudinal story by linking and projecting:

Access Case → Episode → transition → continuity.

A later Episode adds another chapter rather than rewriting the old one.

## 7. Work experience

The Work surface is Case-centered.

Cases scan:
- scope
- current phase/disposition
- attention reason
- waiting/age
- suggested next work

Case:
- Overview
- Intake
- Clinical
- Legal
- Coverage/Auth
- Placement/Handoff
- History

Details and provenance remain available without dominating the primary view.

## 8. History experience

The user can ask:

- What was true on Day 6?
- What changed by Day 8?
- What ended on Day 9?
- Which decision was superseded?
- How long was the barrier open?
- What was observed in the 7/30-day window?
- Which absence claims are actually unknown?

## 9. Explore experience

The user can traverse:

decision
→ evidence
→ plan
→ barrier
→ destination
→ transition
→ continuity

while preserving the same governed object identities and disclosure rules.

## 10. Flow experience

Once governed cross-Case query exists:

Queue and Flow are alternate renderers over the same scoped data.

Flow shows operations; it does not create a competing status system.

## 11. Ask Clarity experience

First release:

- Find
- Explain
- Compare
- Trace
- Summarize
- Show changes
- Show missing/unknown evidence

Later:

candidate proposals.

Last:

authorized commands, only through the same governed command gateway as normal UI.

## 12. AI constitutional boundary

The model cannot:

- promote inference to fact;
- promote observation to decision;
- establish clinical/payer/legal authority;
- infer actual discharge;
- infer blame from chronology;
- create universal health/readiness score as decision authority;
- bypass tenant or disclosure rules.

## 13. Current verified implementation anchor

Current `main` at `43070937c9a912ebf155b81536d60e8595f7d09a` contains the contract-only longitudinal vertical slice merged through PR #133.

That is the first executable proof of the longitudinal canon.

## 14. Ship sequence

1. Work + History read-only vertical slice
2. Ask Clarity Query/Trace
3. Explore 2D
4. Resolve 10 longitudinal gaps
5. IA-002
6. Persistence/API slice
7. Governed Work mutations
8. Flow
9. AI proposals
10. AI commands
11. Spatial feasibility

## 15. Definition of done

The product is not done because screens exist.

A slice is done only when:

- semantic contract is explicit;
- authority is explicit;
- source/provenance is explicit;
- unknown behavior is explicit;
- deterministic tests pass;
- UI uses same governed truth;
- user can understand the question the representation is intended to answer;
- no prohibited collapse or inference is introduced.


