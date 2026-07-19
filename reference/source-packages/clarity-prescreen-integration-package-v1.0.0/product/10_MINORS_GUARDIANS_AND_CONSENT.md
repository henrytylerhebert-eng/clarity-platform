# Minors, Guardians, and Consent

## Product rule

Clarity must not use a single “guardian can sign” switch. Authority depends on:

- jurisdiction;
- age;
- admission pathway;
- document or consent type;
- treatment/procedure;
- patient capacity and expressed position;
- parent, tutor, guardian, caretaker, public-custodian, or court authority;
- privacy regime;
- facility policy;
- effective date and rule approval.

## Required identities and evidence

- patient/minor identity and age;
- adult signer identity;
- relationship type;
- legal authority basis;
- supporting document or verification method;
- scope and expiration of authority;
- patient/minor preference or objection;
- witness/notary/clinician/court requirements where applicable.

## Separate pathways

- Parent/tutor/caretaker application for admission.
- Voluntary admission by a qualifying older minor.
- Minor objection to parental admission.
- Emergency certificate.
- OPC/protective custody.
- Noncontested pathway where applicable.
- Judicial/court pathway.
- General treatment consent.
- High-risk procedure/court authorization.
- HIPAA disclosure.
- 42 CFR Part 2 disclosure.
- Transfer and discharge requests.

## System behavior

1. The user selects the action or document requiring authority.
2. The server evaluates the approved rule matrix.
3. The UI displays required signers, evidence, co-signers, court/clinician review, and patient signature/assent requirements.
4. The user records actual signatures and authority evidence.
5. The system never auto-signs or treats relationship as proof without required evidence.
6. A changed age, status, facility, or treatment can invalidate a previously proposed signature route and requires reevaluation.

## Preserving the minor’s position

Always record:

- willing;
- non-opposed;
- objecting;
- unable to communicate;
- fluctuating;
- not assessed.

The minor’s expressed position remains visible even when another person is authorized to apply, consent, or receive information.

## Privacy

A person authorized for admission or treatment is not automatically authorized for every disclosure. HIPAA and 42 CFR Part 2 decisions use separate rule scopes.

## Production gate

The supplied `contracts/minor-consent-baseline.csv` is a research baseline, not executable production law. Each rule must be verified, approved, versioned, and assigned to a facility/jurisdiction profile before activation.
