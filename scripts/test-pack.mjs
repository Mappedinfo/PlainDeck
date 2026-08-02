import { spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const work = mkdtempSync(join(tmpdir(), 'plaindeck-pack-test-'))
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm'

function run(command, args, options = {}) {
  const result = spawnSync(command, args, { cwd: options.cwd ?? root, encoding: 'utf8', timeout: 120_000, env: { ...process.env, NPM_CONFIG_CACHE: join(work, 'npm-cache') } })
  if (result.status !== 0) throw new Error(`${command} ${args.join(' ')} failed\n${result.stdout}\n${result.stderr}`)
  return result.stdout.trim()
}

try {
  const packed = JSON.parse(run(npm, ['pack', '-w', 'plaindeck', '--json', '--pack-destination', work]))
  const tarball = join(work, packed[0].filename)
  const installRoot = join(work, 'install')
  mkdirSync(installRoot)
  run(npm, ['init', '-y'], { cwd: installRoot })
  run(npm, ['install', '--ignore-scripts', '--no-audit', '--no-fund', tarball], { cwd: installRoot })
  const cli = join(installRoot, 'node_modules', '.bin', process.platform === 'win32' ? 'plaindeck.cmd' : 'plaindeck')
  const version = run(cli, ['--version'], { cwd: installRoot })
  if (version !== '0.1.1') throw new Error(`unexpected CLI version: ${version}`)
  const exportsCheck = run(process.execPath, ['--input-type=module', '-e', "import { validateDeck } from 'plaindeck'; import { DeckSchema } from 'plaindeck/core'; import { renderHtml } from 'plaindeck/render'; console.log([typeof validateDeck, typeof DeckSchema.parse, typeof renderHtml].join(','))"], { cwd: installRoot })
  if (exportsCheck !== 'function,function,function') throw new Error(`unexpected package exports: ${exportsCheck}`)
  const starter = resolve(root, 'examples/starter')
  const validation = JSON.parse(run(cli, ['validate', starter, '--json'], { cwd: installRoot }))
  if (!validation.ok) throw new Error(`packed CLI validation failed: ${JSON.stringify(validation)}`)
  const html = join(work, 'starter.html')
  run(cli, ['render', starter, '--format', 'html', '--output', html, '--json'], { cwd: installRoot })
  if (!readFileSync(html, 'utf8').includes('<!doctype html>')) throw new Error('packed CLI did not render standalone HTML')
  process.stdout.write(`✓ installed and exercised ${packed[0].filename}\n`)
} finally {
  rmSync(work, { recursive: true, force: true })
}
