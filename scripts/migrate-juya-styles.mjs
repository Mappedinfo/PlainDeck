#!/usr/bin/env node
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { readFile, writeFile } from 'node:fs/promises'
import { basename, join, resolve } from 'node:path'
import { argv, exit } from 'node:process'

const option = name => {
  const index = argv.indexOf(name)
  return index >= 0 ? argv[index + 1] : undefined
}

const sourceRoot = resolve(option('--source') ?? '../juya-news-card')
const outputPath = resolve(option('--output') ?? 'packages/plaindeck/src/core/generated/juya-design-recipes.json')
const check = argv.includes('--check')

const normalizeHex = value => {
  const raw = value.toLowerCase()
  if (/^#[\da-f]{3}$/.test(raw)) return `#${[...raw.slice(1)].map(char => char + char).join('')}`
  if (/^#[\da-f]{4}$/.test(raw)) return `#${[...raw.slice(1, 4)].map(char => char + char).join('')}`
  if (/^#[\da-f]{8}$/.test(raw)) return raw.slice(0, 7)
  return raw
}

const rgb = value => {
  const hex = normalizeHex(value).slice(1)
  return [0, 2, 4].map(index => Number.parseInt(hex.slice(index, index + 2), 16))
}

const luminance = value => {
  const channels = rgb(value).map(channel => {
    const n = channel / 255
    return n <= .03928 ? n / 12.92 : ((n + .055) / 1.055) ** 2.4
  })
  return channels[0] * .2126 + channels[1] * .7152 + channels[2] * .0722
}

const contrast = (a, b) => {
  const [bright, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (bright + .05) / (dark + .05)
}

const saturation = value => {
  const channels = rgb(value).map(channel => channel / 255)
  const max = Math.max(...channels); const min = Math.min(...channels)
  return max === min ? 0 : (max - min) / (1 - Math.abs(max + min - 1))
}

const mix = (a, b, amount) => `#${rgb(a).map((value, index) => Math.round(value * (1 - amount) + rgb(b)[index] * amount).toString(16).padStart(2, '0')).join('')}`

function parseCategories(source) {
  const byId = new Map()
  for (const match of source.matchAll(/\{ id: '([^']+)', name: '([^']+)', icon: '[^']+', themeIds: \[([^\]]*)\] \}/g)) {
    for (const id of [...match[3].matchAll(/'([^']+)'/g)].map(item => item[1])) byId.set(id, { id: match[1], name: match[2] })
  }
  return byId
}

function extractColors(source) {
  const counts = new Map()
  for (const match of source.matchAll(/#[\da-fA-F]{3,8}\b/g)) {
    const color = normalizeHex(match[0])
    if (/^#[\da-f]{6}$/.test(color)) counts.set(color, (counts.get(color) ?? 0) + 1)
  }
  return [...counts].sort((a, b) => b[1] - a[1]).map(([color]) => color)
}

function likelyBackground(id, description, source, colors) {
  const main = /\.main-container\s*\{[^}]*?background(?:-color)?\s*:\s*(#[\da-fA-F]{3,8})/s.exec(source)?.[1]
  if (main) return normalizeHex(main)
  const inline = /(?:backgroundColor|background)\s*:\s*['"`](#[\da-fA-F]{3,8})/.exec(source)?.[1]
  if (inline) return normalizeHex(inline)
  const dark = /terminal|synth|vapor|hud|holo|cinematic|black|night|dark|ink|woodcut|etching|led|pixel|heavy|数字高光|电影|水墨|木刻|蚀刻|霓虹/i.test(`${id} ${description}`)
  const ranked = [...colors].sort((a, b) => luminance(a) - luminance(b))
  return (dark ? ranked[0] : ranked.at(-1)) ?? (dark ? '#101214' : '#f5f1e8')
}

function palette(id, description, source) {
  const colors = extractColors(source)
  const background = likelyBackground(id, description, source, colors)
  const bestText = [...colors].filter(color => color !== background).sort((a, b) => contrast(b, background) - contrast(a, background))[0]
  const text = bestText && contrast(bestText, background) >= 4.5 ? bestText : (luminance(background) > .42 ? '#161616' : '#f7f4ec')
  const candidates = colors.filter(color => color !== background && color !== text && contrast(color, background) >= 1.7)
  const accent = candidates.sort((a, b) => saturation(b) * contrast(b, background) - saturation(a) * contrast(a, background))[0]
    ?? (luminance(background) > .42 ? '#d94b36' : '#d8ff52')
  const mutedCandidate = colors.filter(color => ![background, text, accent].includes(color) && contrast(color, background) >= 2.2).sort((a, b) => Math.abs(contrast(a, background) - 4) - Math.abs(contrast(b, background) - 4))[0]
  const muted = mutedCandidate ?? mix(background, text, .58)
  return { background, text, muted, accent }
}

function fontStack(source, variant) {
  const candidates = [...source.matchAll(/font(?:-family|Family)\s*[:=]\s*[`'"]([^`'";}]+)/g)]
    .map(match => match[1].trim().replace(/^['"]|['"]$/g, ''))
    .filter(value => !/CustomPreviewFont|Material Symbols|system-ui|-apple-system/i.test(value))
  const picked = candidates.find(value => value.length < 50)?.split(',')[0].trim().replace(/^['"]|['"]$/g, '')
  if (variant === 'terminal' || /Mono|Code|Pixel/i.test(picked ?? '')) return { title: `${picked ?? 'SFMono-Regular'}, IBM Plex Mono, Consolas, monospace`, body: 'SFMono-Regular, IBM Plex Mono, Consolas, monospace', mono: 'SFMono-Regular, Consolas, monospace' }
  if (/Serif|Lora|Playfair|Georgia|Song|Ming|宋/i.test(picked ?? '')) return { title: `${picked ?? 'Noto Serif SC'}, Georgia, serif`, body: 'Noto Serif SC, Georgia, serif', mono: 'SFMono-Regular, Consolas, monospace' }
  return { title: `${picked ?? 'Avenir Next'}, Aptos Display, Helvetica Neue, sans-serif`, body: 'Avenir Next, Aptos, Helvetica Neue, sans-serif', mono: 'SFMono-Regular, Consolas, monospace' }
}

function variantFor(id, name, description, category) {
  const value = `${id} ${name} ${description} ${category}`
  if (/terminal|cli|led|pixel|workbench|windows|desktop|system7|beos|palm|os2|cde|retro|复古|桌面|像素/i.test(value)) return 'terminal'
  if (/brutal|punk|bauhaus|memphis|poster|explosion|粗野|包豪斯|孟菲斯|爆发/i.test(value)) return 'brutal'
  if (/glass|aero|aurora|holographic|liquid|glow|blur|玻璃|极光|流体|高光/i.test(value)) return 'glass'
  if (/editorial|magazine|serif|type|gridPoster|blackWhite|luxury|社论|杂志|排版|字体|奢华/i.test(value)) return 'editorial'
  if (/kawaii|chibi|cute|cartoon|disney|ghibli|clay|sticker|萌|卡通|动画|黏土/i.test(value)) return 'playful'
  if (/ink|landscape|flower|wabi|japandi|biophilic|watercolor|sumi|rinpa|ukiyo|gongbi|baimiao|xieyi|mogu|自然|山水|花鸟|水彩|水墨|侘寂|白描|工笔/i.test(value)) return 'organic'
  if (/sciFi|future|parametric|spatial|xr|material3|未来|参数化|扩展现实/i.test(value)) return 'future'
  if (/art|painting|comic|collage|risograph|wood|etch|print|cubism|surreal|fauvism|expression|艺术|绘画|漫画|拼贴|版画|立体|超现实|野兽|表现主义/i.test(value)) return 'art'
  if (/minimal|apple|braun|muji|calm|whitespace|极简|克制|平静|无印/i.test(value)) return 'minimal'
  return 'product'
}

function cardConfig(variant) {
  return {
    minimal: { variant, radius: 2, borderWidth: 1, gapScale: 1.35 },
    editorial: { variant, radius: 0, borderWidth: 1, gapScale: 1.15 },
    brutal: { variant, radius: 0, borderWidth: 4, gapScale: 1 },
    glass: { variant, radius: 34, borderWidth: 1, gapScale: 1 },
    terminal: { variant, radius: 0, borderWidth: 2, gapScale: .8 },
    future: { variant, radius: 8, borderWidth: 2, gapScale: .9 },
    playful: { variant, radius: 38, borderWidth: 2, gapScale: 1.05 },
    organic: { variant, radius: 28, borderWidth: 1, gapScale: 1.15 },
    art: { variant, radius: 6, borderWidth: 2, gapScale: .95 },
    product: { variant, radius: 18, borderWidth: 1, gapScale: 1 },
  }[variant]
}

const metaRaw = JSON.parse(await readFile(join(sourceRoot, 'src/templates/meta.json'), 'utf8'))
const categoryById = parseCategories(await readFile(join(sourceRoot, 'src/templates/catalog.ts'), 'utf8'))
const templates = Object.entries(metaRaw.templates)
if (templates.length !== 174 || categoryById.size !== 174) throw new Error(`期待 174 个模板，实际 meta=${templates.length} catalog=${categoryById.size}`)

const recipes = []
for (const [id, meta] of templates) {
  const source = await readFile(join(sourceRoot, meta.filePath), 'utf8')
  const category = categoryById.get(id)
  if (!category) throw new Error(`模板 ${id} 缺少分类。`)
  const description = meta.description?.trim() || `${meta.name}视觉风格`
  const variant = variantFor(id, meta.name, description, category.name)
  const colors = palette(id, description, source)
  recipes.push({
    id,
    name: meta.name,
    description,
    category,
    icon: meta.icon || 'style',
    source: { file: meta.filePath, sha256: createHash('sha256').update(source).digest('hex') },
    theme: {
      fonts: fontStack(source, variant),
      fontSizes: { title: variant === 'editorial' ? 82 : 72, heading: 44, body: 26, caption: 17 },
      colors,
      spacing: { page: 80, small: 14, medium: 28, large: 58 },
    },
    card: cardConfig(variant),
  })
}

const commit = execFileSync('git', ['-C', sourceRoot, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim()
const output = `${JSON.stringify({
  schemaVersion: '1',
  source: { repository: 'https://github.com/Mappedinfo/juya-news-card', commit, templateCount: recipes.length },
  recipes,
}, null, 2)}\n`

if (check) {
  const current = await readFile(outputPath, 'utf8').catch(() => '')
  if (current !== output) { console.error(`${basename(outputPath)} 不是最新生成结果。`); exit(1) }
  console.log(`✓ ${recipes.length} 个设计配方与 ${commit.slice(0, 7)} 同步`)
} else {
  await writeFile(outputPath, output, 'utf8')
  console.log(`✓ 从 ${commit.slice(0, 7)} 生成 ${recipes.length} 个 PlainDeck 设计配方 → ${outputPath}`)
}
