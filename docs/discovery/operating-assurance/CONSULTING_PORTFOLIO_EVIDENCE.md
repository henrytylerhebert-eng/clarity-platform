---
status: Accepted Product Intelligence evidence
owner: Tyler Hebert
version: 0.2.0
date: 2026-07-30
stage: product-intelligence
data_boundary: Anonymized folder metadata and aggregate counts only; no client names, source content, PHI, PII, findings, contracts, or credentials
source_scope:
  - Authorized shared-drive collection for consulting delivery
  - Authorized shared-drive collection for consulting methods and operations
related_artifacts:
  - docs/discovery/SHARED_DRIVE_OPERATING_PATTERN_AUDIT.md
  - docs/discovery/operating-assurance/IDEA_OPPORTUNITY_ASSESSMENT.md
  - docs/discovery/operating-assurance/PLATFORM_INTELLIGENCE_CORPUS_STRATEGY.md
---

# Consulting Portfolio and Scope Evidence

## Purpose

This artifact preserves the aggregate evidence used to define the
operating-assurance product. It is a portfolio-volume and delivery-pattern
analysis, not a revenue, contract, margin, or active-client ledger.

The analysis was read-only and metadata-first. Client names and source content
are intentionally excluded.

## Evidence classes

| Evidence | Classification | Meaning |
|---|---|---|
| Direct children of the seven explicit `Current` portfolio collections | Verified | Current-labeled client, facility, project, and resource folders |
| Exclusion of template, resource, internal, and nested archive nodes | Verified | Metadata classification; no content interpretation |
| Normalized client-type groups | Inferred | Folder units are not guaranteed to equal legal clients or contracts |
| Visible scope prevalence | Inferred lower bound | Immediate folder/document names indicate a scope family; percentages overlap |
| Survey ledger roster and events | Documented historical activity proxy | The ledger was last modified 2025-04-01 and is not a current book ledger |
| Operating use since 2020 | Reported by owner; consistent with documented 2019-2026 dated artifacts | Establishes longitudinal use of the consulting method, not software-product adoption |
| Revenue, margin, hours, renewal, and contract status | Unknown | No billing, CRM, signed-SOW, or time source was reviewed |

## Current-labeled portfolio census

The seven `Current` collections contain 103 immediate directories. Twelve
template, resource, internal, or nested-archive nodes were excluded, leaving
91 client/engagement-like folder units.

| Portfolio lane | Units | Share |
|---|---:|---:|
| Rural-health clinic engagements | 27 | 29.7% |
| Independent in-state hospital/facility engagements | 23 | 25.3% |
| Enterprise network A facilities | 16 | 17.6% |
| Heterogeneous special projects | 14 | 15.4% |
| Independent out-of-state hospital/facility engagements | 5 | 5.5% |
| Enterprise network B facilities | 5 | 5.5% |
| Enterprise network C facilities | 1 | 1.1% |
| **Total** | **91** | **100.0%** |

Normalized:

| Client-type group | Units | Share |
|---|---:|---:|
| Hospital/facility lanes | 50 | 54.9% |
| Rural-health clinics | 27 | 29.7% |
| Heterogeneous special projects | 14 | 15.4% |

Explicit folder naming provides conservative, overlapping lower bounds:

- behavioral-health, psychiatric, recovery, or treatment: 23 units, 25.3%;
- ambulatory, clinic, surgical, or medical-office: 24 units, 26.4%;
- post-acute, hospice, skilled-nursing, or assisted-living: 4 units, 4.4%;
- correctional: 2 units, 2.2%;
- tribal: 1 unit, 1.1%; and
- telehealth: 1 unit, 1.1%.

Behavioral-health work is larger than the explicit 25.3% naming signal because
some enterprise and hospital lanes contain behavioral-health facilities
without repeating the type in every immediate folder name.

## Visible scope prevalence

Percentages overlap because one workspace can contain several scope families.
They measure visible metadata signals, not completed deliverables or revenue.

| Scope family | Units | Portfolio prevalence |
|---|---:|---:|
| Reporting, logs, monitoring, or trackers | 51 | 56.0% |
| Policy, SOP, or document control | 39 | 42.9% |
| Survey, readiness, accreditation, or regulatory work | 33 | 36.3% |
| Quality, audit, risk, or assessment | 28 | 30.8% |
| Governance, HR, committees, or staffing | 27 | 29.7% |
| Startup, licensure, enrollment, or credentialing | 25 | 27.5% |
| Training, onboarding, or competency | 21 | 23.1% |
| Facility, life-safety, or emergency preparedness | 21 | 23.1% |
| Infection prevention | 20 | 22.0% |
| Corrective action, remediation, or closeout | 19 | 20.9% |

Thirty-nine units, 42.9%, expose at least three scope families. Thirty-two
units, 35.2%, expose at least five. The evidence supports a configurable
multi-scope operating system rather than a single policy-writing utility.

## Historical survey-activity cross-check

A separate survey ledger contains 60 facility roster entries and 29 recorded
survey events:

| Facility segment | Roster entries | Share of roster | Recorded events | Share of events |
|---|---:|---:|---:|---:|
| Out-of-state, behavioral-health-dominant | 29 | 48.3% | 20 | 69.0% |
| In-state hospitals | 13 | 21.7% | 3 | 10.3% |
| Rural-health clinics | 18 | 30.0% | 6 | 20.7% |
| **Total** | **60** | **100.0%** | **29** | **100.0%** |

Twenty-four events are dated 2024 and five are dated 2025. The ledger was last
modified 2025-04-01. It establishes historical activity concentration, not
current demand or decline.

## Consulting methods and delivery assets

The operations collection contains 3,121 files:

| Collection classification | Files | Share |
|---|---:|---:|
| Shared consultant capability/reference assets | 2,170 | 69.5% |
| Client/network-specific collections | 550 | 17.6% |
| Explicit top-level archive | 308 | 9.9% |
| Internal administration, HR, meetings, and finance | 90 | 2.9% |
| System noise | 3 | 0.1% |

Within 1,476 files explicitly organized as consultant-delivery assets:

| Scope family | Files | Share |
|---|---:|---:|
| Hospital consulting | 625 | 42.3% |
| Infection-control consulting | 599 | 40.6% |
| Reusable delivery tools | 245 | 16.6% |
| Onboarding, education, or other | 7 | 0.5% |

These counts indicate the concentration and repeatability of delivery
artifacts. They do not measure the value, frequency, or profitability of the
underlying engagements.

## Longitudinal operating adoption

**[Reported]** The owner states that these tools, workflows, evidence methods,
and plans of correction have been used in consulting delivery since 2020 and
have contributed to building the business.

**[Documented]** The source audit found explicit filename years from 2019
through 2026, substantial annual/version segmentation in 2022 through 2024,
recent-looking 2025-2026 material, recurring annual plans and evaluations, and
1,476 explicitly organized delivery assets. The current-labeled portfolio
also contains 91 client/engagement-like units across multiple healthcare
settings.

**[Inferred]** The combination is strong evidence of operational adoption and
practical value for the underlying consulting method. It is stronger than an
untested workflow hypothesis.

This evidence does not yet establish:

- adoption or usability of a client-operated software interface;
- software pricing or willingness to pay;
- software-driven consultant leverage;
- the correctness or current applicability of every historical output;
- authorization to use every client or licensed artifact for shared model
  training; or
- measured financial, compliance, survey, or clinical outcomes.

## Product implications

1. **Reported and documented:** The consulting method has longitudinal
   operating adoption, and delivery repeatedly produces policies, trackers,
   surveys, evidence records, actions, training, and closeout artifacts.
2. **Inferred:** The reusable asset is the connected operating-assurance loop,
   not an isolated document template.
3. **Inferred:** Hospitals/facilities form the largest visible portfolio lane,
   with a strong behavioral-health concentration; RHC work is the second
   largest coherent lane.
4. **Inferred:** The first product must support multiple scope families inside
   one organization/facility workspace.
5. **Inferred:** A consultant control plane plus a client workspace reflects
   the observed delivery model better than either an internal-only toolkit or
   an unsupported client self-service portal.
6. **Inferred:** The longitudinal corpus is a proprietary product-intelligence
   asset for ontology, workflow logic, templates, evaluation, tenant-private
   retrieval, and human-reviewed assistance after rights and privacy review.
7. **Unknown:** Software willingness to pay, preferred software buyer,
   replacement budget, incumbent system, software adoption friction, and
   actual revenue concentration.

## Limitations

- A folder unit may be a client, facility, network, project, service line, or
  duplicate.
- A `Current` label and a visible year do not prove an active contract.
- One parent organization may span several facilities or folders.
- Scope folders may contain templates, references, or dormant work.
- Archive counts were not deduplicated and are excluded from the denominator.
- No contract, invoice, CRM, time, margin, or renewal source was used.
- Longitudinal use is owner-reported and supported by dated artifacts; the
  metadata alone cannot prove how often each individual file was used.
- No content-level rights, privacy, licensing, correctness, or outcome-label
  audit was performed.

The defensible statement is therefore:

> The evidence establishes a multi-scope consulting portfolio, a repeatable
> operating-assurance delivery system, and strong longitudinal adoption of the
> underlying consulting method. It does not establish the financial book of
> business, adoption of a software product, or blanket authorization to use
> historical client material as shared model-training data.
