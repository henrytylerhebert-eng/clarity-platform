/**
 * Payer-memory contract: organization-specific historical knowledge is always
 * labeled historical and unconfirmed for the current patient, and can never be
 * consumed as current-patient verification (MASTER_BUILD_PROMPT rule 11).
 */
export interface PayerMemoryEntry {
  readonly payerName: string;
  readonly kind:
    | "ALIAS"
    | "PORTAL_INSTRUCTIONS"
    | "CONTACT"
    | "CARVE_OUT"
    | "COMMON_REQUIREMENT"
    | "PEND_PATTERN"
    | "DENIAL_PATTERN"
    | "TYPICAL_VERIFICATION_TIME"
    | "TYPICAL_AUTHORIZATION_TIME";
  readonly note: string;
  readonly observedAt: string;
  readonly provenance: "HISTORICAL_UNCONFIRMED";
}

export const PAYER_MEMORY_LABEL =
  "Historical organizational memory — unconfirmed for the current patient. " +
  "Verify directly with the payer before relying on it.";

export function createPayerMemoryEntry(
  entry: Omit<PayerMemoryEntry, "provenance">,
): PayerMemoryEntry {
  return Object.freeze({ ...entry, provenance: "HISTORICAL_UNCONFIRMED" });
}

export function presentPayerMemory(entry: PayerMemoryEntry): { entry: PayerMemoryEntry; label: string } {
  return { entry, label: PAYER_MEMORY_LABEL };
}

/** Type-level and runtime guard: payer memory is not acceptable verification evidence. */
export function assertNotUsedAsVerification(source: { provenance?: string }): void {
  if (source.provenance === "HISTORICAL_UNCONFIRMED") {
    throw new Error("Payer memory cannot be used as current-patient verification evidence");
  }
}
