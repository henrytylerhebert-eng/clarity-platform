---
status: Draft — product-owner review required before external use
owner: Tyler Hebert
version: 1.0.0
date: 2026-09-14
scope: Positioning, narrative, and message architecture. Marketing artifact only — it authorizes no capability, pilot, deployment, or claim beyond the ledger it cites.
source_artifacts:
  - README.md
  - docs/product/PRODUCT_VISION.md
  - docs/product/INPATIENT_REV_OPS_PRODUCT_DEFINITION.md
  - docs/09-personas-and-role-ux.md
  - docs/ux/PRODUCT_TOPOLOGY_DECISION.md
  - docs/workflows/INTAKE_TO_ADMISSION_WORKFLOW.md
  - docs/legal/LOUISIANA_OPC_PEC_CEC_FORM_VERIFICATION.md
  - docs/discovery/operating-assurance/PRODUCT_INTELLIGENCE_BRIEF.md
  - app/src/domain/{epecRuleSets,guardrails,hashLedger,roles}.ts
  - IMPLEMENTATION_STATUS.md (2026-09-13 entry)
companion: CLAIMS_AND_EVIDENCE_LEDGER.md — every sentence below that makes a claim must be traceable there
---

# Clarity — Messaging Foundation

> **Read this first.** Clarity's product discipline and its brand are the same
> discipline. The product refuses to assert what it cannot source; the marketing
> must refuse the same. Any copy that claims production readiness, HIPAA
> compliance, live integrations, or measured outcome improvement is both a
> governance violation (root `CLAUDE.md`, hard rule 4) and off-brand. Use
> [CLAIMS_AND_EVIDENCE_LEDGER.md](CLAIMS_AND_EVIDENCE_LEDGER.md) as the gate.

---

## 1. The heart of it

A person in psychiatric crisis is having the worst hour of their life. In that
hour, the system around them is usually not short of compassion, or beds, or
licensed clinicians. It is short of a **shared, trustworthy picture of what is
already known**.

So the story gets told again. To the officer. To the crisis line. To the ED
triage nurse. To intake. To the physician. To the receiving facility's
admissions coordinator, who asks for the same four documents a fax machine
already sent. Each retelling costs the patient time in a bay under fluorescent
lights, and costs a professional an hour they could have spent with the next
person.

Nobody in that chain is doing anything wrong. The failure is structural: **there
is no spine.** Clinical work, legal custody work, benefits work, and placement
work all run at once, each in its own tool, each blind to the others, and the
only integration layer is a human being with a phone and a legal pad.

Clarity exists for one reason: **to give those hours back.** Not by deciding
anything. By making it impossible to lose track of what is true, what is
missing, who owes the next move, and which clock is running.

**The conviction underneath the product:** in a domain where being wrong costs
someone their liberty or their life, software should never be the one who
decided. It should be the most trustworthy participant in the room — never the
smartest one, never the one in charge.

---

## 2. What Clarity is

**Category:** behavioral-health **case intelligence and access orchestration**.

**One-liner:**
> Clarity is the case spine for behavioral-health access — it puts one
> source-linked record under the clinical, legal, benefits, and placement work
> that today runs in parallel and unconnected.

**Elevator (30 seconds):**
> When someone is in psychiatric crisis, the placement takes hours or days —
> not because the bed doesn't exist, but because the story has to be retold and
> re-keyed at every handoff, and no one can see what's missing until a facility
> says no. Clarity gives the whole chain one case record where every material
> action carries its source, its rule, its owner, its deadline, and its history.
> Capture the story once and it becomes the intake record, the medical-necessity
> draft, the legal instrument, the referral packet, and a tamper-evident custody
> trail — without anyone retyping it. Clarity never makes the clinical, legal, or
> placement decision. It makes sure the qualified person who does can see
> everything, and that the decision can be proven afterward.

**Positioning statement (internal, classic form):**

> **For** crisis and central-intake teams, receiving facilities, and the
> clinicians, UR specialists, and compliance officers around them,
> **who** lose hours to retelling, re-keying, and chasing the status of a
> placement,
> **Clarity is** a case-intelligence and access-orchestration platform
> **that** puts one source-linked case spine under the clinical, legal,
> benefits, and placement workstreams that today run in parallel and blind to
> each other.
> **Unlike** an EHR — which documents care *after* someone is placed — or a bed
> registry, which shows availability without carrying the case,
> **Clarity** makes the source, uncertainty, rule, owner, deadline, and history
> behind every material action visible, and never makes the decision itself.

**The shape of the workflow Clarity models:**

```
referral → intake → evidence → parallel clinical / legal / benefits / placement
        → packet → routing → custody → audit
```

---

## 3. The problem, in the operator's words

These are the frictions Clarity is built against. They are drawn from the
product owner's sixteen years in behavioral health and roughly thirty hospital
openings, and from the architecture record. They are **not** yet validated
against outside intake staff — that discovery is scoped and unrun
(`docs/product/INTAKE_STAFF_DISCOVERY_GUIDE.md`). Say so when asked.

| The friction | What it costs |
|---|---|
| **The story is retold at every handoff.** Calls, notes, PDFs, spreadsheets, faxes. | Hours of patient boarding; hours of professional time; drift and error with every retelling. |
| **Parallel work has no shared spine.** Clinical, legal, financial, routing, placement each move independently. | Nobody can answer "what is actually blocking this case?" without five phone calls. |
| **Gaps surface late.** Missing collateral, unsupported risk claims, payer gaps, legal-clock uncertainty. | You find out the packet was incomplete when the facility declines — after the clock ran. |
| **Declines are unstructured.** "Not appropriate." | The network learns nothing. The same mismatch repeats next week. |
| **Custody is unprovable.** Who had the instrument, when, and was it altered? | Audit becomes archaeology. Compliance reviews reconstruct from memory. |
| **Leaders fly blind.** No live picture of cases, bottlenecks, readiness, or custody. | Capacity decisions get made on anecdote. |
| **Money quietly gates care.** Benefits work blocks clinical work because both live in one queue. | The worst failure mode in the whole domain. |

---

## 4. Who it is for

**Economic buyer:** the person accountable for access and throughput —
crisis-system administrator, behavioral-health program director, hospital COO,
or the consulting firm that runs operating assurance for several facilities.

**Daily users** — eight personas, all implemented in the prototype, each landing
on their own job, all looking at *one* case record through different lenses:

| Persona | The job Clarity does for them |
|---|---|
| **Field responder** (law enforcement, mobile crisis) | Capture the story once, on scene, in plain language — no clinical jargon, nothing they enter becomes a clinical or legal determination. |
| **Central intake coordinator** | Keep every case moving; see breached and due-soon clocks before they break. The SOP owner's command center. |
| **Clinician reviewer** | Turn drafts into defensible documentation, with every risk finding traced to its source. |
| **UR / benefits specialist** | Clear the financial lane in parallel — structurally unable to block the clinical lane. |
| **Receiving facility admissions** | Decide fast on a complete packet; respond with a reason code the network can learn from. |
| **Charge nurse** | Place for *milieu* safety, not just an open bed — acuity, observation load, compatibility flags, with the final call always theirs. |
| **Compliance / legal officer** | Prove the chain of custody; see everything counsel has not yet validated. |
| **Executive / program director** | Throughput and risk at a glance — and an honest "No measurements found" until real measurement exists. |

**Design rule that makes this work:** one canonical case record, many lenses.
Personas never get different data models — only different projections, emphasis,
and actions. A new persona is a config entry, not a new code path.

---

## 5. The six message pillars

Each is a claim about how Clarity behaves, and each is enforced in code — not
aspiration.

### 1. Tell it once.
One capture becomes the intake record, the risk findings, the medical-necessity
draft, the legal instrument scaffold, the referral packet, and the custody
events. The field responder's plain-language capture and the clinician's full
assessment are the same record in two modes — clinical fields are *hidden* from
the field view, never a separate form.

### 2. Show the work.
Every material action carries six things: **source, uncertainty, rule, owner,
deadline, history.** Evidence enters review as a candidate; nothing
auto-approves. An item with no source reference behind it cannot be approved at
all.

### 3. Humans decide — structurally, not as a promise.
No autonomous clinical, legal, admission, discharge, placement, or authorization
decision exists anywhere in the product. Draft language that asserts
"meets InterQual," "meets MCG," "meets ASAM," "meets LOCUS," or "admission is
medically necessary" is blocked by a prohibited-language guard before a human
ever sees it. Statutory wording stays flagged *counsel validation required*
until counsel clears it.

### 4. Money never gates care.
The benefits lane runs in parallel with the clinical lane and is architecturally
incapable of blocking it. There is no payer-weighted priority score. A benefits
quote is never displayed as a payment guarantee. Historical payer behavior is
labeled historical and unconfirmed for the present patient.

### 5. Custody you can prove.
Every custody event is SHA-256 hashed over canonical JSON and chained to the
one before it. Alter any event and the chain fails verification. The ledger is
visible to *every* persona — trust is the product, so no role loses sight of it.

### 6. Configuration, not truth.
Louisiana's OPC/PEC/CEC rules are a **rule set**, not hard-coded law. A second
state is a new rule set; a second facility's admission criteria are a new
profile. Neither is a code fork. And where the statute and the printed OBH form
disagree on the custody window, Clarity carries **both values and names the
conflict** rather than silently choosing one.

> That last sentence is the whole brand in miniature. Most software in this
> space would pick a number and look confident. Clarity shows you the
> disagreement and tells you a lawyer has to settle it.

---

## 6. Why this is a different game

The standard healthcare-software promise is *automation*: the system will decide
faster than you. In behavioral-health crisis work that promise is unsellable to
anyone who has done the job, because the cost of a confident wrong answer is
somebody's liberty.

Clarity inverts it. The promise is **provenance**: the system will never decide,
and it will never lose track.

That inversion changes three things about how the work is played:

**1. The bottleneck moves from memory to review.**
Today the constraint is how much one coordinator can hold in their head and
chase by phone. With a shared spine, the constraint becomes qualified human
review — which is the constraint it *should* be, and the only one that scales
safely.

**2. Saying "no" becomes information instead of an ending.**
Structured decline reasons — required, never free text — turn every rejection
into a data point about where the region's real capacity mismatch is. A network
that records *why* it said no can eventually tell a state where to build the
next unit.

**3. The audit stops being archaeology.**
When custody is hash-chained and every approval names its reviewer, compliance
review changes from reconstructing the past to reading it. That is what makes
it possible, later, to measure anything honestly at all.

**And the humane part, stated the size it actually is:** Clarity will not fix
the mental-health system. It can remove a specific, measurable kind of friction
from the worst hours of a person's life, and give the professionals around them
their attention back. Every hour a person in crisis spends boarding is an hour
of harm we already know how to reduce. That is a narrow claim. It is also worth
building a company around.

---

## 7. What Clarity is today — the honest state

**This is the section that earns the rest of the document.** Lead with it in any
serious conversation; the credibility gained is worth more than the claim lost.

**What exists and works:**

- A working local prototype (`app/`) on **synthetic data only**: 18 workspaces
  across Crisis Ops, guided intake in field and clinical modes, source-linked
  risk findings, medical-necessity and legal-status drafting with review gates,
  packet generation, simulated facility routing and response, a hash-chained
  custody ledger with tamper detection, a milieu-aware bedboard, a role-aware
  command center, and role-specific onboarding/SOP training.
- **Three applications on one platform** — Crisis Ops (clinical placement),
  Operating Assurance (consultant-supervised survey readiness), and RevOps
  (inpatient operations and revenue intelligence) — sharing one organization,
  user, and role model, one authentication mechanism, one audit trail, and one
  deployable backend.
- **Backend foundations** with tenant scoping in every predicate, a strict
  command pattern (Zod envelope → role policy → one transaction → versioned
  update → atomic audit event → idempotency record), append-only audit, and
  immutability enforced by construction where it matters.
- **Louisiana statutory rule sets reconciled against the official OBH form
  PDFs**, including a named register of the places where the form and the
  statute disagree.
- **A governance record**: 20 architecture decision records on `main` (18 marked
  accepted, one still proposed), an open
  decisions register, a risk register, and a test manifest discipline that
  requires stating honest gaps.

**What is explicitly not claimed — anywhere, by anyone, in any deck:**

- Not production-ready. Not deployed.
- Not HIPAA-compliant or PHI-ready. Synthetic data only.
- No working external integrations — no EHR, CAD/RMS, payer, bedboard, or
  messaging connection exists.
- No approved clinical or legal rules. Statutory content requires counsel
  validation; clinical thresholds require clinical review.
- **No measured outcomes.** Transfer speed, acceptance rates, documentation
  quality, denials, and patient outcomes have not been measured. The correct
  phrase — the one the product itself displays — is *No measurements found.*
- The workflow model has not yet been validated against working intake staff
  outside the product owner.

Test counts, verification runs, and merge state live in
[IMPLEMENTATION_STATUS.md](../../IMPLEMENTATION_STATUS.md) and must be cited
from there with their date, never carried forward from memory or from this file.

---

## 8. What it could and will likely become

Sequenced, and labeled by confidence. Nothing below is committed scope.

**Near — finishing the wedge (highest confidence).**
Crisis Ops through a real workflow end to end: authentication and production
RBAC/RLS, the facility configuration layer (per-facility admission criteria,
lab standards, acceptance-authority delegation), the sending-facility nursing
report as a first-class artifact, and a controlled pilot gated on clinical,
legal, and security sign-off. The pattern is already proven: a second facility
is a new profile, not a fork.

**Next — the access network (high confidence, needs partners).**
Once more than one organization runs on the same spine, referral and response
become a network rather than a series of phone calls: structured decline
reasons, facility capability profiles matched against packet content, transport
and custody handoff, and the first honest baseline measurements. **This is where
the first real outcome claims become possible** — and not one day before.

**Then — the payer lane, in parallel and never in the way (medium confidence).**
Insurance extraction → eligibility → benefits verification → authorization
readiness → patient financial education → payer memory. Expansion on the same
case spine, not a restart. The boundary holds: parallel workstream, never a gate
on emergency clinical review.

**Then — assistance that stays subordinate (medium confidence).**
Ambient documentation assist for the admitting nurse, shaped by that facility's
own documentation needs; agents that draft, extract, and flag contradictions —
every one of them producing *candidates for review*, never determinations.
Clarity's guardrail architecture exists precisely so this can be added without
changing who decides.

**Eventually — the learning layer (the real prize, lowest confidence, highest value).**
A region that records every referral, every decline reason, every clock, and
every custody handoff can finally answer questions nobody can answer today:
Where does access actually break? Which mismatches repeat? What would one more
unit, in one particular place, actually change? De-identified and aggregated,
that is capacity truth — the kind of evidence a state could plan against.

**And the adjacent applications, already begun.**
*Operating Assurance* turns a consulting firm's recurring survey-readiness
delivery into a product the client operates and the consultant supervises —
service-to-software, with exact authority and version behind every answer, and
an explicit `Unknown` when the evidence isn't there. *RevOps* modernizes a
ten-year-old workbook-based hospital operating system — budget, actual activity,
forecast, and collections kept as four distinct layers so that estimated revenue
is never quietly presented as cash.

---

## 9. Voice and copy rules

**Voice:** the way a good charge nurse talks at 3 a.m. Calm, concrete, no
adjectives doing work that facts should do. Confident about mechanism, precise
about limits.

**Do:**
- Name the specific friction before naming the feature.
- Use the domain's real vocabulary: OPC, PEC, CEC, packet, milieu, collateral,
  medical necessity, decline reason, custody.
- State limits in your own voice before anyone asks. It reads as competence.
- Prefer a mechanism to an adjective: not "robust audit trail" but "every
  custody event is hashed and chained to the one before it."
- Say `No measurements found` when there are none. It is a brand asset.

**Don't:**
- Don't say AI-powered, revolutionary, seamless, transform, or unlock.
- Don't imply autonomy, decision-making, or clinical/legal judgment.
- Don't quantify a benefit. No "40% faster," no "saves 6 hours per case" — no
  measurement exists, and inventing one destroys the only thing that makes this
  product credible.
- Don't use a patient story you don't have permission for, and never one
  involving real people. Composite and clearly labeled, or nothing.
- Don't call the prototype a system, a platform in production, or a deployment.

**Ready-to-use lines:**

- *The bed exists. The clinician is willing. The hours disappear anyway.*
- *Tell it once. Prove it always.*
- *Clarity never decides. It makes sure you can.*
- *Software that shows its work.*
- *Where the statute and the form disagree, we show you both.*
- *Every hour someone spends boarding in crisis is an hour we already know how
  to give back.*

---

## 10. How to use this document

| Audience | Lead with | Then |
|---|---|---|
| **Pilot site / design partner** | §3 the problem, in their words | §7 honest state — then ask for the discovery conversation in `INTAKE_STAFF_DISCOVERY_GUIDE.md` |
| **Clinical or legal reviewer** | §5 pillars 3 and 6 (humans decide; configuration, not truth) | §7 what is not claimed |
| **Investor** | §1 the heart, §6 why it's a different game | §8 the arc, §7 stated plainly — the honesty *is* the diligence answer |
| **Engineer or co-founder** | §2 what it is, §5 pillars | `ARCHITECTURE.md`, the ADRs, `IMPLEMENTATION_STATUS.md` |
| **Consulting client (Operating Assurance)** | §8's Operating Assurance paragraph | `docs/discovery/operating-assurance/PRODUCT_INTELLIGENCE_BRIEF.md` |

**Before anything here goes outside the building:** run it against
[CLAIMS_AND_EVIDENCE_LEDGER.md](CLAIMS_AND_EVIDENCE_LEDGER.md). If a sentence
makes a claim the ledger doesn't cover, the sentence changes — not the ledger.
