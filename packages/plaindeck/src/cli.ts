#!/usr/bin/env node
import { access, mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { stdin, stderr, stdout } from 'node:process'
import { applyOperations, createDeckTemplate, createSavePlan, deckTemplatePresets, designRecipes, inspectDeck, layoutPresets, parseSummaryCards, searchDesignRecipes, themePresets, validateDeck, type DeckTemplateId } from './core/index.js'
import { loadDeck, prepareDocumentAssets, renderPdf, renderPng, saveDeck } from './node/index.js'
import { renderHtml } from './render/index.js'
import packageMetadata from '../package.json' with { type: 'json' }

const VERSION = packageMetadata.version
const args = process.argv.slice(2)
const command = args[0]
const jsonMode = args.includes('--json')

const help = `PlainDeck ${VERSION}

Usage:
  plaindeck init <project> [--title <title>] [--template showcase|pitch|blank] [--theme <id>] [--json]
  plaindeck validate <project> [--json]
  plaindeck inspect <project> [--json]
  plaindeck apply <project> --ops <file|-> [--dry-run] [--json]
  plaindeck add-slide <project> --layout <id> [--name <name>] [--json]
  plaindeck add-cards <project> --content <file|-> [--style <id>] [--name <name>] [--after <slide-path>] [--json]
  plaindeck styles [--search <query>] [--json]
  plaindeck render <project> --format html|png|pdf --output <path> [--slide <index|path>] [--allow-network] [--json]
`

function option(name: string) {
  const index = args.indexOf(name)
  return index >= 0 ? args[index + 1] : undefined
}

function requiredOption(name: string) {
  const value = option(name)
  if (!value || value.startsWith('--')) throw new UsageError(`缺少参数 ${name}`)
  return value
}

function projectPath() {
  const value = args[1]
  if (!value || value.startsWith('--')) throw new UsageError('缺少 PlainDeck 项目目录。')
  return value
}

class UsageError extends Error {}

async function readStdin() {
  const chunks: Buffer[] = []
  for await (const chunk of stdin) chunks.push(Buffer.from(chunk))
  return Buffer.concat(chunks).toString('utf8')
}

async function exists(path: string) {
  try { await access(path); return true } catch { return false }
}

function emit(data: unknown, human: string) {
  stdout.write(jsonMode ? `${JSON.stringify(data, null, 2)}\n` : `${human}\n`)
}

async function run() {
  if (!command || command === '--help' || command === '-h' || command === 'help') {
    stdout.write(help)
    return
  }
  if (command === '--version' || command === '-v') {
    stdout.write(`${VERSION}\n`)
    return
  }
  if (command === 'styles') {
    const recipes = searchDesignRecipes(option('--search'))
    emit({ ok: true, count: recipes.length, styles: recipes.map(recipe => ({ id: recipe.id, name: recipe.name, category: recipe.category, description: recipe.description, variant: recipe.card.variant, colors: recipe.theme.colors })) }, recipes.length ? recipes.map(recipe => `${recipe.id.padEnd(28)} ${recipe.name} · ${recipe.category.name}`).join('\n') : '没有匹配的设计配方。')
    return
  }
  if (command === 'init') {
    const root = projectPath()
    const template = option('--template') ?? 'showcase'
    const theme = option('--theme') ?? (template === 'paper-reading' ? 'night-citrus' : 'studio-cobalt')
    if (!deckTemplatePresets.some(item => item.id === template)) throw new UsageError(`未知模板 ${template}。可用模板：${deckTemplatePresets.map(item => item.id).join(', ')}`)
    if (!themePresets.some(item => item.id === theme)) throw new UsageError(`未知主题 ${theme}。可用主题：${themePresets.map(item => item.id).join(', ')}`)
    const document = createDeckTemplate(template as DeckTemplateId, { title: option('--title'), id: option('--id'), theme })
    const plannedPaths = [...createSavePlan(document).targets, '.gitignore']
    const collisions: string[] = []
    for (const path of plannedPaths) if (await exists(join(root, path.replace(/^\.\//, '')))) collisions.push(path)
    if (collisions.length) throw new UsageError(`目标目录包含将被创建的文件：${collisions.join('、')}。init 已停止，请使用空目录。`)
    const changedPaths = await saveDeck(root, document)
    const ignore = join(root, '.gitignore')
    if (!await exists(ignore)) {
      await mkdir(root, { recursive: true })
      await writeFile(ignore, 'exports/*\n.DS_Store\n', 'utf8')
      changedPaths.push('.gitignore')
    }
    emit({ ok: true, project: root, title: document.deck.title, template, theme, slides: document.deck.slides.length, changedPaths }, `✓ 已创建 ${document.deck.title} · ${document.deck.slides.length} 页 · ${template} / ${theme}`)
    return
  }
  if (command === 'validate') {
    const document = await loadDeck(projectPath())
    const result = validateDeck(document)
    emit({ ok: result.valid, issues: result.issues }, result.valid ? `✓ ${document.deck.title}：${document.deck.slides.length} 页，格式有效` : `✗ 发现 ${result.issues.length} 个问题`)
    if (!result.valid) process.exitCode = 1
    return
  }
  if (command === 'inspect') {
    const inspection = inspectDeck(await loadDeck(projectPath()))
    emit(inspection, `${inspection.title} · ${inspection.slides.length} 页 · ${inspection.canvas.width}×${inspection.canvas.height}`)
    return
  }
  if (command === 'apply') {
    const root = projectPath()
    const source = requiredOption('--ops')
    const raw = source === '-' ? await readStdin() : await readFile(source, 'utf8')
    const operations = JSON.parse(raw) as unknown
    const result = applyOperations(await loadDeck(root), operations)
    const dryRun = args.includes('--dry-run')
    if (!dryRun) await saveDeck(root, result.document, result.changedPaths)
    emit({ ok: true, dryRun, changedPaths: result.changedPaths, validation: { valid: true, issues: [] } }, `${dryRun ? 'DRY RUN · ' : ''}${result.changedPaths.length} 个文件将发生变化${dryRun ? '' : '，已保存'}`)
    return
  }
  if (command === 'add-slide') {
    const root = projectPath()
    const layout = requiredOption('--layout')
    if (!layoutPresets.some(preset => preset.id === layout)) throw new UsageError(`未知布局 ${layout}。可用布局：${layoutPresets.map(preset => preset.id).join(', ')}`)
    const result = applyOperations(await loadDeck(root), [{ op: 'add-slide', layout, name: option('--name') }])
    await saveDeck(root, result.document, result.changedPaths)
    const addedPath = result.changedPaths.find(path => path.startsWith('./slides/'))
    emit({ ok: true, changedPaths: result.changedPaths, slide: addedPath }, `✓ 已添加页面 ${addedPath}`)
    return
  }
  if (command === 'add-cards') {
    const root = projectPath()
    const source = requiredOption('--content')
    const raw = source === '-' ? await readStdin() : await readFile(source, 'utf8')
    const content = parseSummaryCards(raw)
    const style = option('--style')
    if (style && !designRecipes.some(recipe => recipe.id === style)) throw new UsageError(`未知设计配方 ${style}。运行 plaindeck styles --search <query> 查找。`)
    const result = applyOperations(await loadDeck(root), [{ op: 'add-summary-slide', content, style, name: option('--name'), after: option('--after') }])
    await saveDeck(root, result.document, result.changedPaths)
    const addedPath = result.changedPaths.find(path => path.startsWith('./slides/'))
    emit({ ok: true, changedPaths: result.changedPaths, slide: addedPath, cards: content.cards.length, style: style ?? null }, `✓ 已添加结构化卡片页 ${addedPath} · ${content.cards.length} 个要点${style ? ` · ${style}` : ''}`)
    return
  }
  if (command === 'render') {
    const root = projectPath()
    const format = requiredOption('--format')
    const output = requiredOption('--output')
    const allowNetwork = args.includes('--allow-network')
    const document = await loadDeck(root)
    if (format === 'html') {
      const prepared = await prepareDocumentAssets(document, { projectPath: root, allowNetwork })
      await mkdir(dirname(output), { recursive: true })
      await writeFile(output, renderHtml(prepared.document), 'utf8')
      emit({ ok: true, format, files: [output], warnings: prepared.warnings }, `✓ HTML 已输出到 ${output}${prepared.warnings.length ? ` · ${prepared.warnings.length} 条资源警告` : ''}`)
      return
    }
    if (format === 'png') {
      const selector = option('--slide')
      const result = await renderPng(document, { output, projectPath: root, allowNetwork, slide: selector })
      emit({ ok: true, format, files: result.files, warnings: result.warnings }, `✓ 已生成 ${result.files.length} 张 PNG${result.warnings.length ? ` · ${result.warnings.length} 条资源警告` : ''}`)
      return
    }
    if (format === 'pdf') {
      const result = await renderPdf(document, { output, projectPath: root, allowNetwork })
      emit({ ok: true, format, files: [result.file], warnings: result.warnings }, `✓ PDF 已输出到 ${result.file}${result.warnings.length ? ` · ${result.warnings.length} 条资源警告` : ''}`)
      return
    }
    throw new UsageError(`未知格式：${format}`)
  }
  throw new UsageError(`未知命令：${command}`)
}

run().catch(error => {
  const message = error instanceof Error ? error.message : String(error)
  if (jsonMode) stdout.write(`${JSON.stringify({ ok: false, error: { message, type: error instanceof UsageError ? 'usage' : 'runtime' } }, null, 2)}\n`)
  else stderr.write(`PlainDeck：${message}\n`)
  process.exitCode = error instanceof UsageError ? 2 : 1
})
