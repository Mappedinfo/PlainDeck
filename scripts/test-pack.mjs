import { spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const packages = [
  { workspace: 'plaindeck', manifest: 'packages/plaindeck/package.json' },
  { workspace: '@mappedinfo/plaindeck-react', manifest: 'packages/react/package.json' },
  { workspace: '@mappedinfo/plaindeck-remotion', manifest: 'packages/remotion/package.json' },
]
const expectedVersion = JSON.parse(readFileSync(join(root, packages[0].manifest), 'utf8')).version
const work = mkdtempSync(join(tmpdir(), 'plaindeck-pack-test-'))
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm'

function run(command, args, options = {}) {
  const result = spawnSync(command, args, { cwd: options.cwd ?? root, encoding: 'utf8', timeout: 180_000, env: { ...process.env, NPM_CONFIG_CACHE: join(work, 'npm-cache') } })
  if (result.status !== 0) throw new Error(`${command} ${args.join(' ')} failed\n${result.stdout}\n${result.stderr}`)
  return result.stdout.trim()
}

try {
  const tarballs = []
  for (const item of packages) {
    const manifest = JSON.parse(readFileSync(join(root, item.manifest), 'utf8'))
    if (manifest.version !== expectedVersion) throw new Error(`${manifest.name} version ${manifest.version} does not match ${expectedVersion}`)
    const packed = JSON.parse(run(npm, ['pack', '-w', item.workspace, '--json', '--pack-destination', work]))[0]
    if (!packed.files.some(file => file.path === 'LICENSE')) throw new Error(`${manifest.name} tarball is missing LICENSE`)
    if (manifest.name === 'plaindeck' && !packed.files.some(file => file.path === 'THIRD_PARTY_NOTICES.md')) {
      throw new Error('plaindeck tarball is missing THIRD_PARTY_NOTICES.md')
    }
    const forbidden = packed.files.map(file => file.path).filter(path => /(^|\/)(\.env|test-results|playwright-report|src)(\/|$)/.test(path))
    if (forbidden.length) throw new Error(`${manifest.name} tarball includes forbidden files: ${forbidden.join(', ')}`)
    tarballs.push(join(work, packed.filename))
  }

  const installRoot = join(work, 'install')
  mkdirSync(installRoot)
  run(npm, ['init', '-y'], { cwd: installRoot })
  run(npm, ['install', '--ignore-scripts', '--no-audit', '--no-fund', ...tarballs, 'react@19.2.3', 'react-dom@19.2.3', 'remotion@4.0.504'], { cwd: installRoot })
  const cli = join(installRoot, 'node_modules', '.bin', process.platform === 'win32' ? 'plaindeck.cmd' : 'plaindeck')
  const version = run(cli, ['--version'], { cwd: installRoot })
  if (version !== expectedVersion) throw new Error(`unexpected CLI version: ${version}; expected ${expectedVersion}`)
  const exportsCheck = run(process.execPath, ['--input-type=module', '-e', "import { createDeckTemplate, validateDeck } from 'plaindeck'; import { DeckSchema } from 'plaindeck/core'; import { renderHtml } from 'plaindeck/render'; import { PlainDeckSlide } from '@mappedinfo/plaindeck-react'; import { PlainDeckTimeline, elementAnimationStyle } from '@mappedinfo/plaindeck-remotion'; console.log([typeof createDeckTemplate, typeof validateDeck, typeof DeckSchema.parse, typeof renderHtml, typeof PlainDeckSlide, typeof PlainDeckTimeline, typeof elementAnimationStyle].join(','))"], { cwd: installRoot })
  if (exportsCheck !== 'function,function,function,function,function,function,function') throw new Error(`unexpected package exports: ${exportsCheck}`)
  const created = join(work, 'created-deck')
  const initialized = JSON.parse(run(cli, ['init', created, '--title', 'Packed CLI deck', '--template', 'showcase', '--theme', 'studio-cobalt', '--json'], { cwd: installRoot }))
  if (!initialized.ok || initialized.slides !== 5) throw new Error(`packed CLI init failed: ${JSON.stringify(initialized)}`)
  const createdValidation = JSON.parse(run(cli, ['validate', created, '--json'], { cwd: installRoot }))
  if (!createdValidation.ok) throw new Error(`packed initialized deck validation failed: ${JSON.stringify(createdValidation)}`)
  const starter = resolve(root, 'examples/starter')
  const validation = JSON.parse(run(cli, ['validate', starter, '--json'], { cwd: installRoot }))
  if (!validation.ok) throw new Error(`packed CLI validation failed: ${JSON.stringify(validation)}`)
  const html = join(work, 'starter.html')
  run(cli, ['render', starter, '--format', 'html', '--output', html, '--json'], { cwd: installRoot })
  const renderedHtml = readFileSync(html, 'utf8')
  if (!renderedHtml.includes('<!doctype html>') || !renderedHtml.includes('class="player-bar"')) throw new Error('packed CLI did not render the interactive standalone HTML player')
  process.stdout.write(`✓ installed and exercised ${tarballs.length} PlainDeck ${expectedVersion} tarballs\n`)
} finally {
  rmSync(work, { recursive: true, force: true })
}
