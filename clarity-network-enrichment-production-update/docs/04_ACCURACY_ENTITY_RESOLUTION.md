# Accuracy and Entity Resolution

## Accuracy dimensions

Accuracy is evaluated independently across:

- entity identity;
- field correctness;
- source authority;
- entity scope;
- temporal freshness;
- conflict detection;
- unsupported inference rate;
- reviewer agreement.

## Explainable match signals

| Signal | Proposed weight | Notes |
|---|---:|---|
| Exact regulatory identifier | 100 | Strongest signal; conflicting identifiers are a hard conflict. |
| Official domain | 30 | Compare registrable host after normalization. |
| Exact normalized address | 25 | Requires city/state consistency. |
| Exact public phone | 15 | Supplemental, not sufficient alone. |
| Exact normalized name | 30 | Remove punctuation and common legal suffixes. |
| Alias match | 24 | Alias must be evidenced. |
| City | 10 | Prevent same-name false merges. |
| State | 5 | Required for most physical locations. |
| Parent organization | 8 | Useful for campus relationships. |
| Inactive/closed signal | -15 | Does not erase identity; changes result status. |

## Decision policy

The reference implementation uses proposed defaults:

- `MATCHED`: score ≥ 0.80 and lead over second candidate ≥ 0.15.
- `PROBABLE_MATCH`: score ≥ 0.65 with no hard conflict.
- `AMBIGUOUS`: multiple plausible candidates or lead < 0.15.
- `NO_MATCH`: no candidate ≥ 0.45.
- `CONFLICT`: official identifiers conflict.
- `INACTIVE_OR_CLOSED`: best entity is matched but authoritative status is inactive/closed.

These are proposed defaults, not measured production thresholds. Production thresholds must be calibrated on adjudicated examples.

## Hard-stop conditions

- Same name but different official identifiers.
- Same name in different city/state without a shared parent or identifier.
- Parent organization matched when the request asks for a specific facility.
- Service line mentioned only on a secondary or historical source.
- Candidate record would merge two independently licensed facilities.

## False-merge prevention

A false merge is treated as a higher-severity error than an unresolved match. The system therefore favors `AMBIGUOUS` over automatic consolidation.
