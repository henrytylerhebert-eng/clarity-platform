import { expect, test, type Page } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => window.localStorage.clear());
  await page.reload();
});

async function openWorkspace(page: Page, group: string, workspace: string) {
  await page.getByRole('button', { name: group, exact: true }).click();
  await page.getByRole('button', { name: workspace, exact: true }).click();
}

async function selectPersona(page: Page, persona: string) {
  const details = page.locator('details.demo-view-panel');
  if (!(await details.getAttribute('open'))) {
    await details.locator('summary').click();
  }
  await page.getByLabel('Prototype persona').selectOption(persona);
}

test('home, case queue, and custody verification render across viewports', async ({ page }, testInfo) => {
  await expect(page.getByRole('heading', { name: 'Intake overview' })).toBeVisible();

  await openWorkspace(page, 'Cases', 'Case Queue');
  await expect(page.getByRole('heading', { name: 'Case Queue' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Adult Demo A' })).toBeVisible();

  await openWorkspace(page, 'More', 'Custody Ledger');
  await page.getByRole('button', { name: 'Verify custody chain' }).click();
  await expect(page.getByText('Verified', { exact: true })).toBeVisible();

  await page.screenshot({
    path: `/tmp/clarity-v01-${testInfo.project.name}.png`,
    fullPage: true,
  });
});

test('case status is isolated from local demo case chrome', async ({ page }) => {
  await page.getByRole('button', { name: 'Packet Ready Demo D' }).click();
  await expect(page.getByRole('heading', { name: 'Packet Ready Demo D' })).toBeVisible();

  await openWorkspace(page, 'Cases', 'Case Status');
  await expect(page.getByRole('heading', { name: 'Case Status' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Authentication required' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Packet Ready Demo D' })).toHaveCount(0);
  await expect(page.getByText('Prototype case')).toHaveCount(0);
});

test('reviewer can create a case and carry a source-linked finding into the packet', async ({ page }) => {
  await openWorkspace(page, 'Intake', 'New Case');
  await page.getByLabel('Patient token').fill(`DEMO-${Date.now()}`);
  await page.getByLabel('Referral source').fill('ED crisis referral');
  await page.getByRole('button', { name: 'Create case' }).click();
  await expect(page.getByRole('heading', { name: 'Case Overview' })).toBeVisible();

  await openWorkspace(page, 'Intake', 'Guided Intake');
  await page.getByLabel('Presenting problem').fill('ED crisis referral with safety concerns and collateral pending.');
  await page.getByRole('button', { name: 'Add source-linked risk' }).click();
  await expect(page.locator('.risk-row span', { hasText: 'Source-linked risk finding needs clinician review.' })).toBeVisible();
});

test('packet-ready case shows review gates and accepts mock routing updates', async ({ page }) => {
  await page.getByRole('button', { name: 'Packet Ready Demo D' }).click();

  await openWorkspace(page, 'Review', 'Medical Necessity');
  await expect(page.getByText('Needs clinician review', { exact: true })).toBeVisible();

  await openWorkspace(page, 'Review', 'Legal Status');
  await expect(page.locator('.legal-warning')).toContainText('require counsel validation before enforcement');

  await openWorkspace(page, 'Placement', 'Packet Preview');
  await expect(page.getByRole('heading', { name: 'Assessment summary' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Risk findings' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Legal status draft' })).toBeVisible();
  await expect(page.getByText('Custody hash')).toBeVisible();

  await openWorkspace(page, 'Placement', 'Routing Response');
  await page.getByRole('button', { name: 'Record mock response' }).click();
  await expect(page.getByRole('cell', { name: 'Request more info' })).toBeVisible();
});

test('command center shows lanes, clocks, and an escalated delay without product-planning content', async ({ page }) => {
  await openWorkspace(page, 'Home', 'Command Center');
  await expect(page.getByRole('heading', { name: 'Intake overview' })).toBeVisible();
  await expect(page.getByText('Insurance verification (parallel lane)')).toBeVisible();
  await expect(page.getByText('Breached').first()).toBeVisible();
  await expect(page.getByText('Escalated')).toBeVisible();
  await expect(page.getByText('below 95% target').first()).toBeVisible();
  await expect(page.getByRole('heading', { name: 'POC Feature Map' })).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Product Roadmap Feedback Board' })).toHaveCount(0);
});

test('bedboard flags the risky recommendation and requires an override reason', async ({ page }) => {
  await openWorkspace(page, 'Placement', 'Milieu Bedboard');
  await expect(page.getByRole('heading', { name: 'Milieu Bedboard' })).toBeVisible();
  await expect(page.getByText('Aggression-risk mix in Room 102')).toBeVisible();
  await expect(page.getByText('elopement High')).toBeVisible();

  await page.getByRole('button', { name: 'Override recommendation' }).click();
  await expect(page.getByText('Override requires a documented reason')).toBeVisible();

  await page.getByLabel('Override reason').fill('Holding for 101-A discharge; acuity mix unsafe tonight.');
  await page.getByRole('button', { name: 'Override recommendation' }).click();
  await expect(page.getByText('Reason: Holding for 101-A discharge; acuity mix unsafe tonight.')).toBeVisible();
});

test('role switching scopes grouped navigation to each stakeholder segment', async ({ page }) => {
  for (const group of ['Home', 'Cases', 'Intake', 'Review', 'Placement', 'More']) {
    await expect(page.getByRole('button', { name: group, exact: true })).toBeVisible();
  }

  await selectPersona(page, 'facility');
  await expect(page.getByRole('button', { name: 'Intake', exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Review', exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Placement', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Record mock response' })).toBeVisible();

  await selectPersona(page, 'nurse');
  await expect(page.getByRole('heading', { name: 'Milieu Bedboard' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Home', exact: true })).toHaveCount(0);

  await selectPersona(page, 'central');
  await expect(page.getByRole('heading', { name: 'Central Intake Command Center' })).toBeVisible();

  await selectPersona(page, 'all');
  await openWorkspace(page, 'Intake', 'Guided Intake');
  await expect(page.getByRole('heading', { name: 'Guided Intake' })).toBeVisible();
});

test('training workspace shows SOP onboarding for every role', async ({ page }) => {
  await openWorkspace(page, 'More', 'Training & SOPs');
  await expect(page.getByRole('heading', { name: 'Training & SOPs' })).toBeVisible();
  await expect(page.getByText('Pre-assessment procedure')).toBeVisible();
  await expect(page.getByText('PEC chain-of-custody practice path')).toBeVisible();
  await expect(page.getByText('Annual competency evidence')).toBeVisible();
  await expect(page.getByRole('cell', { name: /Field responder/ })).toBeVisible();

  await selectPersona(page, 'compliance');
  await openWorkspace(page, 'More', 'Training & SOPs');
  await expect(page.getByRole('heading', { name: 'Compliance / legal officer onboarding' })).toBeVisible();
  await expect(page.locator('article').filter({ hasText: 'Compliance / legal officer onboarding' }).getByText('Prove custody, review status, and counsel-validation boundaries.')).toBeVisible();
  await expect(page.getByText('Counsel validation required').first()).toBeVisible();
});

test('personas get adapted focus strips and field mode simplifies intake', async ({ page }) => {
  await selectPersona(page, 'central');
  await expect(page.getByText('Breached clocks')).toBeVisible();
  await expect(page.getByText('Packets below 95%')).toBeVisible();

  await selectPersona(page, 'nurse');
  await expect(page.getByText('Units over acuity ceiling')).toBeVisible();

  await selectPersona(page, 'executive');
  await expect(page.getByText('No measurements found').first()).toBeVisible();

  await selectPersona(page, 'field');
  await expect(page.getByRole('heading', { name: 'New Case' })).toBeVisible();
  await expect(page.getByText('Pitfall guards', { exact: true })).toBeVisible();

  await openWorkspace(page, 'Intake', 'Guided Intake');
  await page.getByRole('button', { name: 'Field mode' }).click();
  await expect(page.getByText('Field mode captures scene facts')).toBeVisible();
  await expect(page.getByLabel('Risk formulation')).toHaveCount(0);
  await expect(page.getByLabel('Presenting problem')).toBeVisible();

  await page.getByRole('button', { name: 'Clinical mode' }).click();
  await expect(page.getByLabel('Risk formulation')).toBeVisible();
});

test('intake case can generate and send a packet with custody events', async ({ page }) => {
  await page.getByRole('button', { name: 'Adult Demo A' }).click();
  await openWorkspace(page, 'Placement', 'Packet Preview');
  await expect(page.getByRole('heading', { name: 'Packet completeness checklist' })).toBeVisible();
  await expect(page.getByText('Missing').first()).toBeVisible();

  await page.getByRole('button', { name: 'Generate packet' }).click();
  await expect(page.getByText('Ready', { exact: true }).first()).toBeVisible();

  await page.getByRole('button', { name: 'Send packet to facilities' }).click();
  await expect(page.getByText('Sent', { exact: true }).first()).toBeVisible();

  await openWorkspace(page, 'More', 'Custody Ledger');
  await expect(page.getByText('PACKET_HASH_SEALED').first()).toBeVisible();
  await expect(page.getByText('PACKET_SENT').first()).toBeVisible();
  await page.getByRole('button', { name: 'Verify custody chain' }).click();
  await expect(page.getByText('Verified', { exact: true })).toBeVisible();
});

test('mock admit lab filters the synthetic cohort and preserves review gates', async ({ page }) => {
  await openWorkspace(page, 'More', 'Mock Admit Lab');
  await expect(page.getByRole('heading', { name: 'Mock Inpatient Admit Lab' })).toBeVisible();
  await expect(page.getByText('Synthetic mock-use only')).toBeVisible();

  await page.getByRole('group', { name: 'Cohort filter' }).getByRole('button', { name: 'Geriatric 55+', exact: true }).click();
  await expect(page.getByRole('button', { name: /Ron Swanson/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /April Ludgate/ })).toHaveCount(0);
  await page.getByRole('button', { name: /Ron Swanson/ }).click();
  await page.getByRole('tab', { name: 'Decision path' }).click();
  await expect(page.getByText('Medical clearance is required before psychiatric-only placement.')).toBeVisible();
  await expect(page.getByText('Medical, clinician, counsel review').first()).toBeVisible();

  await page.getByRole('tab', { name: 'UR / chart draft' }).click();
  await expect(page.getByRole('heading', { name: 'Draft chart and UR summary' })).toBeVisible();
  await expect(page.getByText('Do not copy this training draft into a real chart or authorization request.')).toBeVisible();
});
