import { defineConfig } from '@playwright/test'
import { findChromiumExecutable } from './scripts/find-browser.mjs'

const basePath = process.env.VITE_BASE_PATH ?? '/PlainDeck/'
const executablePath = findChromiumExecutable()
// Override when the default port is taken by an unrelated local server.
const port = Number(process.env.E2E_PORT ?? 4173)

export default defineConfig({
  testDir: './tests/e2e',
  use: {
    baseURL: `http://127.0.0.1:${port}${basePath}`,
    trace: 'retain-on-failure',
    launchOptions: executablePath ? { executablePath } : undefined,
  },
  webServer: { command: `npm run preview -- --host 127.0.0.1 --port ${port}`, port, reuseExistingServer: true },
})
