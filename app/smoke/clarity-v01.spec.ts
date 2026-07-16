import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => window.localStorage.clear());
  await page.reload();
});

test('case queue and custody verification render across viewports', async ({ page }, testInfo) => {
  await expect(page.getByRole('heading', { name: 'Case Queue' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Adult Demo A' })).toBeVisible();

  await page.getByRole('button', { name: 'Custody Ledger' }).click();
  await page.getByRole('button', { name: 'Verify custody chain' }).click();
  await expect(page.getByText('Verified')).toBeVisible();

  await page.screenshot({
    path: `/tmp/clarity-v01-${testInfo.project.name}.png`,
    fullPage: true,
  });
});

test('reviewer can create a case and carry a source-linked finding into the packet', async ({ page }) => {
  await page.getByRole('button', { name: 'New Case' }).click();
  await page.getByLabel('Patient token').fill(`DEMO-${Date.now()}`);
  await page.getByLabel('Referral source').fill('ED crisis referral');
  await page.getByRole('button', { name: 'Create case' }).click();
  await expect(page.getByRole('heading', { name: 'Case Overview' })).toBeVisible();

  await page.getByRole('button', { name: 'Guided Intake' }).click();
  await page.getByLabel('Presenting problem').fill('ED crisis referral with safety concerns and collateral pending.');
  await page.getByRole('button', { name: 'Add source-linked risk' }).click();
  await expect(page.locator('.risk-row span', { hasText: 'Source-linked risk finding needs clinician review.' })).toBeVisible();
});

test('packet-ready case shows review gates and accepts mock routing updates', async ({ page }) => {
  await page.getByRole('button', { name: 'Packet Ready Demo D' }).click();

  await page.getByRole('button', { name: 'Medical Necessity' }).click();
  await expect(page.getByText('Needs clinician review', { exact: true })).toBeVisible();

  await page.getByRole('button', { name: 'Legal Status' }).click();
  await expect(page.getByText('Counsel validation required', { exact: true }).last()).toBeVisible();

  await page.getByRole('button', { name: 'Packet Preview' }).click();
  await expect(page.getByRole('heading', { name: 'Assessment summary' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Risk findings' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Legal status draft' })).toBeVisible();
  await expect(page.getByText('Custody hash')).toBeVisible();

  await page.getByRole('button', { name: 'Routing Response' }).click();
  await page.getByRole('button', { name: 'Record mock response' }).click();
  await expect(page.getByRole('cell', { name: 'Request more info' })).toBeVisible();
});

test('command center shows lanes, clocks, and an escalated delay', async ({ page }) => {
  await page.getByRole('button', { name: 'Command Center' }).click();
  await expect(page.getByRole('heading', { name: 'Central Intake Command Center' })).toBeVisible();
  await expect(page.getByText('Insurance verification (parallel lane)')).toBeVisible();
  await expect(page.getByText('Breached').first()).toBeVisible();
  await expect(page.getByText('Escalated')).toBeVisible();
  await expect(page.getByText('below 95% target').first()).toBeVisible();
  await expect(page.getByRole('heading', { name: 'POC Feature Map' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Product Roadmap Feedback Board' })).toBeVisible();
  await expect(page.getByText('What it does:').first()).toBeVisible();
  await expect(page.getByText('Problem solved:').first()).toBeVisible();
  await expect(page.getByText('Correlated workflow:').first()).toBeVisible();
  await expect(page.getByRole('cell', { name: 'MVP 0.3' })).toBeVisible();
});

test('bedboard flags the risky recommendation and requires an override reason', async ({ page }) => {
  await page.getByRole('button', { name: 'Milieu Bedboard' }).click();
  await expect(page.getByRole('heading', { name: 'Milieu Bedboard' })).toBeVisible();
  await expect(page.getByText('Aggression-risk mix in Room 102')).toBeVisible();
  await expect(page.getByText('elopement High')).toBeVisible();

  await page.getByRole('button', { name: 'Override recommendation' }).click();
  await expect(page.getByText('Override requires a documented reason')).toBeVisible();

  await page.getByLabel('Override reason').fill('Holding for 101-A discharge; acuity mix unsafe tonight.');
  await page.getByRole('button', { name: 'Override recommendation' }).click();
  await expect(page.getByText('Reason: Holding for 101-A discharge; acuity mix unsafe tonight.')).toBeVisible();
});

test('role switching scopes workspaces to each stakeholder segment', async ({ page }) => {
  await expect(page.getByRole('button', { name: 'Guided Intake' })).toBeVisible();

  await page.getByLabel('Viewing as').selectOption('facility');
  await expect(page.getByRole('button', { name: 'Guided Intake' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Milieu Bedboard' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Record mock response' })).toBeVisible();

  await page.getByLabel('Viewing as').selectOption('nurse');
  await expect(page.getByRole('heading', { name: 'Milieu Bedboard' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Command Center' })).toHaveCount(0);

  await page.getByLabel('Viewing as').selectOption('central');
  await expect(page.getByRole('heading', { name: 'Central Intake Command Center' })).toBeVisible();

  await page.getByLabel('Viewing as').selectOption('all');
  await expect(page.getByRole('button', { name: 'Guided Intake' })).toBeVisible();
});

test('personas get adapted focus strips and field mode simplifies intake', async ({ page }) => {
  await page.getByLabel('Viewing as').selectOption('central');
  await expect(page.getByText('Breached clocks')).toBeVisible();
  await expect(page.getByText('Packets below 95%')).toBeVisible();

  await page.getByLabel('Viewing as').selectOption('nurse');
  await expect(page.getByText('Units over acuity ceiling')).toBeVisible();

  await page.getByLabel('Viewing as').selectOption('executive');
  await expect(page.getByText('No measurements found').first()).toBeVisible();

  await page.getByLabel('Viewing as').selectOption('field');
  await expect(page.getByRole('heading', { name: 'New Case' })).toBeVisible();
  await expect(page.getByText('Pitfall guards', { exact: true })).toBeVisible();

  await page.getByRole('button', { name: 'Guided Intake' }).click();
  await page.getByRole('button', { name: 'Field mode' }).click();
  await expect(page.getByText('Field mode captures scene facts')).toBeVisible();
  await expect(page.getByLabel('Risk formulation')).toHaveCount(0);
  await expect(page.getByLabel('Presenting problem')).toBeVisible();

  await page.getByRole('button', { name: 'Clinical mode' }).click();
  await expect(page.getByLabel('Risk formulation')).toBeVisible();
});

test('intake case can generate and send a packet with custody events', async ({ page }) => {
  await page.getByRole('button', { name: 'Adult Demo A' }).click();
  await page.getByRole('button', { name: 'Packet Preview' }).click();
  await expect(page.getByRole('heading', { name: 'Packet completeness checklist' })).toBeVisible();
  await expect(page.getByText('Missing').first()).toBeVisible();

  await page.getByRole('button', { name: 'Generate packet' }).click();
  await expect(page.getByText('Ready', { exact: true }).first()).toBeVisible();

  await page.getByRole('button', { name: 'Send packet to facilities' }).click();
  await expect(page.getByText('Sent', { exact: true }).first()).toBeVisible();

  await page.getByRole('button', { name: 'Custody Ledger' }).click();
  await expect(page.getByText('PACKET_HASH_SEALED').first()).toBeVisible();
  await expect(page.getByText('PACKET_SENT').first()).toBeVisible();
  await page.getByRole('button', { name: 'Verify custody chain' }).click();
  await expect(page.getByText('Verified')).toBeVisible();
});
