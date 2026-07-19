# Error Catalog

## Error shape

```json
{
  "error": {
    "code": "PRESCREEN_VERSION_CONFLICT",
    "message": "The record changed. Refresh and review before trying again.",
    "requestId": "req_synthetic_001",
    "retryable": false,
    "details": []
  }
}
```

## Rules

- Messages must not disclose whether an unauthorized identifier exists.
- Validation details may name safe field paths but may not echo sensitive values.
- Infrastructure errors are translated to stable public codes.
- Full errors and request bodies are never logged with PHI.

| Code | HTTP | Retryable | Meaning |
|---|---:|---:|---|
| `AUTHENTICATION_REQUIRED` | 401 | No | No valid principal. |
| `PERMISSION_DENIED` | 403 | No | Principal lacks capability or authority. |
| `RESOURCE_NOT_FOUND` | 404 | No | Resource absent or not visible; use same response for both. |
| `INVALID_COMMAND` | 400 | No | Malformed envelope or unknown fields. |
| `DOMAIN_VALIDATION_FAILED` | 422 | No | Command conflicts with domain requirements. |
| `PRESCREEN_VERSION_CONFLICT` | 409 | No | Expected version differs from current version. |
| `IDEMPOTENCY_KEY_REUSED` | 409 | No | Key was used with a different command/body hash. |
| `ASSESSMENT_NOT_DRAFT` | 409 | No | Attested/superseded version cannot be edited. |
| `ASSESSMENT_ATTESTATION_BLOCKED` | 422 | No | Required review or emergency interruption remains unresolved. |
| `ASSESSMENT_VERSION_REQUIRED` | 422 | No | Submission/packet lacks an immutable assessment version. |
| `FORMAL_VOLUNTARY_GATE_NOT_MET` | 422 | No | Owner-defined orientation gate is not met; route to authorized review. |
| `AUTHORIZED_REVIEW_REQUIRED` | 422 | No | Requested state requires a configured human authority. |
| `FACILITY_PROFILE_MISSING` | 422 | No | No approved profile exists for the named target. |
| `FACILITY_PROFILE_STALE` | 422 | No | Profile expired or requires review. |
| `PACKET_REQUIREMENT_BLOCKING` | 422 | No | Named readiness target has unresolved blocking requirements. |
| `DOCUMENT_VERSION_INVALID` | 422 | No | Document version is missing, rejected, stale, or outside the case. |
| `CONSENT_AUTHORITY_UNRESOLVED` | 422 | No | Signer/action rule cannot be established. |
| `TRANSPORT_AUTHORITY_MISSING` | 422 | No | Required instrument/status/authority is missing or expired. |
| `TRANSPORT_CATEGORY_BLOCKED` | 422 | No | Requested category is prohibited by the active profile. |
| `TRANSPORT_PROVIDER_NOT_QUALIFIED` | 422 | No | Credential, service-area, contract, capability, or policy gate failed. |
| `TRANSPORT_DESTINATION_NOT_CONFIRMED` | 422 | No | Dispatch requires an approved destination. |
| `CUSTODY_SEQUENCE_CONFLICT` | 409 | No | Event cannot follow the current custody state. |
| `EXTERNAL_CHANNEL_FAILED` | 502 | Yes | Approved external channel failed. |
| `INTEGRATION_MAPPING_FAILED` | 422 | No | Source value could not be mapped to a canonical contract. |
| `RATE_LIMITED` | 429 | Yes | Caller exceeded the approved limit. |
| `SERVICE_UNAVAILABLE` | 503 | Yes | Temporary dependency outage. |
