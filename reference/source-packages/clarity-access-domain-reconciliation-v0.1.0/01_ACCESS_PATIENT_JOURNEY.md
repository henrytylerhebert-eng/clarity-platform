# Canonical Access Patient Journey v0.1

**Status:** PROPOSED_ARCHITECTURE

## Journey

```text
REFERRAL
   ↓
PRESCREEN
   ↓
QUALIFIED REVIEW
   ↓
FACILITY REVIEW
   ↓
PRE-ADMISSION
   ↓
TRANSFER / HANDOFF
   ↓
ADMISSION
   ↓
EPISODE
```

The journey is the user-facing spine. Detailed domain states remain inside bounded contexts.

---

## 1. Referral

### Primary question
Why is this person entering Access, where are they now, and what is the immediate request?

### Typical facts
- referral source;
- current location;
- presenting concern;
- urgency;
- patient token / identity reference;
- known legal context;
- immediate safety information;
- sending organization or origin.

### Primary coordination role
Central Intake / Access coordination.

### Proposed primary object
`AccessCase`, currently substantially represented by `BehavioralHealthCase`.

### Exit
Prescreen begins, or the referral is closed, withdrawn, redirected, or found invalid.

---

## 2. Prescreen

### Primary question
What is known, unknown, conflicting, and source-supported right now, and which pathways require qualified review?

### Includes
- willingness;
- orientation;
- presenting concern;
- source references;
- contradictions;
- immediate medical-stabilization concern;
- emergency/legal-process indicator;
- relevant age/guardian/consent facts;
- missing information;
- assessment versions.

### Canonical engine
The existing Prescreen bounded context is the strongest current candidate for the domain engine.

### Output
Not a final admission, legal, or clinical decision.

Output is:
- possible pathway(s);
- missing information;
- blocked transitions;
- required review;
- required work.

---

## 3. Qualified Review

### Primary question
Which qualified reviews must occur before the contemplated next transition?

### Parallel lanes
- Clinical
- Medical
- Legal
- Sources / Evidence
- Benefits / UR
- Authorization

These are not a mandatory sequence.

### Coordination principle
Central Intake may own completion without owning the professional decision.

---

## 4. Facility Review

### Primary question
Will a specific receiving facility proceed with this referral?

### Inputs
- referral packet;
- reviewed source facts;
- facility-specific approved criteria;
- program/capability match;
- missing packet requirements.

### Responses
- Accept
- Decline
- Need more information
- Waitlist
- Redirect

### Boundary
**Acceptance is not admission.**

---

## 5. Pre-Admission

### Primary question
What must be completed after acceptance but before the person is admitted?

### Possible work
- receiving nursing report;
- required facility documents;
- required lab/result status;
- unit/bed/milieu review;
- authorization work;
- arrival requirements;
- transport readiness.

### Current feature candidate
Milieu Bedboard belongs here rather than in global intake navigation.

---

## 6. Transfer / Handoff

### Primary question
How is responsibility transferred safely from the current setting to the receiving organization?

### Includes
- transport;
- custody when applicable;
- sending/receiving handoff;
- documentation receipt;
- arrival coordination;
- transfer provenance.

### Cross-cutting history
The Custody Ledger / Case Timeline is a projection across phases, not a separate phase.

---

## 7. Admission

### Primary question
Has the receiving organization actually admitted the person?

### Boundary
- Facility acceptance ≠ admission.
- Transport start ≠ admission.
- Arrival ≠ necessarily completed admission.

### System transition
A confirmed admission creates or links the Episode.

```text
Access Case
    ↓
Admission
    ↓
Episode
    ↓
Inpatient / Episode Operations
```

---

# Exception Path Model

The seven stages are not a forced straight line.

```text
                       MEDICAL STABILIZATION
                     ↗
REFERRAL → PRESCREEN → QUALIFIED REVIEW → FACILITY REVIEW
                     ↘                    ↘
                 LEGAL / EMERGENCY         NEEDS INFORMATION
                 REVIEW                    DECLINE
                                           WAITLIST
                                           REDIRECT
                                           NO PLACEMENT
```

Other valid exits/diversions can include:

- alternative level of care;
- community disposition;
- cancellation;
- withdrawal;
- medical transfer;
- unresolved / undetermined pending additional facts.

Exception paths should be represented as governed transitions, not custom screen flows.
