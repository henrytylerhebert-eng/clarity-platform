# Codex Prompt 05 — Request-Broadcast Routing

Build the routing skeleton without creating a stale bed registry.

Model:

- Sender creates referral packet.
- Facilities receive broadcast request.
- Facility responds with accept, decline, or request more information.
- Responses are logged with reason codes and timestamps.
- Acceptance receipt attaches to the packet and custody ledger.
- Declines remain part of the history.

Do not build live integrations yet.

Use mock facilities and mock responses.

Analytics to prepare:

- time to first response
- time to acceptance
- decline reasons
- missing information requests
- referral packet completeness
- acceptance rate by facility
