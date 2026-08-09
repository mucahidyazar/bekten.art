import {defineConfig, devices} from '@playwright/test'

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:3000'
const startLocalServer = !process.env.PLAYWRIGHT_BASE_URL
const webServerCommand =
  process.env.PLAYWRIGHT_WEB_SERVER_COMMAND ??
  'pnpm build && pnpm start --hostname 127.0.0.1'

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
        reuseExistingServer: !process.env.CI,
        timeout: 300_000,
        url: baseURL,
      }
    : undefined,
})
