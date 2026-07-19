import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { resolveEntity } from "../src/entity-resolution";

const file = resolve(process.cwd(), "fixtures/entity-resolution-scenarios.json");
const scenarios = JSON.parse(readFileSync(file, "utf8"));
let passed = 0;
for (const scenario of scenarios) {
  const result = resolveEntity(scenario.target, scenario.candidates);
  const ok = result.status === scenario.expectedStatus && result.selectedCandidateId === scenario.expectedId;
  if (ok) passed++;
  console.log(JSON.stringify({ id: scenario.id, expectedStatus: scenario.expectedStatus, actualStatus: result.status, expectedId: scenario.expectedId, actualId: result.selectedCandidateId, ok }));
}
console.log(JSON.stringify({ scenarios: scenarios.length, passed, failed: scenarios.length - passed }));
if (passed !== scenarios.length) process.exitCode = 1;
