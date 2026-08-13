import {defineConfig, devices} from '@playwright/test'

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000'
const startLocalServer =
  process.env.PLAYWRIGHT_START_LOCAL_SERVER === 'true' ||
  !process.env.PLAYWRIGHT_BASE_URL
const webServerCommand =
  process.env.PLAYWRIGHT_WEB_SERVER_COMMAND ??
  `NEXT_PUBLIC_APP_URL=${baseURL} NEXTAUTH_URL=${baseURL} pnpm build && PLAYWRIGHT_BASE_URL=${baseURL} node scripts/start-e2e-production.mjs`

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  outputDir: 'test-results/playwright',
  timeout: 60_000,
  workers: 1,
  expect: {
    timeout: 10_000,
  },
  reporter: [
    ['list'],
    ['html', {open: 'never', outputFolder: 'playwright-report'}],
  ],
  use: {
    baseURL,
    actionTimeout: 10_000,
    navigationTimeout: 30_000,
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'desktop-chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: {height: 900, width: 1440},
      },
    },
    {
      name: 'mobile-chromium',
      use: {...devices['Pixel 7']},
    },
  ],
  webServer: startLocalServer
    ? {
        command: webServerCommand,
        reuseExistingServer: false,
        timeout: 300_000,
        url: baseURL,
      }
    : undefined,
})
