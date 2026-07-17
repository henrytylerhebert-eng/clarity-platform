# Intake-Staff Discovery Guide

**Purpose:** the MVP roadmap's #1 blind spot is that Clarity's workflow model (8 parallel workstreams, evidence review, domain-scoped approvals, benefits-before-authorization sequencing) is architecture-derived and has never been checked against a working intake coordinator. These 2–3 conversations (30–45 min each) must happen **before Phase 5 locks the UI**. Owner runs them; this guide keeps them comparable.

**Who to talk to:** an intake coordinator and a benefits/UR specialist at a sending facility (ED or crisis unit); ideally one person at a receiving facility. Not managers — the people who touch the fax machine.

**Ground rules:** listen for the current workflow, not reactions to Clarity. No feature pitching. No PHI — ask them to speak in generalities or hypotheticals. Record only with consent.

## 1. The current workflow (15 min — the core)

- "Walk me through the last placement you worked, from the moment the referral hit your desk to the patient leaving. What did you touch — binders, whiteboards, fax, phone, EHR screens?"
- "Where did you wait? On whom? How long?"
- "What did you have to re-check or re-do because something changed or someone else edited it?"
- "When two of you work the same case at once, how do you avoid stepping on each other?" *(validates: optimistic concurrency, workstream independence)*

## 2. Documents and facts (10 min)

- "When a referral packet arrives, what's usually missing or wrong? How do you find out?"
- "How do you keep track of which version of a document is current?" *(validates: version families)*
- "When two notes contradict each other — morning says no SI, afternoon says active SI — what do you do with both statements?" *(validates: contradiction groups, no-erasure)*
- "Who's allowed to say a clinical fact is confirmed vs. an insurance fact?" *(validates: domain-scoped approval)*

## 3. Benefits and authorization (10 min)

- "Tell me about the last eligibility call: what did you write down, where, and who ever looks at it again?"
- "Has a quote ever been treated as a guarantee? What happened?" *(validates: structural disclaimer)*
- "How do you know whether an auth is required before you start one?" *(validates: quote-derived requirement)*
- "What does 'ready to route' mean in your head — one checklist or several separate ones?" *(validates: no-blend readiness doctrine)*

## 4. The dangerous question (5 min)

- "If a tool did exactly one thing for you, what would it be?" — then silence.
- "What tool did your org buy that nobody uses, and why?"

## What to bring back (fill in per interview)

| # | Finding | Confirms / contradicts | Model element affected |
|---|---|---|---|
| 1 | | | |

**Decision rule afterwards:** anything contradicting the workstream model, the review flow, or the benefits sequence gets an ADR-level revisit **before** Phase 5 — UI is where wrong models become expensive.
