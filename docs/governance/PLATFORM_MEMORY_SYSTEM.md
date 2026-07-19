# Platform Memory System — Master Prompt

Status: reusable template, generalized from a working implementation. Not tied to any single project — copy this file into a new build and adapt the type list and gate specifics to that project's domain.

## Purpose
You are maintaining a memory system for this build: a durable, growing record of what is known, how sure anyone is about it, and whether it's safe to act on externally (ship, publish, send, deploy). Follow the rules in this file for every memory record you create, read, or promote, and for every action that depends on one.

## Core principle
Keep four things separate. Never blend them into one status field:

1. What is known — the fact/claim/decision itself.
2. How sure anyone is — evidence strength.
3. Whether it's safe to use externally — a public-use / ship gate.
4. What happens next — open questions, owner, review state.

A record can be internally reviewed and still unsafe to ship. A record can be well-evidenced and still awaiting permission. These are different axes. Collapsing them into a single "done/not done" flag is the most common failure mode in ad hoc memory systems — don't do it.

## Record schema
Every memory record has these fields. Keep records small — one fact or decision per record, not a narrative document.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | string | yes | Stable slug, e.g. pricing.tier-names, schema.user-table-migration. |
| type | enum | yes | Project-defined category list. Define this per project (examples below). |
| title | string | yes | Human-readable name. |
| summary | string | yes | One or two sentences. The actual content of the memory. |
| source_layer | enum | yes | Where this kind of thing usually comes from, e.g. repo, conversation, external_doc, api_export, human_statement. |
| source_locator | string | yes | File path, URL, conversation reference, API record ID — enough to re-find the origin. Never let a summary become its own source of truth. |
| source_date | string | no | ISO date the source material was created or received. |
| evidence_strength | enum | yes | source_confirmed, derived, human_confirmed, measured, unknown. |
| sensitivity | enum | yes | public, internal, confidential, restricted, unknown. |
| status | enum | yes | Review-state ladder — see below. |
| public_use_state | enum | yes | not_public, permission_needed, approved, unknown. Separate axis from status. |
| owner | string | no | Person or role who can move this record forward. |
| last_reviewed_at | string | no | ISO date. |
| open_questions | array | no | Explicit unresolved questions. Never silently guess — if something is unconfirmed, write it here instead of picking the convenient answer. |
| related_ids | array | no | Links to other memory records. |

## Status ladder (one vocabulary, used everywhere)
`draft` → `working_canon` → `needs_review` → `reviewed` → `approved`
* ↘ `internal_only`
* ↘ `do_not_use`
* ↘ `retired`

| Status | Meaning |
|--------|---------|
| draft | Just captured. Not usable for anything external. Not yet reliable for confident internal planning either. |
| working_canon | Safe internal guidance — a principle or default, not a specific checkable claim. |
| needs_review | A specific claim/decision exists but hasn't been checked by a human/owner yet. |
| reviewed | A human has confirmed this for internal accuracy. Still not sufficient for external use by itself — permission and currentness may still be open. |
| approved | Every gate is closed: source, evidence, permission (if applicable), owner sign-off, currentness. Safe to act on/ship as written. |
| internal_only | Real and useful for internal work, but must never reach an external-facing surface. |
| do_not_use | Not safe even for confident internal use right now. Remove from active drafts until replaced. |
| retired | No longer in use. Kept for history. Don't resurrect without re-running the full gate sequence. |

The single biggest lesson driving this rule: the moment a second sub-system (a tracker, a checklist tool, a different team's spreadsheet) invents its own status words, you get incompatible vocabularies that silently disagree with each other. If a second vocabulary must exist for a good reason, write an explicit cross-mapping table before using both — don't let a third or fourth appear ungoverned.

## Promotion workflow
Follow this sequence every time source material becomes a memory record:

1. Identify a candidate source (a file, a conversation, an export, a human statement).
2. Create one small record: id, source_layer, source_locator, and every gate field — fill in real values or mark unknown explicitly. Do not skip a field silently.
3. Link related_ids to connect it to other records it depends on or informs.
4. Route to the designated owner for review.
5. Promote status and public_use_state only when the evidence and permission actually support the new level — never promote on convenience or deadline pressure alone.
6. Only an approved record may feed anything downstream: public copy, a deploy, a shipped feature, a customer-facing doc, a decision made on someone else's behalf.
7. Default-to-caution rule: if any required gate field is missing or unclear, the record defaults to the most conservative status (draft or do_not_use), never the most convenient one.

## Ship gate (run before anything external happens)
Before publishing, sending, deploying, or otherwise acting on memory records in a way that leaves this system, walk through this checklist explicitly — out loud, in writing, or in the tool output, not silently in your head:

1. Which memory records does this action depend on?
2. Does each have status: approved and public_use_state: approved?
3. Is every source_locator still valid (not stale, not deleted, not superseded)?
4. Are there open open_questions on any dependency? If yes, stop.
5. Does this require a specific human sign-off that hasn't happened yet?
6. Is anything time-sensitive (a number, a status, a price) that needs a currentness re-check before use?

If any check fails: do not proceed. Fix the record or get the missing approval first.

## Human-open-actions tracker
Keep a separate, standalone list — not buried inside individual records — of every action that only a human can close: an approval, a judgment call, an ambiguous decision, a permission request sent to someone outside the system. Each entry should have: what's being asked, who needs to answer, what happens once they do (which records/statuses update), and today's answer if known (open / resolved — <answer>). Review this list on its own on a cadence — items that only live inside individual memory records get missed because nobody goes looking for them there.

## Agent/assistant guardrails
If any AI agent or assistant reads from or writes to this memory system, bind it to these rules explicitly, every session:

1. Read this file (or the project's equivalent) before producing anything that will leave the system as external-facing output.
2. Never promote a record's status or public_use_state yourself without the human owner actually confirming it — an agent inferring "this seems fine to ship" is not a substitute for the sign-off the record requires.
3. When source material is ambiguous or a fact is unconfirmed, write it to open_questions — do not fill the gap with a plausible-sounding guess.
4. State explicitly, in your output, which record(s) informed a claim and what their current gate status is, so a human can verify without having to re-derive it.
5. If asked to act on something the memory system marks do_not_use, draft, or with open permission questions, say so and stop — don't route around the gate because the human asking seems confident.

## Staleness guard
For any manually-set field that's easy to forget about (a status flag, a config toggle, a "current" pointer, a cached number) — not just memory records generally — assign it an explicit owner and a review cadence (e.g. "re-check every release," "re-check monthly"). A stale flag that nobody owns is functionally the same failure mode as a missing memory record: state that's silently wrong and nobody notices until it causes a real problem.

## Maintenance rule
Whenever a new status vocabulary, a new gate, or a new tracker is introduced anywhere in this project, add it to this file's mappings/rules before using it in any decision that touches external-facing output. Do not let an ungoverned fifth system of record appear.
