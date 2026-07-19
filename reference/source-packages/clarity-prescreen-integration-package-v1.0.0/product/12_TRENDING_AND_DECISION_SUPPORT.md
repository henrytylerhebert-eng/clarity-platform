# Trending and Decision Support

## Goal

Use governed operational events to anticipate workload and coordination needs—not patient-level clinical or legal conclusions.

## Initial aggregate measures

- prescreens started/submitted/completed;
- time from start to attestation;
- time to Central Intake acknowledgement;
- number and type of information requests;
- time waiting internally vs externally;
- reassessment requested and completed times;
- time to authorized review;
- time to facility response;
- transport request-to-pickup time;
- transport exceptions and cancellations;
- custody handoff completion;
- packet requirement failure frequency;
- communication channel success/failure;
- profile/rule causing repeated blockers.

## Intoxication and fluctuating orientation

The system may trend:

- how often reassessment is requested;
- observed time intervals by facility/team/context;
- which roles are involved;
- how often orientation findings change;
- how often the eventual pathway changes;
- common operational delays.

It may not:

- estimate that a named patient is now capable;
- recommend a legal status;
- predict dangerousness;
- substitute a historical average for clinical reassessment.

## Required metadata

Every aggregate includes:

- organization/facility/program scope;
- date range;
- numerator/denominator;
- definition version;
- source event coverage;
- completeness and freshness;
- exclusions;
- small-cell suppression;
- late/corrected data indicator;
- `No measurements found` when empty.

## Forecasting boundary

Later operational estimates may forecast queue volume, staffing demand, or likely wait intervals. They require:

- approved use case;
- validation data;
- uncertainty display;
- monitoring for drift and subgroup performance;
- no autonomous case decision;
- human-readable explanation of inputs and limitations.
