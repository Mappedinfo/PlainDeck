import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createPlainDeckServer } from '../src/index.js'

const root = mkdtempSync(join(tmpdir(), 'plaindeck-mcp-test-'))
const project = join(root, 'deck')
let client: Client
let server: Awaited<ReturnType<typeof createPlainDeckServer>>

const call = async (name: string, args: Record<string, unknown>) => {
  const result = await client.callTool({ name, arguments: args })
  if (result.isError) throw new Error(`tool ${name} failed: ${JSON.stringify(result.content)}`)
  return result.structuredContent as Record<string, unknown>
}

beforeAll(async () => {
  server = createPlainDeckServer()
  client = new Client({ name: 'plaindeck-mcp-test', version: '0.0.0' })
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair()
  await Promise.all([client.connect(clientTransport), server.connect(serverTransport)])
})

afterAll(async () => {
  await client.close()
  rmSync(root, { recursive: true, force: true })
})

describe('plaindeck-mcp', () => {
  it('exposes the expected tool set', async () => {
    const tools = await client.listTools()
    const names = tools.tools.map(tool => tool.name).sort()
    expect(names).toEqual(['add_cards', 'add_table', 'apply_operations', 'init', 'inspect', 'render', 'styles', 'validate'])
  })

  it('initializes a showcase project on disk', async () => {
    const result = await call('init', { projectPath: project, title: 'MCP demo deck', template: 'showcase' })
    expect(result).toMatchObject({ ok: true, title: 'MCP demo deck', template: 'showcase', slideCount: 5 })
    expect(existsSync(join(project, 'deck.json'))).toBe(true)
    expect(existsSync(join(project, 'theme.json'))).toBe(true)
    expect(existsSync(join(project, 'slides', '001-cover.json'))).toBe(true)
    expect(existsSync(join(project, '.gitignore'))).toBe(true)
  })

  it('refuses to initialize over an existing project', async () => {
    const result = await client.callTool({ name: 'init', arguments: { projectPath: project } })
    expect(result.isError).toBe(true)
  })

  it('validates a healthy project', async () => {
    const result = await call('validate', { projectPath: project })
    expect(result).toMatchObject({ valid: true, title: 'MCP demo deck', slideCount: 5, issues: [] })
  })

  it('returns a structured load error for a missing project', async () => {
    const result = await call('validate', { projectPath: join(root, 'missing') })
    expect(result).toMatchObject({ valid: false, title: null, slideCount: null })
    expect((result.issues as Array<{ code: string }>)[0]?.code).toBe('load_error')
  })

  it('inspects the project structure', async () => {
    const result = await call('inspect', { projectPath: project })
    expect(result).toMatchObject({ title: 'MCP demo deck', slideCount: 5 })
    const slides = result.slides as Array<{ index: number; path: string; elementCount: number }>
    expect(slides[0]).toMatchObject({ index: 1, path: './slides/001-cover.json' })
    expect(slides.every(slide => slide.elementCount > 0)).toBe(true)
  })

  it('applies operations with a dry run that never writes', async () => {
    const dry = await call('apply_operations', {
      projectPath: project,
      dryRun: true,
      operations: [{ op: 'rename-slide', slide: './slides/001-cover.json', name: 'Dry run rename' }],
    })
    expect(dry).toMatchObject({ ok: true, dryRun: true })
    const changedPaths = dry.changedPaths as string[]
    expect(changedPaths).toEqual(['./slides/001-cover.json'])
    expect(readFileSync(join(project, 'slides/001-cover.json'), 'utf8')).not.toContain('Dry run rename')

    const applied = await call('apply_operations', {
      projectPath: project,
      operations: [{ op: 'rename-slide', slide: './slides/001-cover.json', name: 'Renamed cover' }],
    })
    expect(applied).toMatchObject({ ok: true, dryRun: false, slideCount: 5 })
    expect(readFileSync(join(project, 'slides/001-cover.json'), 'utf8')).toContain('Renamed cover')
  })

  it('reports operation format errors with actionable messages', async () => {
    const result = await client.callTool({
      name: 'apply_operations',
      arguments: { projectPath: project, operations: [{ op: 'not-an-op' }] },
    })
    expect(result.isError).toBe(true)
    const text = JSON.stringify(result.content)
    expect(text).toContain('操作格式无效')
  })

  it('adds a summary-card slide from structured Markdown', async () => {
    const result = await call('add_cards', {
      projectPath: project,
      content: '# 三个要点\n## 提炼\n每张卡只承载一个核心要点。\n## 编排\n数量自动适配。\n## 复核\nAI 初稿，人复核。',
      style: 'claudeStyle',
    })
    expect(result).toMatchObject({ ok: true, cards: 3, style: 'claudeStyle' })
    const slide = result.slide as string
    expect(slide.startsWith('./slides/')).toBe(true)
    expect(existsSync(join(project, slide.replace(/^\.\//, '')))).toBe(true)
  })

  it('adds a native table slide from Markdown data', async () => {
    const result = await call('add_table', {
      projectPath: project,
      data: '# 对比结果\n| 方法 | 分数 |\n| --- | ---: |\n| Baseline | 82.4 |\n| PlainDeck | 89.7 |\nTakeaway: 完整模型领先',
      style: 'rules',
    })
    expect(result).toMatchObject({ ok: true, rows: 2, columns: 2, style: 'rules', title: '对比结果' })
  })

  it('renders a standalone HTML player inline', async () => {
    const result = await client.callTool({ name: 'render', arguments: { projectPath: project, format: 'html' } })
    expect(result.isError ?? false).toBe(false)
    const text = result.content[0]?.type === 'text' ? (result.content[0] as { text: string }).text : ''
    expect(text).toContain('<!doctype html>')
    expect(text).toContain('class="player-bar"')
    expect(text).toContain('Renamed cover')
  })

  it('renders HTML to an output file', async () => {
    const output = join(root, 'out', 'deck.html')
    const result = await call('render', { projectPath: project, format: 'html', output })
    expect(result).toMatchObject({ format: 'html', written: true })
    expect(existsSync(output)).toBe(true)
    expect(readFileSync(output, 'utf8')).toContain('<!doctype html>')
  })

  it('searches visual recipes', async () => {
    const all = await call('styles', {})
    expect((all.styles as unknown[]).length).toBeGreaterThan(100)
    const nature = await call('styles', { query: 'nature' })
    expect((nature.styles as unknown[]).length).toBeGreaterThan(0)
    expect((nature.count as number) > 0).toBe(true)
  })
})
