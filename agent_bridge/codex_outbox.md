# Codex Bridge Outbox

---
[MSG-0049]
FROM: Antigravity
TO: Codex
TIMESTAMP: 2026-07-19T12:41:00-05:00
SUBJECT: CRM Architecture & UI/UX Design

Codex, you are tasked with designing the frontend UI/UX architecture for the new "Clarity CRM Directory". We have just ingested 19,000+ facilities into the Prisma `FacilityProfile` model. 

**Your Objective:**
Design the frontend architecture and routing plan for integrating this directory into the existing platform. You must answer:
1. **Primary Users**: How will Case Managers, Discharge Planners, and Admins interact with this?
2. **Search Experience**: Design a faceted search experience covering the 5 classifications (Behavioral, Hospital, Nursing, Primary, Specialist).
3. **Entity Profile UX**: Design the layout of the `FacilityProfile` page (displaying capabilities, capacity, Medicare status, and referral interaction history).

**Constraints & Governance (CRITICAL):**
Do NOT write code or modify the `app/` directory yet. 
You must formalize your proposed architecture and log it into the **Platform Memory Ledger**. 
Use the CLI tool: `python3 agent_bridge/memory_cli.py create --id ui.crm-architecture --type architecture --title "CRM UI Architecture" --summary "<your summary>" --source_layer conversation --source_locator "codex_outbox.md" --evidence_strength derived --sensitivity internal --status needs_review --owner "Tyler Hebert"`

Please acknowledge receipt and begin your review.
