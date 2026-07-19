# Screen Contracts

## Route proposal

These are hypotheses to reconcile with the live router.

```text
/prescreens
/prescreens/new
/prescreens/:encounterId/overview
/prescreens/:encounterId/assessment
/prescreens/:encounterId/review
/prescreens/:encounterId/packet
/prescreens/:encounterId/communications
/prescreens/:encounterId/facility-review
/prescreens/:encounterId/transport
/prescreens/:encounterId/timeline
/central-intake/prescreens
/configuration/facility-profiles
/configuration/transport-providers
/configuration/consent-rules
```

## Query contracts

Every case screen needs:

- `permissions` — server-derived action flags;
- `projectionVersion` — read-model position;
- `freshness` — last material event and stale state;
- `sourceVersions` — active facility/jurisdiction profile versions;
- `correctionState` — whether newer/superseding data exists;
- `openTasks` and blocker count;
- `privacyScope` — user-visible statement of access boundary.

## Mutation behavior

- Disable buttons based on server permission projection, but expect server denial.
- Include idempotency key, correlation ID, and expected version.
- On 409, refresh and show a compare/reconcile experience.
- On 422, map safe field errors and preserve entered work.
- Never optimistic-update legal status, attestation, facility acceptance, transport qualification, or custody transfer.
