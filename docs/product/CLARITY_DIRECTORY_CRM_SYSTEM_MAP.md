# Clarity Directory CRM System Map

Status: needs_review  
Owner: Tyler Hebert  
Related design: `docs/product/CLARITY_DIRECTORY_CRM_SYSTEM_DESIGN.md`

## Portal Hierarchy

```mermaid
flowchart TD
  A["Parent Organization"] --> B["Locations"]
  A --> C["Personnel"]
  A --> D["Partner Relationships"]
  B --> E["Service Lines"]
  C --> F["Role Assignments"]
  E --> G["Allowed Modules"]
  D --> H["Allowed Cross-Org Workflows"]
  G --> I["Prescreen"]
  G --> J["Referral / Packet Prep"]
  G --> K["Bed Review Request"]
  G --> L["Telemed Consult Request"]
  G --> M["Central Intake Response"]
  G --> N["Admitted Operations / UR"]
  G --> O["Discharge Planning"]
  H --> P["Review-Gated Workflow Intents"]
```

## Organization Types And Primary Workflows

```mermaid
flowchart LR
  LE["Law Enforcement"] --> PS["Prescreen / Custody Context"]
  CR["Community Crisis Response"] --> PS
  ED["Acute Hospital / ED"] --> REF["Referral / Bed Request / Consult"]
  BH["Behavioral Health Provider"] --> CI["Central Intake / Routing"]
  BH --> ADM["Admitted Operations / UR"]
  PC["Parent Company"] --> ADM2["Locations / Service Lines / Personnel"]
  RES["Resource Provider"] --> DIS["Discharge Candidate"]
  REF --> CI
  CI --> ADM
  ADM --> DIS
```

## Guardrail Flow

```mermaid
flowchart TD
  U["User action"] --> C{"Is this a live external action?"}
  C -- "No" --> R["Prepare / Add / Queue review intent"]
  C -- "Yes" --> B["Blocked in prototype"]
  R --> H{"Human review complete?"}
  H -- "No" --> N["Needs review"]
  H -- "Yes" --> A["Can advance only inside approved workflow boundary"]
  B --> G["Display guardrail reason"]
```

## Data Layers

```mermaid
flowchart TD
  S["Synthetic UI fixtures"] --> P["Prototype Directory CRM workspace"]
  CSV["Segmented CSV directory sources"] --> D["Directory source candidates"]
  D --> V["Verification queue"]
  V --> FP["Facility/resource profile"]
  ORG["Organization / User existing schema foundation"] --> TARGET["Future CRM account model"]
  TARGET --> API["Future API/RLS decision packet"]
  FP --> REF["Referral / interaction history"]
```

## First Build Slice

```text
Add one React workspace:

Directory CRM
  -> synthetic org profiles
  -> setup sequence
  -> module lanes
  -> searchable organization/resource table
  -> selected profile inspector
  -> review-gated intent buttons
  -> guardrail tests
```
