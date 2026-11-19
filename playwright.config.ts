import { defineConfig, devices } from "@playwright/test";

/* E2E sobre la build de producción (vite preview). En CI BASE_PATH=/beautiful-ui/. */
const base = (process.env.BASE_PATH ?? "/").replace(/\/?$/, "/");

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 30_000,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: `http://localhost:4173${base}`,
    ...devices["Desktop Chrome"],
    launchOptions: process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : undefined,
  },
  webServer: {
    command: "npx vite preview --port 4173 --strictPort",
    url: `http://localhost:4173${base}`,
    reuseExistingServer: !process.env.CI,
  },
});
