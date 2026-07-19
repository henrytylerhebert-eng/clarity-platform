# Transport and Custody

## Operational definition

**Secured behavioral-health transport** is transportation under an approved legal, clinical, or facility pathway by an authorized entity using trained personnel, an approved transport method, continuous supervision or custody, destination confirmation, and documented transfer of responsibility.

This is a Clarity operational definition. It is not presented as a verbatim statutory definition.

## Transport categories

- `LAW_ENFORCEMENT_CUSTODY`
- `LICENSED_AMBULANCE_EMS`
- `CONTRACTED_SECURE_BEHAVIORAL_TRANSPORT`
- `INTERFACILITY_CLINICAL_TRANSPORT`
- `TRANSPORTATION_BROKER`
- `NEMT_CARRIER`
- `FAMILY_OR_SUPPORT_TRANSPORT`
- `SELF_TRANSPORT`

## Qualification gates

The server returns a provider only when the active rule profile confirms all applicable gates:

1. legal/instrument authority;
2. allowed provider category;
3. current credential verification;
4. insurance and contract state;
5. service area;
6. sending-facility approval;
7. receiving-facility approval;
8. patient medical and behavioral capability match;
9. supervision/custody capability;
10. required documents and accompaniment;
11. destination confirmation;
12. no unresolved disqualifying restriction.

## Instrument rule

Under the owner-defined launch policy, active OPC, PEC, or CEC pathways block:

- family transport;
- friend/support-person transport;
- rideshare;
- taxi;
- self transport;
- unsecured facility vehicle.

Allowed categories are profile-driven and may include law enforcement, ambulance, or approved contracted secure transport.

## Law-enforcement OPC pickup

Capture:

- issuing authority;
- order identifier and effective/expiration time;
- executing agency;
- officer/deputy and identifier;
- pickup location and time;
- whether the agency transports or transfers custody;
- accepting transporter when custody changes;
- destination;
- order delivery and receiving acknowledgement.

## Brokered transportation

The record separates:

- arranger/broker;
- actual transport carrier;
- actual personnel/vehicle/category;
- credential decision used for the trip.

A broker name alone cannot close the transport task.

## Custody event types

- authority received;
- pickup requested;
- provider qualified;
- dispatch accepted;
- patient taken into custody;
- custody transferred to transporter;
- departed origin;
- arrived destination;
- documents transferred;
- receiving person accepted custody;
- exception/delay;
- transport cancelled;
- patient returned/re-routed.

## Exception handling

An exception requires:

- rule that would normally apply;
- exception type;
- approving authority;
- rationale;
- time and expiration;
- alternate safety plan;
- sending and receiving acknowledgement;
- audit event.

The software does not invent emergency exceptions. Facilities configure approved exception paths.

## Provider examples

- Law enforcement: public custody transport when authorized.
- Acadian Ambulance: ambulance-provider candidate; live verification required.
- Secure Patient Delivery: contracted secure-transport candidate; live regulatory, contract, credential, and local-authority verification required.
- MediTrans: arranger/broker candidate; capture the actual assigned carrier.

## Restraint boundary

Secured transport does not automatically authorize restraint. Restraint requires its own legal/clinical authority, order, type, monitoring, duration, and documentation.
