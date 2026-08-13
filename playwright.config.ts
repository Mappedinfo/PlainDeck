import { defineConfig } from '@playwright/test'
import { findChromiumExecutable } from './scripts/find-browser.mjs'

const basePath = process.env.VITE_BASE_PATH ?? '/PlainDeck/'
const executablePath = findChromiumExecutable()

export default defineConfig({
  testDir: './tests/e2e',
  use: {
    baseURL: `http://127.0.0.1:4173${basePath}`,
    trace: 'retain-on-failure',
    launchOptions: executablePath ? { executablePath } : undefined,
  },
  webServer: { command: 'npm run preview -- --host 127.0.0.1', port: 4173, reuseExistingServer: true },
})
