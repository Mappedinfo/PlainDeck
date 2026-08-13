/**
 * PlainDeck MCP server — agent-native slide decks over the Model Context
 * Protocol. Exposes the PlainDeck Agent API (init / validate / inspect /
 * apply operations / add cards / add tables / render) as MCP tools so any
 * MCP-capable agent — including DeepSeek Harness via the `dsh-mcp-client`
 * bridge — can create, review, and iterate slide decks on disk.
 */
import { existsSync } from 'node:fs'
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { ZodError, z } from 'zod'
import {
  applyOperations,
  createDeckTemplate,
  createSavePlan,
  deckTemplatePresets,
  GITIGNORE_TEMPLATE,
  inspectDeck,
  parseSummaryCards,
  parseTableContent,
  PROJECT_PATHS,
  searchDesignRecipes,
  themePresets,
  validateDeck,
  type DeckDocument,
  type DeckTemplateId,
  type TableStyle,
} from 'plaindeck/core'
import { loadDeck, prepareDocumentAssets, renderPdf, renderPng, saveDeck } from 'plaindeck/node'
import { renderHtml } from 'plaindeck/render'
import packageMetadata from '../package.json' with { type: 'json' }

const json = (value: unknown) => JSON.stringify(value, null, 2)

/** Mirror the `plaindeck init` CLI contract: template defaults, theme default, collision guard, .gitignore. */
async function initProject(projectPath: string, options: { title?: string; id?: string; template?: string; theme?: string }) {
  const template = options.template ?? 'showcase'
  const theme = options.theme ?? (template === 'paper-reading' || template === 'nature-methods' ? 'nature-editorial' : 'studio-cobalt')
  if (!deckTemplatePresets.some(item => item.id === template)) throw new Error(`未知模板 ${template}。可用模板：${deckTemplatePresets.map(item => item.id).join(', ')}`)
  if (!themePresets.some(item => item.id === theme)) throw new Error(`未知主题 ${theme}。可用主题：${themePresets.map(item => item.id).join(', ')}`)
  const document = createDeckTemplate(template as DeckTemplateId, { title: options.title, id: options.id, theme })
  const plannedPaths = [...createSavePlan(document).targets, PROJECT_PATHS.gitignore]
  const collisions: string[] = []
  for (const path of plannedPaths) if (existsSync(join(projectPath, path.replace(/^\.\//, '')))) collisions.push(path)
  if (collisions.length) throw new Error(`目标目录包含将被创建的文件：${collisions.join('、')}。init 已停止，请使用空目录。`)
  const changedPaths = await saveDeck(projectPath, document)
  const ignore = join(projectPath, PROJECT_PATHS.gitignore)
  if (!existsSync(ignore)) {
    await mkdir(projectPath, { recursive: true })
    await writeFile(ignore, GITIGNORE_TEMPLATE, 'utf8')
    changedPaths.push(PROJECT_PATHS.gitignore)
  }
  return { ok: true, project: projectPath, title: document.deck.title, template, theme, slideCount: document.deck.slides.length, changedPaths }
}

async function validateProject(projectPath: string) {
  try {
    const document = await loadDeck(projectPath)
    const result = validateDeck(document)
    return { valid: result.valid, title: document.deck.title, slideCount: document.deck.slides.length, issues: result.issues }
  } catch (error) {
    return {
      valid: false,
      title: null,
      slideCount: null,
      issues: [{ code: 'load_error', path: [] as Array<string | number>, message: error instanceof Error ? error.message : String(error) }],
    }
  }
}

async function inspectProject(projectPath: string) {
  const inspection = inspectDeck(await loadDeck(projectPath))
  return {
    schemaVersion: inspection.schemaVersion,
    id: inspection.id,
    title: inspection.title,
    canvas: inspection.canvas,
    slideCount: inspection.slides.length,
    slides: inspection.slides.map(slide => ({
      index: slide.index,
      path: slide.path,
      id: slide.id,
      name: slide.name,
      layoutRef: slide.layoutRef ?? null,
      elementCount: slide.elementCount,
    })),
  }
}

async function applyOperationsToProject(projectPath: string, operations: unknown[], dryRun: boolean) {
  const document = await loadDeck(projectPath)
  let result: { document: DeckDocument; changedPaths: string[] }
  try {
    result = applyOperations(document, operations)
  } catch (error) {
    if (error instanceof ZodError) {
      const lines = error.issues.map(issue => `${issue.path.join('.') || '(root)'}: ${issue.message}`)
      throw new Error(`操作格式无效：\n${lines.join('\n')}`, { cause: error })
    }
    throw error
  }
  if (!dryRun) await saveDeck(projectPath, result.document, result.changedPaths)
  return { ok: true, dryRun, changedPaths: result.changedPaths, slideCount: result.document.deck.slides.length }
}

async function addCardsSlide(projectPath: string, content: string, style?: string, name?: string, after?: string) {
  const document = await loadDeck(projectPath)
  const parsed = parseSummaryCards(content)
  const result = applyOperations(document, [{ op: 'add-summary-slide', content: parsed, style, name, after }])
  await saveDeck(projectPath, result.document, result.changedPaths)
  const addedPath = result.changedPaths.find(path => path.startsWith(PROJECT_PATHS.slidesDir)) ?? ''
  return { ok: true, slide: addedPath, cards: parsed.cards.length, title: parsed.title, style: style ?? null }
}

async function addTableSlide(projectPath: string, data: string, title?: string, style: TableStyle = 'rules', name?: string, after?: string) {
  const document = await loadDeck(projectPath)
  const parsed = parseTableContent(data)
  const content = title ? { ...parsed, title } : parsed
  const result = applyOperations(document, [{ op: 'add-table-slide', content, style, name, after }])
  await saveDeck(projectPath, result.document, result.changedPaths)
  const addedPath = result.changedPaths.find(path => path.startsWith(PROJECT_PATHS.slidesDir)) ?? ''
  return { ok: true, slide: addedPath, rows: content.rows.length, columns: content.columns.length, title: content.title, style }
}

async function renderProject(projectPath: string, format: 'html' | 'png' | 'pdf', output?: string, slide?: string, allowNetwork = false) {
  const document = await loadDeck(projectPath)
  if (format === 'html') {
    const prepared = await prepareDocumentAssets(document, { projectPath, allowNetwork })
    const html = renderHtml(prepared.document)
    if (!output) return { format, file: null, files: null, written: false, warnings: prepared.warnings, html }
    await mkdir(dirname(output), { recursive: true })
    await writeFile(output, html, 'utf8')
    return { format, file: output, files: [output], written: true, warnings: prepared.warnings }
  }
  if (!output) throw new Error('PNG/PDF 渲染需要指定 output 文件路径（绝对路径）。')
  if (format === 'png') {
    const result = await renderPng(document, { output, projectPath, allowNetwork, slide })
    return { format, file: output, files: result.files, written: true, warnings: result.warnings }
  }
  const result = await renderPdf(document, { output, projectPath, allowNetwork })
  return { format, file: output, files: [result.file], written: true, warnings: result.warnings }
}

async function listStyles(query?: string) {
  const recipes = searchDesignRecipes(query ?? '')
  return {
    count: recipes.length,
    styles: recipes.map(recipe => ({ id: recipe.id, name: recipe.name, category: recipe.category.name, description: recipe.description })),
  }
}

/** Build the PlainDeck MCP server with all tools registered. */
export function createPlainDeckServer(): McpServer {
  const server = new McpServer({ name: 'plaindeck-mcp', version: packageMetadata.version })

  server.registerTool(
    'init',
    {
      title: 'Initialize a new PlainDeck project',
      description: '创建新的 PlainDeck 幻灯片项目：生成 deck.json、theme.json 与 slides/*.json。目标目录必须为空或不存在；模板默认 showcase，主题默认 studio-cobalt（paper-reading/nature-methods 默认 nature-editorial）。所有路径请使用绝对路径。',
      inputSchema: {
        projectPath: z.string().describe('项目目录的绝对路径（不存在则创建；已包含项目文件会报错）'),
        title: z.string().optional().describe('演示文稿标题，例如 "Methods: evidence-led report"'),
        template: z.enum(deckTemplatePresets.map(item => item.id) as [DeckTemplateId, ...DeckTemplateId[]]).optional().describe('页面模板：showcase / pitch / blank / paper-reading / nature-methods'),
        theme: z.string().optional().describe('主题 ID，可用主题见 themePresets（nature-editorial / studio-cobalt / night-citrus / ink-rose / paper-signal / night-blue / field-notes / editorial-blue / poster-red）'),
        id: z.string().optional().describe('项目 ID（默认由标题生成 slug；仅 [a-zA-Z0-9_-]）'),
      },
      outputSchema: z.object({
        ok: z.boolean(),
        project: z.string(),
        title: z.string(),
        template: z.string(),
        theme: z.string(),
        slideCount: z.number(),
        changedPaths: z.array(z.string()),
      }),
      annotations: { destructiveHint: true, openWorldHint: true },
    },
    async ({ projectPath, title, template, theme, id }) => {
      const result = await initProject(projectPath, { title, template, theme, id })
      return { content: [{ type: 'text', text: json(result) }], structuredContent: result }
    },
  )

  server.registerTool(
    'validate',
    {
      title: 'Validate a PlainDeck project',
      description: '校验 PlainDeck 项目格式：读取 deck.json/theme.json/slides 并做 schema 校验。始终返回结构化结果（加载失败也返回 valid:false + load_error），不会抛错。',
      inputSchema: { projectPath: z.string().describe('项目目录的绝对路径') },
      outputSchema: z.object({
        valid: z.boolean(),
        title: z.string().nullable(),
        slideCount: z.number().nullable(),
        issues: z.array(z.object({ code: z.string(), path: z.array(z.union([z.string(), z.number()])), message: z.string() })),
      }),
      annotations: { readOnlyHint: true },
    },
    async ({ projectPath }) => {
      const result = await validateProject(projectPath)
      return { content: [{ type: 'text', text: json(result) }], structuredContent: result }
    },
  )

  server.registerTool(
    'inspect',
    {
      title: 'Inspect a PlainDeck project',
      description: '体检 PlainDeck 项目：返回标题、画布尺寸、每页路径/名称/布局/元素数量。适合在编辑前了解项目结构。',
      inputSchema: { projectPath: z.string().describe('项目目录的绝对路径') },
      outputSchema: z.object({
        schemaVersion: z.string(),
        id: z.string(),
        title: z.string(),
        canvas: z.object({ width: z.number(), height: z.number() }),
        slideCount: z.number(),
        slides: z.array(z.object({
          index: z.number(),
          path: z.string(),
          id: z.string(),
          name: z.string(),
          layoutRef: z.string().nullable(),
          elementCount: z.number(),
        })),
      }),
      annotations: { readOnlyHint: true },
    },
    async ({ projectPath }) => {
      const result = await inspectProject(projectPath)
      return { content: [{ type: 'text', text: json(result) }], structuredContent: result }
    },
  )

  server.registerTool(
    'apply_operations',
    {
      title: 'Apply PlainDeck operations',
      description: '把一组 PlainDeck 操作（operations）应用到项目：set-element / add-element / remove-element / move-element / add-slide / remove-slide / move-slide / duplicate-slide / rename-slide / set-slide-motion / set-footer / set-theme 等。dryRun=true 只预览将变化的文件不写盘。操作格式见 docs/agent-api.md。',
      inputSchema: {
        projectPath: z.string().describe('项目目录的绝对路径'),
        operations: z.array(z.unknown()).describe('DeckOperation 对象数组，例如 [{"op":"rename-slide","slide":"./slides/001-intro.json","name":"新的标题"}]'),
        dryRun: z.boolean().optional().describe('true 时只返回 changedPaths 不写盘'),
      },
      outputSchema: z.object({
        ok: z.boolean(),
        dryRun: z.boolean(),
        changedPaths: z.array(z.string()),
        slideCount: z.number(),
      }),
      annotations: { destructiveHint: true, openWorldHint: true },
    },
    async ({ projectPath, operations, dryRun }) => {
      const result = await applyOperationsToProject(projectPath, operations, dryRun ?? false)
      return { content: [{ type: 'text', text: json(result) }], structuredContent: result }
    },
  )

  server.registerTool(
    'add_cards',
    {
      title: 'Add a structured summary-card slide',
      description: '从结构化 Markdown 或 JSON 生成卡片页（1–8 个自适应要点）。格式：# 主标题，## 要点标题，描述文字，可选 icon_name；也可传 JSON 字符串（SummaryCardContent）。style 为设计配方 ID，可用 styles 工具搜索。',
      inputSchema: {
        projectPath: z.string().describe('项目目录的绝对路径'),
        content: z.string().describe('Markdown 或 JSON 结构化内容（见描述中的格式）'),
        style: z.string().optional().describe('设计配方 ID，例如 claudeStyle；省略则用默认配方'),
        name: z.string().optional().describe('页面名称'),
        after: z.string().optional().describe('插入到哪一页之后（slide 路径）'),
      },
      outputSchema: z.object({
        ok: z.boolean(),
        slide: z.string(),
        cards: z.number(),
        title: z.string(),
        style: z.string().nullable(),
      }),
      annotations: { destructiveHint: true },
    },
    async ({ projectPath, content, style, name, after }) => {
      const result = await addCardsSlide(projectPath, content, style, name, after)
      return { content: [{ type: 'text', text: json(result) }], structuredContent: result }
    },
  )

  server.registerTool(
    'add_table',
    {
      title: 'Add a native table slide',
      description: '从 Markdown / CSV / TSV / JSON 数据生成原生可编辑表格页。第一行为表头；可识别 # 结论式标题、Takeaway:、Source: 行。style：rules / grid / stripes。',
      inputSchema: {
        projectPath: z.string().describe('项目目录的绝对路径'),
        data: z.string().describe('表格数据（Markdown 表格 / CSV / TSV / JSON）'),
        title: z.string().optional().describe('结论式标题（覆盖数据源中的标题）'),
        style: z.enum(['rules', 'grid', 'stripes']).optional().describe('表格样式，默认 rules'),
        name: z.string().optional().describe('页面名称'),
        after: z.string().optional().describe('插入到哪一页之后（slide 路径）'),
      },
      outputSchema: z.object({
        ok: z.boolean(),
        slide: z.string(),
        rows: z.number(),
        columns: z.number(),
        title: z.string(),
        style: z.string(),
      }),
      annotations: { destructiveHint: true },
    },
    async ({ projectPath, data, title, style, name, after }) => {
      const result = await addTableSlide(projectPath, data, title, style, name, after)
      return { content: [{ type: 'text', text: json(result) }], structuredContent: result }
    },
  )

  server.registerTool(
    'render',
    {
      title: 'Render a PlainDeck project',
      description: '渲染项目：html 返回独立可分享的播放器页面（未指定 output 时直接在结果中返回 HTML 文本）；png/pdf 需指定 output 并安装 Playwright Chromium（npm install playwright && npx playwright install chromium）。默认阻止外部图片（allowNetwork=true 放行）。',
      inputSchema: {
        projectPath: z.string().describe('项目目录的绝对路径'),
        format: z.enum(['html', 'png', 'pdf']),
        output: z.string().optional().describe('输出文件绝对路径；html 省略时直接在结果中返回 HTML'),
        slide: z.string().optional().describe('png 可指定渲染某一页（序号或 slide 路径），省略则渲染全部'),
        allowNetwork: z.boolean().optional().describe('是否允许加载外部图片，默认 false'),
      },
      outputSchema: z.object({
        format: z.string(),
        file: z.string().nullable(),
        files: z.array(z.string()).nullable(),
        written: z.boolean(),
        warnings: z.array(z.string()),
        html: z.string().nullable(),
      }),
      annotations: { openWorldHint: true },
    },
    async ({ projectPath, format, output, slide, allowNetwork }) => {
      const result = await renderProject(projectPath, format, output, slide, allowNetwork)
      const structured = { format: result.format, file: result.file, files: result.files, written: result.written, warnings: result.warnings, html: result.html ?? null }
      if (result.html !== undefined) {
        return { content: [{ type: 'text', text: result.html }], structuredContent: structured }
      }
      return { content: [{ type: 'text', text: json(structured) }], structuredContent: structured }
    },
  )

  server.registerTool(
    'styles',
    {
      title: 'Search PlainDeck visual recipes',
      description: '搜索可用的卡片页设计配方（174 个），用于 add_cards 的 style 参数。query 匹配 ID/名称/描述/分类/变体。',
      inputSchema: { query: z.string().optional().describe('搜索词，例如 "nature" 或 "minimal"；省略返回全部') },
      outputSchema: z.object({
        count: z.number(),
        styles: z.array(z.object({ id: z.string(), name: z.string(), category: z.string(), description: z.string() })),
      }),
      annotations: { readOnlyHint: true },
    },
    async ({ query }) => {
      const result = await listStyles(query)
      return { content: [{ type: 'text', text: json(result) }], structuredContent: result }
    },
  )

  return server
}

/** Connect the server to stdio — used by the `plaindeck-mcp` binary. */
export async function runStdioServer(): Promise<void> {
  const { StdioServerTransport } = await import('@modelcontextprotocol/sdk/server/stdio.js')
  const server = createPlainDeckServer()
  await server.connect(new StdioServerTransport())
}
