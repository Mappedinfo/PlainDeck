import { spawnSync } from 'node:child_process'
import { resolve } from 'node:path'
import process from 'node:process'
import { findChromiumExecutable } from './find-browser.mjs'

const output = resolve(process.argv[2] ?? '/tmp/plaindeck-remotion-demo.png')
const cli = resolve('node_modules/@remotion/cli/remotion-cli.js')
const browserExecutable = findChromiumExecutable()
if (!browserExecutable) throw new Error('No installed Playwright Chromium executable was found. Run: npx playwright install chromium')
const result = spawnSync(process.execPath, [
  cli, 'still', 'examples/remotion/src/index.ts', 'PlainDeckDemo', output,
  '--frame=60', `--browser-executable=${browserExecutable}`,
], { cwd: process.cwd(), stdio: 'inherit' })
if (result.error) throw result.error
if (result.status !== 0) process.exit(result.status ?? 1)
console.log(`Rendered PlainDeck Remotion demo: ${output}`)
