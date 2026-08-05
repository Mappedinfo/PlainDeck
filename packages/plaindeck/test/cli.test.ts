import { cp, mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { spawn } from 'node:child_process'
import { describe, expect, it } from 'vitest'

const cli = resolve('packages/plaindeck/dist/cli.js')
const starter = resolve('examples/starter')

function run(args: string[], input?: string) {
  return new Promise<{ code: number | null; stdout: string; stderr: string }>((resolveRun, reject) => {
    const child = spawn(process.execPath, [cli, ...args], { stdio: ['pipe', 'pipe', 'pipe'] })
    let stdout = ''; let stderr = ''
    child.stdout.on('data', chunk => { stdout += chunk })
    child.stderr.on('data', chunk => { stderr += chunk })
    child.on('error', reject)
    child.on('close', code => resolveRun({ code, stdout, stderr }))
    child.stdin.end(input)
  })
}

describe('PlainDeck CLI', () => {
  it('initializes a complete project without the TypeScript API', async () => {
    const parent = await mkdtemp(join(tmpdir(), 'plaindeck-cli-init-'))
    const root = join(parent, 'agent-deck')
    const initialized = await run(['init', root, '--title', 'Agent-native deck', '--template', 'pitch', '--theme', 'night-citrus', '--json'])
    expect(initialized.code).toBe(0)
    expect(JSON.parse(initialized.stdout)).toMatchObject({ ok: true, project: root, title: 'Agent-native deck', template: 'pitch', theme: 'night-citrus', slides: 5 })
    expect(await readFile(join(root, 'deck.json'), 'utf8')).toContain('Agent-native deck')
    expect(await readFile(join(root, 'theme.json'), 'utf8')).toContain('#D8FF52')
    expect(await readFile(join(root, '.gitignore'), 'utf8')).toContain('exports/*')

    const validation = await run(['validate', root, '--json'])
    expect(JSON.parse(validation.stdout)).toMatchObject({ ok: true, issues: [] })
    const inspection = await run(['inspect', root, '--json'])
    expect(JSON.parse(inspection.stdout).slides).toHaveLength(5)

    const before = await readFile(join(root, 'deck.json'), 'utf8')
    const repeated = await run(['init', root, '--json'])
    expect(repeated.code).toBe(2)
    expect(await readFile(join(root, 'deck.json'), 'utf8')).toBe(before)
  })

  it('refuses init before writing when any planned file already exists', async () => {
    const parent = await mkdtemp(join(tmpdir(), 'plaindeck-cli-collision-'))
    const themeRoot = join(parent, 'theme-collision'); await mkdir(themeRoot); await writeFile(join(themeRoot, 'theme.json'), 'keep-theme', 'utf8')
    const themeResult = await run(['init', themeRoot, '--json'])
    expect(themeResult.code).toBe(2)
    expect(JSON.parse(themeResult.stdout).error.message).toContain('./theme.json')
    expect(await readFile(join(themeRoot, 'theme.json'), 'utf8')).toBe('keep-theme')
    await expect(readFile(join(themeRoot, 'deck.json'), 'utf8')).rejects.toMatchObject({ code: 'ENOENT' })

    const slideRoot = join(parent, 'slide-collision'); await mkdir(join(slideRoot, 'slides'), { recursive: true }); await writeFile(join(slideRoot, 'slides/001-cover.json'), 'keep-slide', 'utf8')
    const slideResult = await run(['init', slideRoot, '--json'])
    expect(slideResult.code).toBe(2)
    expect(JSON.parse(slideResult.stdout).error.message).toContain('./slides/001-cover.json')
    expect(await readFile(join(slideRoot, 'slides/001-cover.json'), 'utf8')).toBe('keep-slide')
    await expect(readFile(join(slideRoot, 'deck.json'), 'utf8')).rejects.toMatchObject({ code: 'ENOENT' })
  })

  it('validates and inspects a project as JSON', async () => {
    const validation = await run(['validate', starter, '--json'])
    expect(validation.code).toBe(0)
    expect(JSON.parse(validation.stdout)).toMatchObject({ ok: true, issues: [] })
    const inspection = await run(['inspect', starter, '--json'])
    expect(JSON.parse(inspection.stdout).slides).toHaveLength(5)
  })

  it('accepts operations from stdin and keeps dry-run read-only', async () => {
    const root = await mkdtemp(join(tmpdir(), 'plaindeck-cli-'))
    await cp(starter, root, { recursive: true })
    const slide = join(root, 'slides/001-intro.json')
    const before = await readFile(slide, 'utf8')
    const operations = JSON.stringify([{ op: 'rename-slide', slide: './slides/001-intro.json', name: 'CLI dry run' }])
    const dryRun = await run(['apply', root, '--ops', '-', '--dry-run', '--json'], operations)
    expect(JSON.parse(dryRun.stdout)).toMatchObject({ ok: true, dryRun: true, changedPaths: ['./slides/001-intro.json'] })
    expect(await readFile(slide, 'utf8')).toBe(before)
    const applied = await run(['apply', root, '--ops', '-', '--json'], operations)
    expect(applied.code).toBe(0)
    expect(await readFile(slide, 'utf8')).toContain('CLI dry run')
  })

  it('adds a layout slide and renders standalone HTML', async () => {
    const root = await mkdtemp(join(tmpdir(), 'plaindeck-cli-render-'))
    await cp(starter, root, { recursive: true })
    const added = await run(['add-slide', root, '--layout', 'image-right', '--name', 'Results', '--json'])
    expect(JSON.parse(added.stdout)).toMatchObject({ ok: true, slide: expect.stringMatching(/\.\/slides\/006-/) })
    const html = join(root, 'exports/deck.html')
    const rendered = await run(['render', root, '--format', 'html', '--output', html, '--json'])
    expect(JSON.parse(rendered.stdout)).toMatchObject({ ok: true, format: 'html', files: [html] })
    const output = await readFile(html, 'utf8')
    expect(output).toContain('Results')
    expect(output).toContain('class="player-bar"')
  })

  it('adds an editable summary-card slide from Markdown stdin', async () => {
    const root = await mkdtemp(join(tmpdir(), 'plaindeck-cli-cards-'))
    await cp(starter, root, { recursive: true })
    const markdown = '# Agent 简报\n\n## 能力\n从长文提炼结构化要点。\nauto_awesome\n\n## 边界\n重要事实仍需人工复核。\nverified'
    const added = await run(['add-cards', root, '--content', '-', '--name', 'Daily brief', '--json'], markdown)
    expect(added.code).toBe(0)
    expect(JSON.parse(added.stdout)).toMatchObject({ ok: true, cards: 2, slide: expect.stringMatching(/\.\/slides\/006-summary-/) })
    const slidePath = JSON.parse(added.stdout).slide.replace(/^\.\//, '')
    const slide = await readFile(join(root, slidePath), 'utf8')
    expect(slide).toContain('Daily brief')
    expect(slide).toContain('从长文提炼结构化要点。')
    expect(slide).toContain('summary-card-2-body')
  })

  it('discovers all styles and applies a selected native recipe', async () => {
    const listed = await run(['styles', '--json'])
    expect(listed.code).toBe(0)
    expect(JSON.parse(listed.stdout)).toMatchObject({ ok: true, count: 174, styles: expect.arrayContaining([expect.objectContaining({ id: 'terminalCli', variant: 'terminal' })]) })
    const searched = await run(['styles', '--search', '水墨', '--json'])
    expect(JSON.parse(searched.stdout)).toMatchObject({ ok: true, styles: expect.arrayContaining([expect.objectContaining({ id: 'inkLandscape' })]) })

    const root = await mkdtemp(join(tmpdir(), 'plaindeck-cli-style-'))
    await cp(starter, root, { recursive: true })
    const markdown = '# Terminal brief\n\n## Native\nGenerated as editable PlainDeck elements.\nterminal'
    const added = await run(['add-cards', root, '--content', '-', '--style', 'terminalCli', '--json'], markdown)
    expect(JSON.parse(added.stdout)).toMatchObject({ ok: true, cards: 1, style: 'terminalCli' })
    const slidePath = JSON.parse(added.stdout).slide.replace(/^\.\//, '')
    const slide = JSON.parse(await readFile(join(root, slidePath), 'utf8'))
    expect(slide).toMatchObject({ layoutRef: 'summary-cards/terminalCli', background: { color: '#0a0a0a' } })
    expect(slide.elements).toEqual(expect.arrayContaining([expect.objectContaining({ id: 'style-terminal-bar' })]))
  })

  it('uses a distinct usage error exit code', async () => {
    const result = await run(['render', starter, '--format', 'bad', '--output', 'x', '--json'])
    expect(result.code).toBe(2)
    expect(JSON.parse(result.stdout)).toMatchObject({ ok: false, error: { type: 'usage' } })
  })

  it('does not write when an operation batch is invalid', async () => {
    const root = await mkdtemp(join(tmpdir(), 'plaindeck-cli-invalid-'))
    await cp(starter, root, { recursive: true })
    const slide = join(root, 'slides/001-intro.json')
    const before = await readFile(slide, 'utf8')
    const operations = JSON.stringify([
      { op: 'rename-slide', slide: './slides/001-intro.json', name: 'Must not persist' },
      { op: 'remove-element', slide: './slides/001-intro.json', element: 'missing' },
    ])
    const result = await run(['apply', root, '--ops', '-', '--json'], operations)
    expect(result.code).toBe(1)
    expect(JSON.parse(result.stdout)).toMatchObject({ ok: false, error: { type: 'runtime' } })
    expect(await readFile(slide, 'utf8')).toBe(before)
  })
})
