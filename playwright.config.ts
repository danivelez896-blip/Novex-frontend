import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/browser",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 2,
  reporter: [["list"], ["html", { open: "never" }]],
  use: { baseURL: "http://127.0.0.1:3100", serviceWorkers: "block", trace: "retain-on-failure", screenshot: "only-on-failure" },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
  webServer: {
    command: "npm run dev -- --hostname 127.0.0.1 --port 3100",
    url: "http://127.0.0.1:3100/return/test-order",
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      NOVEX_API_URL: "http://127.0.0.1:9",
      SUPABASE_URL: "http://127.0.0.1:9",
      SUPABASE_SECRET_KEY: "synthetic-browser-tests-only",
      NOVEX_ENABLE_REAL_ECONOMIC_ACTIONS: "false",
      NEXT_PUBLIC_NOVEX_ENABLE_REAL_ECONOMIC_ACTIONS: "false",
      NEXT_TELEMETRY_DISABLED: "1",
    },
  },
});
