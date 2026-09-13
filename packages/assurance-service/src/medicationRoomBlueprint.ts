import type { MedicationRoomBlueprintDefinition } from "@clarity/domain-contracts";

export const MEDICATION_ROOM_HANDWASHING_BLUEPRINT: MedicationRoomBlueprintDefinition = {
  code: "BP-MED-HH-001",
  canonicalName: "Medication Room Handwashing & Medication Preparation Environment",
  sceneFamily: "medication_room_environment",
  versionLabel: "0.1-slice",
  applicabilityRule: {
    all: [
      { fact: "scene.scene_family", op: "eq", value: "medication_room_environment" },
      { fact: "scene.handwashing_station_exists", op: "eq", value: true },
    ],
  },
  variants: [
    {
      code: "A",
      name: "Handwash sink with separately identifiable medication-preparation surface",
      selectionRule: {
        all: [
          { fact: "scene.handwashing_station_exists", op: "eq", value: true },
          { fact: "scene.medication_preparation_surface_identifiable", op: "eq", value: true },
          { fact: "scene.medication_preparation_occurs_here", op: "eq", value: true },
        ],
      },
    },
    {
      code: "B",
      name: "Handwash sink present; medication preparation occurs in separate designated clean zone",
      selectionRule: {
        all: [
          { fact: "scene.handwashing_station_exists", op: "eq", value: true },
          { fact: "scene.medication_preparation_occurs_here", op: "eq", value: false },
        ],
      },
    },
  ],
  criteria: [
    {
      code: "C1",
      canonicalQuestion: "Is the designated handwashing station readily accessible for use?",
      plainLanguageExpectation: "The sink and hand-hygiene station can be used without material obstruction.",
      activationRule: { fact: "scene.handwashing_station_exists", op: "eq", value: true },
      materiality: "ROUTINE_ASSURANCE",
      trendKey: "infection_prevention.hand_hygiene.sink_access",
    },
    {
      code: "C2",
      canonicalQuestion: "Are necessary hand-hygiene supplies readily available and usable?",
      plainLanguageExpectation: "Staff have access to functioning hand-hygiene resources required by the approved operating process.",
      activationRule: { fact: "scene.handwashing_station_exists", op: "eq", value: true },
      materiality: "ROUTINE_ASSURANCE",
      trendKey: "infection_prevention.hand_hygiene.required_supply",
    },
    {
      code: "C3",
      canonicalQuestion: "Is medication preparation performed in a designated clean area separated from the sink or other water contamination source?",
      plainLanguageExpectation: "Medication preparation occurs in an identified clean area separated from sink/water contamination risk.",
      activationRule: { fact: "scene.medication_preparation_occurs_here", op: "eq", value: true },
      materiality: "ELEVATED_ATTENTION",
      trendKey: "infection_prevention.medication_preparation.sink_separation",
    },
    {
      code: "C4",
      canonicalQuestion: "Are medications, clean clinical supplies, or medication-preparation items positioned where sink splash could contaminate them?",
      plainLanguageExpectation: "Medication-preparation items and clean supplies are protected from sink splash and other water contamination.",
      activationRule: {
        any: [
          { fact: "scene.medication_related_items_near_sink", op: "eq", value: true },
          { fact: "scene.medication_preparation_near_sink", op: "eq", value: true },
        ],
      },
      materiality: "ELEVATED_ATTENTION",
      trendKey: "infection_prevention.medication_preparation.splash_exposure",
    },
  ],
  expectedStates: [
    {
      code: "ESR-001",
      criterionCode: "C1",
      statement: "The hand-hygiene station is readily accessible for intended use.",
      basisStrength: "NATIONALLY_RECOGNIZED_PRACTICE",
    },
    {
      code: "ESR-002",
      criterionCode: "C1",
      statement: "The sink basin and immediate access area remain free of obstruction that materially prevents intended handwashing.",
      basisStrength: "ORGANIZATION_REQUIREMENT",
    },
    {
      code: "ESR-003",
      criterionCode: "C2",
      statement: "Hand-hygiene supplies needed for the applicable hand-hygiene process are readily accessible.",
      basisStrength: "NATIONALLY_RECOGNIZED_PRACTICE",
    },
    {
      code: "ESR-004",
      criterionCode: "C2",
      statement: "The designated handwashing sink is supplied with functional soap and drying supplies under approved organization policy.",
      basisStrength: "ORGANIZATION_REQUIREMENT",
    },
    {
      code: "ESR-005",
      criterionCode: "C3",
      statement: "Medications are prepared in a designated clean medication-preparation area separated from sinks or other water sources.",
      basisStrength: "NATIONALLY_RECOGNIZED_PRACTICE",
    },
    {
      code: "ESR-006",
      criterionCode: "C3",
      statement: "When the physical relationship between medication preparation and the sink is uncertain, additional spatial/context evidence is required before review.",
      basisStrength: "PRODUCT_GOVERNANCE_RULE",
    },
    {
      code: "ESR-007",
      criterionCode: "C4",
      statement: "Clean patient-care and medication-related items should not be positioned next to sinks in a way that exposes them to splash risk.",
      basisStrength: "RISK_REDUCTION_PRACTICE",
    },
  ],
  evidenceRequirements: [
    { code: "ER-001", criterionCode: "C1", evidenceType: "CONTEXT_PHOTO", requirementLevel: "REQUIRED", verificationMode: "VISUAL", acceptanceRule: "Sink and access pathway are visible in context." },
    { code: "ER-002", criterionCode: "C1", evidenceType: "DETAIL_PHOTO", requirementLevel: "REQUIRED", verificationMode: "VISUAL", acceptanceRule: "Immediate basin/counter/access area is visible." },
    { code: "ER-003", criterionCode: "C1", evidenceType: "FUNCTIONAL_OBSERVATION", requirementLevel: "REQUIRED", verificationMode: "FUNCTIONAL", acceptanceRule: "Human verifies the sink is usable for intended handwashing." },
    { code: "ER-004", criterionCode: "C2", evidenceType: "DETAIL_PHOTO", requirementLevel: "REQUIRED", verificationMode: "VISUAL", acceptanceRule: "Relevant supply/dispenser location is visible." },
    { code: "ER-005", criterionCode: "C2", evidenceType: "FUNCTIONAL_OBSERVATION", requirementLevel: "REQUIRED", verificationMode: "FUNCTIONAL", acceptanceRule: "Human verifies required product is available and dispenser is usable." },
    { code: "ER-006", criterionCode: "C2", evidenceType: "POLICY_DOCUMENT", requirementLevel: "CONDITIONAL", verificationMode: "DOCUMENTARY", acceptanceRule: "Current approved tenant policy supports exact local configuration.", conditionalRule: { fact: "scene.assert_exact_local_supply_configuration", op: "eq", value: true } },
    { code: "ER-007", criterionCode: "C3", evidenceType: "CONTEXT_PHOTO", requirementLevel: "REQUIRED", verificationMode: "VISUAL", acceptanceRule: "Sink and medication-preparation relationship are visible." },
    { code: "ER-008", criterionCode: "C3", evidenceType: "FUNCTIONAL_OBSERVATION", requirementLevel: "REQUIRED", verificationMode: "FUNCTIONAL", acceptanceRule: "Actual medication-preparation location is confirmed by direct observation or interview." },
    { code: "ER-009", criterionCode: "C3", evidenceType: "SPATIAL_CONTEXT", requirementLevel: "CONDITIONAL", verificationMode: "COMBINED", acceptanceRule: "Spatial relationship is sufficient for qualified review.", conditionalRule: { fact: "scene.preparation_sink_relationship_unclear", op: "eq", value: true } },
    { code: "ER-010", criterionCode: "C3", evidenceType: "POLICY_DOCUMENT", requirementLevel: "CONDITIONAL", verificationMode: "DOCUMENTARY", acceptanceRule: "Current policy/SOP explains tenant-specific medication-preparation workflow.", conditionalRule: { fact: "scene.local_policy_changes_workflow_interpretation", op: "eq", value: true } },
    { code: "ER-011", criterionCode: "C4", evidenceType: "CONTEXT_PHOTO", requirementLevel: "REQUIRED", verificationMode: "VISUAL", acceptanceRule: "Items and sink relationship are visible." },
    { code: "ER-012", criterionCode: "C4", evidenceType: "ITEM_CLASSIFICATION", requirementLevel: "REQUIRED", verificationMode: "COMBINED", acceptanceRule: "Items near the sink are classified as medication-related/clean clinical supplies or not." },
    { code: "ER-013", criterionCode: "C4", evidenceType: "POLICY_DOCUMENT", requirementLevel: "CONDITIONAL", verificationMode: "DOCUMENTARY", acceptanceRule: "Current local splash-zone/storage rule is supplied when asserted.", conditionalRule: { fact: "scene.assert_local_splash_zone_rule", op: "eq", value: true } },
  ],
  authorityBindings: [
    { criterionCode: "C1", sourceFamilyKey: "CDC_CORE_PRACTICES_HAND_HYGIENE", versionLabel: "current-resolved-at-review", title: "CDC Core Infection Prevention and Control Practices — Hand Hygiene", citation: "Hand-hygiene supplies readily accessible where care is delivered.", sourceRole: "NATIONALLY_RECOGNIZED_GUIDELINE", currentness: "CURRENT", rightsStatus: "PERMITTED", relationshipType: "GUIDANCE" },
    { criterionCode: "C2", sourceFamilyKey: "CDC_CORE_PRACTICES_HAND_HYGIENE", versionLabel: "current-resolved-at-review", title: "CDC Core Infection Prevention and Control Practices — Hand Hygiene", citation: "Hand-hygiene supplies readily accessible where care is delivered.", sourceRole: "NATIONALLY_RECOGNIZED_GUIDELINE", currentness: "CURRENT", rightsStatus: "PERMITTED", relationshipType: "GUIDANCE" },
    { criterionCode: "C3", sourceFamilyKey: "CDC_CORE_PRACTICES_MEDICATION_SAFETY", versionLabel: "current-resolved-at-review", title: "CDC Core Practices — Injection and Medication Safety", citation: "Prepare medications in a designated clean medication preparation area separated from potential sources of contamination, including sinks or other water sources.", sourceRole: "NATIONALLY_RECOGNIZED_GUIDELINE", currentness: "CURRENT", rightsStatus: "PERMITTED", relationshipType: "DIRECT_SUPPORT" },
    { criterionCode: "C3", sourceFamilyKey: "CMS_SOM_APPENDIX_A_IP", versionLabel: "current-resolved-at-review", title: "CMS State Operations Manual Appendix A — Infection Prevention and Control", citation: "Hospital infection-prevention policies and procedures adhere to nationally recognized infection prevention and control practices.", sourceRole: "INTERPRETIVE_GUIDANCE", currentness: "CURRENT", rightsStatus: "PERMITTED", relationshipType: "REGULATORY_CROSSWALK" },
    { criterionCode: "C4", sourceFamilyKey: "CDC_WATER_MANAGEMENT_SINK_SPLASH", versionLabel: "current-resolved-at-review", title: "CDC Water Management / Sink Splash Guidance", citation: "Protect patient-care and medication-related items from sink splash and water-associated contamination risk.", sourceRole: "RISK_REDUCTION_GUIDANCE", currentness: "CURRENT", rightsStatus: "PERMITTED", relationshipType: "RISK_CONTEXT" },
  ],
  organizationRules: [
    { criterionCode: "C1", title: "Synthetic Hand Hygiene & Medication Preparation Policy", versionLabel: "1.0", statement: "Handwashing sinks remain unobstructed." },
    { criterionCode: "C2", title: "Synthetic Hand Hygiene & Medication Preparation Policy", versionLabel: "1.0", statement: "Soap and disposable drying supplies are maintained at designated sinks." },
    { criterionCode: "C3", title: "Synthetic Hand Hygiene & Medication Preparation Policy", versionLabel: "1.0", statement: "Medication preparation occurs on the designated clean medication-preparation surface." },
    { criterionCode: "C4", title: "Synthetic Hand Hygiene & Medication Preparation Policy", versionLabel: "1.0", statement: "Clean medication/supply items are not stored in the sink splash area." },
  ],
};
