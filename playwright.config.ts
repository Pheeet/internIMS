import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  timeout: 120_000,
  retries: 0,
  use: {
    baseURL: "http://localhost:3000",
    viewport: { width: 1280, height: 900 },
    actionTimeout: 10_000,
    navigationTimeout: 15_000,
    launchOptions: {
      args: ["--window-position=0,0"],
    },
  },
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: true,
  },
});
