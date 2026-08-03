import { spawnSync } from 'node:child_process'
import { existsSync, readdirSync } from 'node:fs'
import { homedir } from 'node:os'
import { join, resolve } from 'node:path'
import process from 'node:process'
import { chromium } from 'playwright'

const output = resolve(process.argv[2] ?? '/tmp/plaindeck-remotion-demo.png')
const cli = resolve('node_modules/@remotion/cli/remotion-cli.js')
const playwrightExecutable = chromium.executablePath()
const cache = join(homedir(), 'Library', 'Caches', 'ms-playwright')
const cachedHeadlessShell = existsSync(cache) ? readdirSync(cache).filter(name => name.startsWith('chromium_headless_shell-')).sort().reverse().map(name => join(cache, name, 'chrome-headless-shell-mac-arm64', 'chrome-headless-shell')).find(existsSync) : undefined
const browserExecutable = existsSync(playwrightExecutable) ? playwrightExecutable : cachedHeadlessShell
if (!browserExecutable) throw new Error('No installed Playwright Chromium executable was found. Run: npx playwright install chromium')
const result = spawnSync(process.execPath, [
  cli, 'still', 'examples/remotion/src/index.ts', 'PlainDeckDemo', output,
  '--frame=60', `--browser-executable=${browserExecutable}`,
], { cwd: process.cwd(), stdio: 'inherit' })
if (result.error) throw result.error
if (result.status !== 0) process.exit(result.status ?? 1)
console.log(`Rendered PlainDeck Remotion demo: ${output}`)
