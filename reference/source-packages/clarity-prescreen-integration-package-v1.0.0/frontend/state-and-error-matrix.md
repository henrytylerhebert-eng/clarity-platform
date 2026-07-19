# UI State and Error Matrix

| State | User-facing behavior | Primary action |
|---|---|---|
| Loading | Preserve layout; announce loading | None |
| Empty prescreen list | Explain scope and how to start | Start prescreen |
| No data for a field | Show `Unknown` or `Not assessed` | Record answer |
| Offline | Persistent banner; show unsynced draft count | Retry sync |
| Partial sync | Name sections not confirmed by server | Review conflicts |
| Version conflict | Show server/current differences; do not overwrite | Refresh and reconcile |
| Unauthorized | Do not reveal object existence | Return to authorized queue |
| Facility profile missing | Explain that no approved criteria are active | Request profile review |
| Profile stale/expired | Show effective/expiry source | Escalate to profile owner |
| Document rejected | Show safe reason and next step | Replace or clarify |
| Packet blocker | Name requirement, owner, source rule, target | Resolve in workspace |
| External wait | Show recipient and elapsed time; not staff-failure styling | Follow up/escalate |
| No qualified provider | List disqualifier categories without exposing restricted data | Contact transport coordinator |
| Transport credential stale | Prevent selection | Reverify provider |
| Emergency interrupt | Keep draft; show approved protocol status | Follow organization protocol |
| Corrected information | Badge original/superseding version | Compare versions |
| No measurements found | No trend claim or zero substitution | Adjust filters/data coverage |
