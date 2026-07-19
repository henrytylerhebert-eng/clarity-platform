# Observability Plan

## Principles

- No PHI, source text, tokens, legal instrument contents, or unrestricted request bodies in logs.
- Every request, command, event, task, packet transmission, integration delivery, and transport qualification has correlation.
- Operational metrics describe system/process behavior, not patient risk.

## Logs

Structured fields:

- request ID;
- correlation/causation ID;
- service/component;
- organization token or approved internal ID;
- actor type/role category, not unnecessary identity;
- command/query name;
- result/error code;
- duration;
- aggregate type and safe opaque ID;
- schema/profile/rule versions;
- retry/replay state.

## Metrics

### API/service

- request count/error/latency by route and safe status;
- authentication/authorization denial count;
- command conflict/idempotency replay;
- database transaction duration;
- outbox age/backlog/retry/dead-letter;
- projection lag.

### Workflow

- open/overdue tasks by owner organization and external/internal wait;
- information-request cycles;
- packet blocker categories;
- profile missing/stale evaluations;
- transport qualification failure categories;
- custody exception count;
- communication delivery failure.

### Security

- denied cross-tenant attempts;
- expired/replayed secure links;
- malware/document rejection;
- credential/profile approval changes;
- suspicious rate/identifier enumeration.

## Tracing

Trace across:

- API request;
- application command;
- database transaction;
- outbox publication;
- projection update;
- external adapter delivery.

Do not attach PHI attributes.

## Alerts

- sustained API error rate;
- authentication service failure;
- database unavailability;
- outbox/projection lag threshold;
- failed packet transmissions;
- transport provider credential expiration approaching;
- facility profile expiration;
- custody event sequence failure;
- backup/restore or monitoring failure.

## Audit review

Audit is separate from observability. Operational logs may expire faster; audit retention follows approved policy and remains append-only.
