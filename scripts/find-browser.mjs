/**
 * Shared Chromium discovery for local rendering tooling.
 * Single source of truth for the browser-executable fallback chain used by
 * playwright.config.ts (e2e) and scripts/render-remotion-demo.mjs (Remotion).
 *
 * Order of preference:
 *  1. Playwright's own browser resolution (`chromium.executablePath()`).
 *  2. A scan of the Playwright browser cache for a headless shell, which
 *     covers environments where only the cache was populated (e.g. CI
 *     artifacts, `npx playwright install` with a custom cache location).
 */
import { existsSync, readdirSync } from 'node:fs'
import { createRequire } from 'node:module'
import { homedir } from 'node:os'
import { join } from 'node:path'

const require = createRequire(import.meta.url)

const SHELL_PLATFORM_DIRS = [
  'chrome-headless-shell-mac-arm64',
  'chrome-headless-shell-mac-x64',
  'chrome-headless-shell-linux64',
  'chrome-headless-shell-win64',
]

const SHELL_BINARY_NAMES = ['chrome-headless-shell', 'chrome-headless-shell.exe']

function cacheRoot() {
  if (process.platform === 'darwin') return join(homedir(), 'Library', 'Caches', 'ms-playwright')
  if (process.platform === 'linux') return join(homedir(), '.cache', 'ms-playwright')
  return join(process.env.LOCALAPPDATA ?? '', 'ms-playwright')
}

/** Scan the Playwright browser cache for an installed headless shell. */
export function findCachedChromium() {
  const root = cacheRoot()
  if (!existsSync(root)) return undefined
  const versionDirs = readdirSync(root)
    .filter(name => name.startsWith('chromium_headless_shell-'))
    .sort()
    .reverse()
  for (const dir of versionDirs) {
    for (const platformDir of SHELL_PLATFORM_DIRS) {
      for (const binaryName of SHELL_BINARY_NAMES) {
        const candidate = join(root, dir, platformDir, binaryName)
        if (existsSync(candidate)) return candidate
      }
    }
  }
  return undefined
}

/** Prefer Playwright's own browser discovery, falling back to the cache scan. */
export function findChromiumExecutable() {
  try {
    const { chromium } = require('playwright')
    const resolved = chromium.executablePath()
    if (resolved && existsSync(resolved)) return resolved
  } catch {
    // playwright or its browsers are not installed; fall through to the cache scan.
  }
  return findCachedChromium()
}
