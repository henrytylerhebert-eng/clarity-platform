# Requirements Traceability Matrix

| ID | Domain | Requirement | Primary data/service | Primary UI | Audit/event | Phase |
|---|---|---|---|---|---|---|
| REQ-001 | Case | Create a tenant-scoped behavioral-health case | BehavioralHealthCase | Case Queue / New Case | CASE_CREATED | Sprint 1 |
| REQ-002 | Workflow | Maintain overall case status | BehavioralHealthCase.status | Case Overview | CASE_STATUS_CHANGED | Sprint 1 |
| REQ-003 | Workflow | Maintain parallel domain statuses | ParallelWorkstreamStatus | Case Overview | CASE_WORKSTREAM_CHANGED | Sprint 1 |
| REQ-004 | Workflow | Assign owners and deadlines | WorkflowTask | Queue / Handoff | TASK_CREATED | Sprint 2 |
| REQ-005 | Documents | Preserve original files and checksums | SourceDocument | Documents | DOCUMENT_UPLOADED | Sprint 3 |
| REQ-006 | Documents | Classify documents | SourceDocument | Documents | DOCUMENT_CLASSIFIED | Sprint 3 |
| REQ-007 | Evidence | Extract candidate evidence with source location | EvidenceItem | Evidence Review | EVIDENCE_EXTRACTED | Sprint 4 |
| REQ-008 | Evidence | Require human review for material evidence | HumanReview | Evidence Review | EVIDENCE_APPROVED | Sprint 4 |
| REQ-009 | Evidence | Preserve contradictions | EvidenceItem / contradiction group | Evidence Review | CONTRADICTION_FLAGGED | Sprint 4 |
| REQ-010 | Clinical | Create source-linked case summary | CaseSummary | Case Overview | CASE_SUMMARY_GENERATED | Sprint 5 |
| REQ-011 | Clinical | Build chronological timeline | Timeline event design | Timeline | TIMELINE_GENERATED | Sprint 5 |
| REQ-012 | Clinical | Identify missing information | WorkflowTask / rules | Blockers | MISSING_INFORMATION_FLAGGED | Sprint 5 |
| REQ-013 | Clinical | Map evidence to medical-necessity criteria | MedicalNecessityReview | Medical Necessity | MEDICAL_NECESSITY_GENERATED | Sprint 6 |
| REQ-014 | Clinical | Do not make final admission decision | Agent contract / validation | Medical Necessity | MODEL_OUTPUT_REJECTED | All |
| REQ-015 | Medical | Identify unresolved medical findings | Medical screening draft | Medical Screening | MEDICAL_SCREENING_GENERATED | Sprint 6 |
| REQ-016 | Medical | Do not declare medical clearance | Validation policy | Medical Screening | MODEL_OUTPUT_REJECTED | All |
| REQ-017 | Legal | Select jurisdiction-specific rule set | RuleSet | Legal Status | LEGAL_STATUS_EVALUATED | Sprint 6 |
| REQ-018 | Legal | Check form elements and signatures | RuleEvaluation | Legal Status | LEGAL_STATUS_EVALUATED | Sprint 6 |
| REQ-019 | Legal | Calculate configured deadlines with source version | RuleEvaluation | Legal Status | DEADLINE_WARNING_CREATED | Sprint 6 |
| REQ-020 | Legal | Do not declare hold valid or invalid | Agent contract / validation | Legal Status | MODEL_OUTPUT_REJECTED | All |
| REQ-021 | Insurance | Extract insurance-card fields | InsuranceCoverage | Benefits Workspace | INSURANCE_DATA_EXTRACTED | Sprint 7 |
| REQ-022 | Insurance | Identify subscriber relationship | InsuranceSubscriber | Benefits Workspace | SUBSCRIBER_RELATIONSHIP_CONFIRMED | Sprint 7 |
| REQ-023 | Insurance | Support primary secondary tertiary coverage | InsuranceCoverage.coverageOrder | Benefits Workspace | COVERAGE_ORDER_CHANGED | Sprint 7 |
| REQ-024 | Insurance | Mask and protect member identifiers | Encrypted fields / permissions | Benefits Workspace | SENSITIVE_FIELD_REVEALED | Sprint 7 |
| REQ-025 | Eligibility | Record verification method and proof | EligibilityVerification | Benefits Workspace | ELIGIBILITY_VERIFICATION_COMPLETED | Sprint 7 |
| REQ-026 | Benefits | Capture service-specific benefits | BenefitVerification | Benefits Workspace | BENEFITS_VERIFICATION_COMPLETED | Sprint 8 |
| REQ-027 | Benefits | Capture network status | BenefitVerification.networkStatus | Benefits Workspace | NETWORK_STATUS_RECORDED | Sprint 8 |
| REQ-028 | Benefits | Require payment-estimate disclaimer | BenefitVerification.disclaimerStatus | Education | BENEFIT_DISCLAIMER_PROVIDED | Sprint 8 |
| REQ-029 | Payer | Keep payer memory historical and labeled | PayerProfile / PlanProfile | Payer Memory | PAYER_MEMORY_VIEWED | Sprint 8 |
| REQ-030 | Authorization | Track authorization lifecycle | Authorization | Authorization | AUTHORIZATION_SUBMITTED | Sprint 9 |
| REQ-031 | Authorization | Track approved days units and review dates | Authorization | Authorization | CONCURRENT_REVIEW_DUE | Sprint 9 |
| REQ-032 | Education | Document patient or family financial education | FinancialEducationRecord | Education | FINANCIAL_EDUCATION_DELIVERED | Sprint 8 |
| REQ-033 | Fairness | Financial readiness cannot block emergency clinical review | Workflow rules | Queue / Overview | WORKSTREAM_OVERRIDE_REVIEWED | All |
| REQ-034 | Prioritization | Show separate urgency and readiness dimensions | ReferralPriorityAssessment | Case Queue | PRIORITY_ASSESSMENT_RECORDED | Sprint 12 |
| REQ-035 | Prioritization | No opaque payer-weighted composite score | Governance control | Queue | CONFIGURATION_REJECTED | All |
| REQ-036 | Facility | Store versioned facility capability profiles | FacilityProfile | Facility Admin | FACILITY_PROFILE_UPDATED | Sprint 10 |
| REQ-037 | Facility | Explain match and possible exclusions | FacilityMatch | Facility Routing | FACILITY_MATCH_GENERATED | Sprint 10 |
| REQ-038 | Facility | Do not guarantee acceptance | Agent validation | Facility Routing | MODEL_OUTPUT_REJECTED | All |
| REQ-039 | Packet | Build versioned packet manifest | ReferralPacket / PacketItem | Packet Builder | PACKET_GENERATED | Sprint 10 |
| REQ-040 | Packet | Require approval before export or send | HumanReview / PacketStatus | Packet Builder | PACKET_APPROVED | Sprint 10 |
| REQ-041 | Routing | Track facility referral and response | Referral | Facility Routing | FACILITY_RESPONSE_RECORDED | Sprint 10 |
| REQ-042 | Communication | Record phone email fax portal and internal contacts | CommunicationRecord | Communications | COMMUNICATION_RECORDED | Sprint 11 |
| REQ-043 | Communication | Prevent agent from sending without authorization | Agent contract | Communications | UNAUTHORIZED_ACTION_BLOCKED | All |
| REQ-044 | Custody | Track legal and physical handoffs | CustodyEvent | Custody Ledger | CUSTODY_TRANSFER_RECORDED | Sprint 11 |
| REQ-045 | Custody | Block closure when handoff incomplete | Workflow rule | Custody Ledger | CASE_CLOSURE_BLOCKED | Sprint 11 |
| REQ-046 | Audit | Create append-only audit events | AuditEvent | Audit Timeline | All material events | Sprint 1 |
| REQ-047 | Audit | Do not place sensitive values in audit bodies | Audit helper | Audit Timeline | AUDIT_REDACTION_APPLIED | Sprint 1 |
| REQ-048 | AI | Version prompts models and agent contracts | PromptRecord / AgentRun | Admin | PROMPT_VERSION_ACTIVATED | Sprint 6+ |
| REQ-049 | AI | Validate structured output and citations | AgentRun / CitationRecord | Review panels | MODEL_OUTPUT_RECEIVED | Sprint 5+ |
| REQ-050 | Retrieval | Scope retrieval by organization and case | Retrieval service | Ask Clarity | RETRIEVAL_EXECUTED | Sprint 5+ |
| REQ-051 | Knowledge | Version controlled sources with effective dates | KnowledgeSource | Knowledge Admin | KNOWLEDGE_SOURCE_APPROVED | Sprint 6+ |
| REQ-052 | Rules | Version and test deterministic rules | RuleSet / Rule | Rules Admin | RULE_SET_ACTIVATED | Sprint 6 |
| REQ-053 | Security | Enforce role and tenant access | Repositories / auth | All screens | ACCESS_DENIED | Sprint 1 |
| REQ-054 | Security | Use synthetic data in prototype | Environment policy | All screens | SYNTHETIC_DATA_MODE | Sprint 0 |
| REQ-055 | Security | Treat inbound documents as untrusted | Document pipeline | Documents | SUSPICIOUS_CONTENT_FLAGGED | Sprint 3 |
| REQ-056 | Analytics | Measure time touches duplication and bottlenecks | Events / RetrospectiveReview | Analytics | RETROSPECTIVE_REVIEW_CREATED | Sprint 12 |
| REQ-057 | Analytics | Compare quoted benefits with claim outcomes only when approved | ClaimOutcome | Payer Analytics | CLAIM_OUTCOME_IMPORTED | Enterprise |
| REQ-058 | Commercial | Keep contract rates restricted | ContractRateRecord | Payer Admin | RESTRICTED_DATA_ACCESSED | Enterprise |
| REQ-059 | Integration | Record integration failures and manual fallback | IntegrationEndpoint | Admin / Queue | INTEGRATION_FAILED | Pilot |
| REQ-060 | Governance | Feature-flag high-risk capabilities | Feature flag design | Admin | FEATURE_FLAG_CHANGED | All |
