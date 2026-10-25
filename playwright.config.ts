import { defineConfig, devices } from "@playwright/test";

const PORT = 4321;

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
    command: `pnpm build && pnpm preview --port ${PORT}`,
    url: `http://localhost:${PORT}/CubesWebsite/`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
