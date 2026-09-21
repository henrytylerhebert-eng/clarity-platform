/**
 * Tree 4 Acceptance — executable subset only.
 *
 * Governing contract: docs/canon/acceptance/TREE_4_ACCEPTANCE_CONTRACT_v0.1.md
 * Trace chain: Master Tree v2.1 §0 → Screen & Scenario Atlas (F1–F6 row) →
 *              this contract → these tests → the CI "Shell smoke E2E" step.
 *
 * Only flows classified EXECUTABLE_NOW or the executable PORTION of a
 * PARTIALLY_EXECUTABLE flow are automated here. F2 and F4 are TARGET_ONLY and
 * have no test: their triggering surfaces do not exist, and no fixture,
 * localStorage shortcut or test-only route was created to fake them.
 *
 * MATURITY WARNING: every surface crossed below is PROTOTYPE (local seed state
 * behind the unauthenticated demo-role picker) except where a test says
 * otherwise. A green run proves the prototype shell behaves; it does not prove
 * governed behavior, authorization, or production readiness.
 */
import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => window.localStorage.clear());
  await page.reload();
});

/**
 * F1 — Cases → Case → Clinical → back to Cases
 * Status       EXECUTABLE_NOW (prototype)
 * Surfaces     Case Queue → Case Overview → Medical Necessity → Case Queue
 * Truth source local seed state (app/src/domain/seed.ts) — NOT governed
 * Navigation   local React state (WorkspaceId), not routes
 * Regression   fails if the workspace round trip breaks or the Case selected on
 *              the way in is not the Case shown on return.
 */
test('F1 [prototype]: Cases → Case → Clinical → back to Cases preserves the selected Case', async ({
  page,
}) => {
  await expect(page.getByRole('heading', { name: 'Case Queue' })).toBeVisible();

  const caseButton = page.getByRole('button', { name: 'Adult Demo A' });
  await expect(caseButton).toBeVisible();
  await caseButton.click();

  // Into the Case, then into Clinical.
  await page.getByRole('button', { name: 'Medical Necessity' }).click();
  await expect(page.getByRole('heading', { name: /Medical Necessity/i })).toBeVisible();

  // Back out to Cases. The queue marks the active Case with .selected-row, so
  // this asserts the Case survived the round trip rather than merely that the
  // queue rendered — the assertion fails if selection is lost on return.
  await page.getByRole('button', { name: 'Case Queue' }).click();
  await expect(page.getByRole('heading', { name: 'Case Queue' })).toBeVisible();
  await expect(page.locator('tr.selected-row')).toContainText('Adult Demo A');
});

/**
 * F3 — Case → Assurance → return
 * Status       PARTIALLY_EXECUTABLE
 * Executable   area-level round trip between "/" and "/assurance"
 * NOT covered  Case → a SPECIFIC assurance finding → return to THAT Case.
 *              No Case-to-Finding link exists, and the Crisis Ops Case selection
 *              is component state that does not survive the route change.
 *              That boundary stays TARGET_ONLY in the contract.
 */
test('F3 [partial]: Crisis Ops → Operating Assurance → back is navigable', async ({ page }) => {
  await expect(page.getByRole('heading', { name: 'Case Queue' })).toBeVisible();

  await page.getByRole('button', { name: /Operating Assurance/i }).click();
  await expect(page).toHaveURL(/\/assurance$/);

  await page.getByRole('button', { name: /Crisis Ops/i }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole('heading', { name: 'Case Queue' })).toBeVisible();
});

/**
 * F5 — Case → Revenue Operations → remembered Crisis Ops Case context
 * Status       PARTIALLY_EXECUTABLE
 * Executable   shell navigation from a selected Case to Revenue Operations and back
 * NOT covered  "remembered Case context". selectedCaseId is useState("case-004")
 *              in CrisisOpsApp with no persistence, so the route change unmounts
 *              it and the Case resets. The test explicitly records that the
 *              originally selected Case is not restored today — asserting
 *              restoration would require inventing persistence the product has
 *              not earned.
 */
test('F5 [partial]: selected Crisis Ops Case → Revenue Operations → Crisis Ops shell navigation', async ({ page }) => {
  await expect(page.getByRole('heading', { name: 'Case Queue' })).toBeVisible();

  await page.getByRole('button', { name: 'Adult Demo A' }).click();
  await expect(page.getByRole('heading', { name: 'Case Overview' })).toBeVisible();

  // On the narrow prototype viewport the legacy floating Assurance button
  // overlaps the shell row. Keyboard activation still uses the real accessible
  // shell link and keeps the route assertion as the navigation regression gate.
  const revenueOperationsLink = page.getByRole('link', { name: 'Revenue Operations' });
  await revenueOperationsLink.focus();
  await revenueOperationsLink.press('Enter');
  await expect(page).toHaveURL(/\/rev-ops$/);
  await expect(page.getByRole('heading', { name: 'Revenue Operations' })).toBeVisible();

  const crisisOpsLink = page.getByRole('link', { name: 'Crisis Ops' });
  await crisisOpsLink.focus();
  await crisisOpsLink.press('Enter');
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole('heading', { name: 'Case Queue' })).toBeVisible();

  // Evidence for F5-b: selectedCaseId is local component state and is not
  // restored after the route change. The unmet continuity requirement remains
  // in the contract; this assertion documents today's observed boundary.
  await expect(page.locator('tr.selected-row')).not.toContainText('Adult Demo A');
});

/**
 * F6 — Session expired → sign in → revalidated Case context
 * Status       TARGET_ONLY at the product/browser layer
 * Backend      server-side session expiry is proven separately by the auth
 *              integration tests; that is not browser evidence for this flow.
 * NOT covered  frontend expiry detection, sign-in after detected expiry as an
 *              expiry flow, and Case-context revalidation after re-auth. No
 *              expiry behavior is fabricated here.
 */
test('SHELL-RECOVERY-01 [prototype]: an unknown route recovers to a usable shell', async ({
  page,
}) => {
  await page.goto('/no-such-place');
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole('heading', { name: 'Case Queue' })).toBeVisible();
});
