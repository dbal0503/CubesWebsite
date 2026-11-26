import { defineConfig, devices } from "@playwright/test";

// Not 4321: that's `astro dev`, whose toolbar and dev-only markup would skew the tests.
const PORT = 4329;

export default defineConfig({
  testDir: "tests/e2e",
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  use: {
    baseURL: `http://localhost:${PORT}/CubesWebsite/`,
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
  webServer: {
    // --ignore-lock: astro preview exits early if a lock file says another
    // preview server is running, which a crashed test run can leave behind.
    command: `pnpm build && pnpm preview --port ${PORT} --ignore-lock`,
    url: `http://localhost:${PORT}/CubesWebsite/`,
    // Always test a fresh production build.
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
