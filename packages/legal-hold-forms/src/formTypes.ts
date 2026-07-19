import { z } from "zod";

/**
 * Structured data model for the five official Louisiana OBH involuntary-commitment
 * forms. Field grouping mirrors the physical layout of each form (see
 * docs/legal/LOUISIANA_OPC_PEC_CEC_FORM_VERIFICATION.md for the field-traceability
 * matrix each schema was built from). These types capture data faithfully; they do
 * not decide legal validity — see docs/legal/LEGAL_STATUS_ARCHITECTURE.md's binding
 * non-enforcement rule.
 */

export const LOUISIANA_FORM_KINDS = [
  "OBH_19_RPC",
  "OBH_20_OPC",
  "OBH_1_PEC",
  "OBH_1A_PEC_PSYCH",
  "OBH_2_CEC",
] as const;
export type LouisianaFormKind = (typeof LOUISIANA_FORM_KINDS)[number];

/**
 * Roles able to execute a PEC/PEC-A under La. R.S. 28:53(B)(1) as amended by Act 148
 * of 2025 (enrolled HB 137, verified against legis.la.gov this session), plus the
 * coroner/deputy role for the CEC and the peace-officer/judge roles for OBH-19/20.
 */
export const EXAMINER_ROLES = [
  "PHYSICIAN",
  "PHYSICIAN_ASSISTANT",
  "PSYCHIATRIC_MENTAL_HEALTH_NURSE_PRACTITIONER",
  "OTHER_NURSE_PRACTITIONER",
  "PSYCHOLOGIST",
  "MEDICAL_PSYCHOLOGIST",
] as const;
export type ExaminerRole = (typeof EXAMINER_ROLES)[number];

/** La. R.S. 28:53(B)(1)/(4): telehealth examination is limited to these four roles. */
export const TELEHEALTH_ELIGIBLE_ROLES = [
  "PHYSICIAN", // psychiatrist, per the statute's use of "psychiatrist"
  "PSYCHOLOGIST",
  "MEDICAL_PSYCHOLOGIST",
  "PSYCHIATRIC_MENTAL_HEALTH_NURSE_PRACTITIONER",
] as const satisfies readonly ExaminerRole[];

export const CertifyingSignatorySchema = z
  .object({
    name: z.string().min(1),
    role: z.enum(EXAMINER_ROLES),
    licenseNumber: z.string().min(1),
    /** Board that issued licenseNumber — validation.ts checks format per role, not this schema. */
    licenseBoard: z.enum(["LSBME", "LSBN", "LSBEP"]),
    address: z.string().min(1),
  })
  .strict();
export type CertifyingSignatory = z.infer<typeof CertifyingSignatorySchema>;

export const CoronerSignatorySchema = z
  .object({
    name: z.string().min(1),
    role: z.enum(["CORONER", "DEPUTY_CORONER"]),
    licenseNumber: z.string().min(1),
    address: z.string().min(1),
  })
  .strict();
export type CoronerSignatory = z.infer<typeof CoronerSignatorySchema>;

export const PatientDataSchema = z
  .object({
    name: z.string().min(1),
    address: z.string().min(1),
    race: z.string().optional(),
    sex: z.enum(["M", "F"]).optional(),
    dateOfBirth: z.string().optional(),
    birthplace: z.string().optional(),
    maritalStatus: z.enum(["S", "M", "D", "W", "SEP"]).optional(),
    militaryStatus: z.enum(["VETERAN", "NON_VETERAN"]).optional(),
    religion: z.string().optional(),
    nearestRelative: z
      .object({
        name: z.string().min(1),
        relationship: z.string().min(1),
        address: z.string().optional(),
        phoneNumber: z.string().optional(),
      })
      .strict(),
  })
  .strict();
export type PatientData = z.infer<typeof PatientDataSchema>;

/**
 * The form instruction is "check where appropriate in both 1 & 2" — group1 and
 * group2 are each independently required to have at least one selection.
 * validation.ts enforces the both-groups rule; this schema only shapes the data.
 */
export const DangerousnessCriteriaSchema = z
  .object({
    group1: z
      .object({
        dangerousToSelf: z.boolean(),
        dangerousToOthers: z.boolean(),
        gravelyDisabled: z.boolean(),
      })
      .strict(),
    group2: z
      .object({
        unwilling: z.boolean(),
        unableToSeekVoluntaryAdmission: z.boolean(),
        /**
         * Present only on OBH-1 Rev. 08/2025 — added in the most recent revision.
         * OBH-1A (Rev. 05/2017) and OBH-2 (Rev. 05/2017) do not print this option;
         * their schemas omit it (see Obh1aGroup2Schema / CecGroup2Schema below).
         */
        willingToSeekVoluntaryAdmissionUponArrival: z.boolean(),
      })
      .strict(),
  })
  .strict();
export type DangerousnessCriteria = z.infer<typeof DangerousnessCriteriaSchema>;

const Group2WithoutWillingSchema = z
  .object({
    unwilling: z.boolean(),
    unableToSeekVoluntaryAdmission: z.boolean(),
  })
  .strict();

export const DangerousnessCriteriaNoWillingOptionSchema = z
  .object({
    group1: DangerousnessCriteriaSchema.shape.group1,
    group2: Group2WithoutWillingSchema,
  })
  .strict();

export const FindingsOfExaminationSchema = z
  .object({
    historyOfPresentIllness: z.string(),
    physicalFindings: z.string(),
    mentalCondition: z.string(),
    previousPsychiatricTreatment: z
      .object({
        inpatient: z.boolean(),
        outpatient: z.boolean(),
        dateOfTreatment: z.string().optional(),
        place: z.string().optional(),
      })
      .strict()
      .optional(),
    isCurrently: z
      .object({
        suicidal: z.boolean(),
        homicidal: z.boolean(),
        violent: z.boolean(),
      })
      .strict(),
  })
  .strict();
export type FindingsOfExamination = z.infer<typeof FindingsOfExaminationSchema>;

/**
 * La. R.S. 28:53(B)(4): telehealth exam is available only to
 * TELEHEALTH_ELIGIBLE_ROLES, requires an in-room licensed professional, and
 * requires medical clearance prior to admission. validation.ts enforces the role
 * gate; this schema only shapes the data capture.
 */
export const TelehealthDetailsSchema = z
  .object({
    conducted: z.literal(true),
    medicallyClearedPriorToAdmission: z.boolean(),
    inRoomProfessional: z
      .object({
        name: z.string().min(1),
        licenseType: z.string().min(1),
      })
      .strict(),
    startTime: z.string(),
    endTime: z.string(),
    patientPhysicalAddress: z.string().min(1),
    examinerPhysicalAddress: z.string().min(1),
  })
  .strict();
export type TelehealthDetails = z.infer<typeof TelehealthDetailsSchema>;

/** Required only when signer.role === "OTHER_NURSE_PRACTITIONER" (La. R.S. 28:53(B)(1)). */
export const NpVerbalApprovalSchema = z
  .object({
    collaboratingPhysicianName: z.string().min(1),
    attested: z.literal(true),
  })
  .strict();
export type NpVerbalApproval = z.infer<typeof NpVerbalApprovalSchema>;

// ---------------------------------------------------------------------------
// OBH-19 — Request for Protective Custody (peace officer / credible person)
// ---------------------------------------------------------------------------
export const Obh19RequestForProtectiveCustodySchema = z
  .object({
    kind: z.literal("OBH_19_RPC"),
    personNeedingTreatment: z
      .object({
        name: z.string().min(1),
        address: z.string().min(1),
        race: z.string().optional(),
        sex: z.string().optional(),
        age: z.number().int().positive(),
      })
      .strict(),
    nearestRelative: z
      .object({
        name: z.string().min(1),
        address: z.string().optional(),
        relationship: z.string().optional(),
        telephoneNumber: z.string().optional(),
      })
      .strict(),
    statementOfFacts: z.string().min(1),
    dangerousActsOrThreats: z.string().optional(),
    otherPersonInDanger: z.string().optional(),
    encouragedToSeekTreatment: z.string().optional(),
    unwillingToBeTreatedVoluntarily: z.boolean(),
    attemptsToContactFacilityOrPhysician: z.string().optional(),
    requestor: z
      .object({
        name: z.string().min(1),
        isPeaceOfficer: z.boolean(),
        signedAt: z.string(),
      })
      .strict(),
  })
  .strict();
export type Obh19RequestForProtectiveCustody = z.infer<typeof Obh19RequestForProtectiveCustodySchema>;

// ---------------------------------------------------------------------------
// OBH-20 — Order for Protective Custody (parish coroner or judge)
// ---------------------------------------------------------------------------
export const Obh20OrderForProtectiveCustodySchema = z
  .object({
    kind: z.literal("OBH_20_OPC"),
    personInCustody: z
      .object({
        name: z.string().min(1),
        address: z.string().min(1),
        race: z.string().optional(),
        sex: z.string().optional(),
        age: z.number().int().positive(),
      })
      .strict(),
    nearestRelative: z
      .object({
        name: z.string().min(1),
        address: z.string().optional(),
        relationship: z.string().optional(),
        telephoneNumber: z.string().optional(),
      })
      .strict(),
    descriptionOfActsOrThreats: z.string().min(1),
    transportDestination: z.string().min(1),
    issuedAt: z.string(),
    parishOrMunicipality: z.string().min(1),
    issuer: z
      .object({
        name: z.string().min(1),
        role: z.enum(["DISTRICT_JUDGE", "PARISH_CORONER"]),
      })
      .strict(),
    /** Set once transport occurs; not present at order-issuance time. */
    custody: z
      .object({
        takenIntoCustodyAt: z.string(),
        officerName: z.string().min(1),
      })
      .strict()
      .optional(),
  })
  .strict();
export type Obh20OrderForProtectiveCustody = z.infer<typeof Obh20OrderForProtectiveCustodySchema>;

// ---------------------------------------------------------------------------
// OBH-1 — Physician's Emergency Certificate (Rev. 08/2025)
// ---------------------------------------------------------------------------
export const Obh1PhysicianEmergencyCertificateSchema = z
  .object({
    kind: z.literal("OBH_1_PEC"),
    examiner: CertifyingSignatorySchema,
    examinedAt: z.string(),
    patientData: PatientDataSchema,
    /**
     * "Substance Abuse (28 Day)" is printed verbatim on the form though
     * La. R.S. 28:52.4 no longer imposes a 28-day cap (see verification memo §1.4/§7
     * of the original review) — this field selects which box is checked on the
     * generated facsimile; it must never drive an automated 28-day release clock.
     */
    certificateType: z.enum(["MENTAL_ILLNESS_OR_SUBSTANCE_ABUSE_15_DAY", "SUBSTANCE_ABUSE_28_DAY"]),
    certificateSequence: z.enum(["1ST", "2ND"]),
    linkedOpcIssuedAt: z.string().optional(),
    findings: FindingsOfExaminationSchema,
    dangerousnessCriteria: DangerousnessCriteriaSchema,
    telehealth: TelehealthDetailsSchema.optional(),
    npVerbalApproval: NpVerbalApprovalSchema.optional(),
    signedAt: z.string(),
    transportFacilities: z.tuple([z.string().min(1)]).rest(z.string()),
    transportedBy: z
      .object({ name: z.string().min(1), relationshipToPatient: z.string().min(1) })
      .strict()
      .optional(),
  })
  .strict();
export type Obh1PhysicianEmergencyCertificate = z.infer<typeof Obh1PhysicianEmergencyCertificateSchema>;

// ---------------------------------------------------------------------------
// OBH-1A — Psychologist's Emergency Certificate (Rev. 05/2017)
// ---------------------------------------------------------------------------
export const Obh1aPsychologistEmergencyCertificateSchema = z
  .object({
    kind: z.literal("OBH_1A_PEC_PSYCH"),
    examiner: CertifyingSignatorySchema.extend({ role: z.enum(["PSYCHOLOGIST", "MEDICAL_PSYCHOLOGIST"]) }),
    examinedAt: z.string(),
    patientData: PatientDataSchema,
    certificateType: z.enum(["MENTAL_ILLNESS_OR_SUBSTANCE_ABUSE_15_DAY", "SUBSTANCE_ABUSE_28_DAY"]),
    certificateSequence: z.enum(["1ST", "2ND"]),
    linkedOpcIssuedAt: z.string().optional(),
    findings: FindingsOfExaminationSchema,
    /** OBH-1A (Rev. 05/2017) does not print the "willing upon arrival" option — see DangerousnessCriteriaNoWillingOptionSchema. */
    dangerousnessCriteria: DangerousnessCriteriaNoWillingOptionSchema,
    telehealth: TelehealthDetailsSchema.optional(),
    signedAt: z.string(),
    transportFacilities: z.tuple([z.string().min(1)]).rest(z.string()),
    transportedBy: z
      .object({ name: z.string().min(1), relationshipToPatient: z.string().min(1) })
      .strict()
      .optional(),
  })
  .strict();
export type Obh1aPsychologistEmergencyCertificate = z.infer<typeof Obh1aPsychologistEmergencyCertificateSchema>;

// ---------------------------------------------------------------------------
// OBH-2 — Coroner's Emergency Certificate (Rev. 05/2017)
// ---------------------------------------------------------------------------
const CecConclusionASchema = z
  .object({
    type: z.literal("A"),
    dangerousnessCriteria: DangerousnessCriteriaNoWillingOptionSchema,
    signedAt: z.string(),
  })
  .strict();

const CecConclusionBSchema = z
  .object({
    type: z.literal("B"),
    signedAt: z.string(),
  })
  .strict();

export const CecConclusionSchema = z.discriminatedUnion("type", [CecConclusionASchema, CecConclusionBSchema]);
export type CecConclusion = z.infer<typeof CecConclusionSchema>;

export const Obh2CoronerEmergencyCertificateSchema = z
  .object({
    kind: z.literal("OBH_2_CEC"),
    examiner: CoronerSignatorySchema,
    admittedAt: z.string(),
    examinedAt: z.string(),
    patientData: PatientDataSchema,
    findings: FindingsOfExaminationSchema,
    conclusion: CecConclusionSchema,
  })
  .strict();
export type Obh2CoronerEmergencyCertificate = z.infer<typeof Obh2CoronerEmergencyCertificateSchema>;

export const LouisianaFormDataSchema = z.discriminatedUnion("kind", [
  Obh19RequestForProtectiveCustodySchema,
  Obh20OrderForProtectiveCustodySchema,
  Obh1PhysicianEmergencyCertificateSchema,
  Obh1aPsychologistEmergencyCertificateSchema,
  Obh2CoronerEmergencyCertificateSchema,
]);
export type LouisianaFormData = z.infer<typeof LouisianaFormDataSchema>;
