import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './smoke',
  // Both exclusions exist because those suites need API servers this config does
  // not start, and each has a dedicated config that does. They prove different
  // things: this suite is the general Work/prototype shell regression.
  testIgnore: [
    'rev-ops.spec.ts', // playwright.revops.config.ts — isolated Rev Ops API
    'operating-assurance.spec.ts', // playwright.assurance.config.ts — api:dev + governed OA
  ],
  timeout: 30_000,
  use: {
    baseURL: 'http://127.0.0.1:5173',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'npm run dev -- --port 5173',
    url: 'http://127.0.0.1:5173',
    reuseExistingServer: true,
    timeout: 30_000,
  },
  projects: [
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'], channel: 'chrome', viewport: { width: 1440, height: 1000 } },
    },
    {
      name: 'mobile',
      use: {
        ...devices['Desktop Chrome'],
        channel: 'chrome',
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
      },
    },
  ],
});
