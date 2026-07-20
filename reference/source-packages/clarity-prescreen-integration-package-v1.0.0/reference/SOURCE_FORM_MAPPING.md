# Source Form Mapping

## Source 1 — Referral packet checklist

The first supplied image is treated as a representative field-facing checklist used to help referral sources assemble records before submitting to Central Intake.

Generic concepts extracted:

- demographics/face sheet;
- recent nursing notes and behavior documentation;
- provider order;
- current MAR;
- current TAR;
- labs, history and physical, and recent provider documentation when available;
- recent falls, wounds, oxygen, equipment, dietary needs, and precautions;
- return-to-facility and discharge/placement planning;
- sender identity, role, facility, callback, and comments.

Product mapping:

- `ReferralPacketRequirement`
- `ReferralPacketDocument`
- nursing/medical assessment answers
- placement/continuity tasks
- sender/source/communication records

## Source 2 — Brief prescreen assessment

The second supplied image is treated only as a structural example of a one-page field assessment that is completed, reviewed, and sent to Central Intake.

Generic concepts extracted:

- referral and patient identifiers;
- current location and source contact;
- presenting problem and observed/reported symptoms;
- risk and safety information;
- orientation and willingness;
- psychiatric, medical, substance-use, medication, and treatment history;
- insurance preparation;
- disposition/level-of-care request;
- assessor review/signature and intake follow-up.

Product mapping:

- `PrescreenEncounter`
- `AssessmentVersion`
- `AssessmentAnswer`
- `PrescreenSource`
- `OrientationObservation`
- `PatientWillingness`
- `PossibleAdmissionPathway`
- `AuthorizedReview`
- `WorkflowTask`
- `ReferralPacket`

## PHI handling

The completed second image appears to contain patient-level information. It is intentionally excluded from this package, its source-material folder, tests, examples, and code.

No names, dates of birth, Social Security numbers, insurance identifiers, diagnoses, narratives, signatures, or other patient values from the image are reproduced.

## Design conclusion

The forms define the **maximum information envelope**, not the desired screen design. Clarity should gather information progressively and reuse it across assessment, packet, Central Intake, facility review, and handoff.
