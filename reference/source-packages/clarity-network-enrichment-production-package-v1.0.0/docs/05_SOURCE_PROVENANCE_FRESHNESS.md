# Source Authority, Provenance and Freshness

## Source tiers

| Tier | Source class | Default use |
|---:|---|---|
| 1 | Official organization or parent website | Identity, locations, programs, contacts; still scoped and dated. |
| 2 | Federal government/provider database | Identifiers, certification, participation. |
| 3 | Louisiana Department of Health | Licensing, program and regulatory directory data. |
| 4 | Medicare/CMS | Certification and public participation information. |
| 5 | Official licensing board or government directory | Licensed status and identifiers. |
| 6 | Parish, coroner, municipal or state site | Public authority contacts and jurisdiction data. |
| 7 | Accredited professional directory | Supplemental verification. |
| 8 | Reputable secondary source | Leads and corroboration. |
| 9 | Commercial directory | Discovery and low-risk corroboration only. |
| 10 | Search engine, map listing or social page | Discovery only; not sufficient for operational fields. |

## Field-specific authority

A source can be authoritative for one field and weak for another. A licensing database may establish license status but not current intake hours. An official facility page may establish a phone number but not current insurance eligibility.

## Evidence requirements

Each evidence record must include:

- source type and tier;
- field paths supported;
- organization/location/program scope;
- URL and title;
- retrieved time;
- effective or published time when known;
- minimum-necessary excerpt or faithful summary;
- content hash;
- status: active, unavailable, archived, superseded or disputed.

## Freshness defaults

| Field category | Review interval |
|---|---:|
| Legal identity | 365 days |
| License/certification | 30 days |
| Address | 180 days |
| Website | 90 days |
| General phone | 60 days |
| Admissions phone | 30 days |
| Operating hours | 30 days |
| Public personnel | 45 days |
| Service lines | 90 days |
| Payer participation | 30 days |
| Admission requirements | 30 days |
| Transport capability | 30 days |
| Capacity | 7 days |
| Active/closed status | 30 days |

Intervals are configurable policy, not universal truth.

## Freshness states

- `CURRENT`
- `DUE_SOON`
- `STALE`
- `EXPIRED`
- `UNKNOWN`

The system must show the source effective date, retrieval date, last human verification and next review date separately.
