import { defineConfig } from '@playwright/test'
import { existsSync, readdirSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

const cache = join(homedir(), 'Library', 'Caches', 'ms-playwright')
const cachedBrowser = existsSync(cache)
  ? readdirSync(cache).filter(name => name.startsWith('chromium_headless_shell-')).sort().reverse().map(name => join(cache, name, 'chrome-headless-shell-mac-arm64', 'chrome-headless-shell')).find(existsSync)
  : undefined

export default defineConfig({
  testDir: './tests/e2e',
  use: { baseURL: 'http://127.0.0.1:4173/PlainDeck/', trace: 'retain-on-failure', launchOptions: { executablePath: cachedBrowser } },
  webServer: { command: 'npm run preview -- --host 127.0.0.1', port: 4173, reuseExistingServer: true },
})
