import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./smoke",
  testMatch: "operating-assurance.spec.ts",
  timeout: 60_000,
  workers: 1,
  use: {
    baseURL: "http://127.0.0.1:5177",
    trace: "retain-on-failure",
  },
  webServer: [
    {
      command: "npm --prefix .. run api:dev",
      url: "http://127.0.0.1:4317/api/auth/session",
      reuseExistingServer: false,
      timeout: 45_000,
      env: { API_PORT: "4317" },
    },
    {
      command: "npm run dev -- --port 5177 --strictPort",
      url: "http://127.0.0.1:5177",
      reuseExistingServer: false,
      timeout: 45_000,
      env: { API_PORT: "4317" },
    },
  ],
  projects: [
    {
      name: "desktop",
      use: {
        ...devices["Desktop Chrome"],
        channel: "chrome",
        viewport: { width: 1440, height: 1000 },
      },
    },
    {
      name: "mobile",
      use: {
        ...devices["Desktop Chrome"],
        channel: "chrome",
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
      },
    },
  ],
});
