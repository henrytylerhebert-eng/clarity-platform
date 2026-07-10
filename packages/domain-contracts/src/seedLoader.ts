import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { SyntheticCaseSchema, type SyntheticCase } from "./syntheticCase.js";

/**
 * Loads and validates every synthetic-case fixture in a directory.
 * Throws if any file fails JSON parsing or the synthetic-only schema —
 * a fixture that cannot prove it is synthetic must not load.
 */
export function loadSyntheticCases(dir: string): SyntheticCase[] {
  const files = readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .sort();
  return files.map((f) => {
    const raw = JSON.parse(readFileSync(join(dir, f), "utf8"));
    const result = SyntheticCaseSchema.safeParse(raw);
    if (!result.success) {
      throw new Error(`Synthetic case ${f} failed validation: ${result.error.message}`);
    }
    return result.data;
  });
}
