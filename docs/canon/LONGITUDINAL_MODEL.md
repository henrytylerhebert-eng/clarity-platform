# Clarity Longitudinal Model v1.0

## Governing statement

Clarity follows the person longitudinally across bounded operational records and reconstructs the longitudinal care journey from those records.

It does not store one monolithic mutable patient story.

## Core structure

```text
PatientToken
│
├── Access Case #1
├── Inpatient Episode #1
│   ├── clinical decisions
│   ├── actual care
│   ├── coverage/authorization
│   ├── discharge planning
│   └── transition preparation
├── Care Transition
├── Continuity Events
│
├── later Access Case
├── later Inpatient Episode
└── ...
        │
        ▼
 Longitudinal projection
```

## Episode rule

Existing `Episode` remains:

> admission-anchored inpatient stay.

Lifecycle remains conceptually:

`ACTIVE → DISCHARGED → CLOSED`

Do not broaden it into the entire care journey.

## Separate longitudinal dimensions

### Care need / clinical trajectory
- acuity;
- medical necessity;
- LOC recommendation;
- treatment response.

### Recovery / function
- symptoms;
- daily function;
- treatment engagement;
- self-management;
- cognitive/function observations;
- patient-defined goals.

### Environment / support
- housing;
- family/caregiver support;
- transportation;
- medication access;
- community resources;
- receiving-setting capability;
- supervision/basic needs.

### Care-delivery trajectory
- actual LOC;
- treatment/intervention;
- inpatient stay;
- next LOC.

### Coverage trajectory
- payer requirement;
- authorization;
- approved/denied/pending days.

### Transition trajectory
- discharge planning;
- clinical discharge readiness;
- transition readiness;
- barriers;
- destination attempts;
- actual discharge.

### Continuity trajectory
- follow-up;
- next LOC started;
- medication access/fill observation;
- ED use;
- readmission;
- source-coverage status.

## LOC spectrum

Never collapse:

- clinically recommended LOC;
- payer-authorized LOC;
- available LOC;
- patient-preferred LOC;
- actual LOC.

Disagreement is often the operational story.

## Discharge model

Clinical stabilization
≠ clinical discharge readiness
≠ transition readiness
≠ actual discharge
≠ continuity achieved

## Continuity model

Continuity is event-based and bounded by governed observation windows.

Missing data remains unknown unless source completeness supports a stronger statement.

## Longitudinal projection

`LongitudinalCareJourney` is derived first.

A durable parent aggregate may only be introduced later if independent identity/lifecycle/correction requirements prove the projection cannot be derived reliably.


