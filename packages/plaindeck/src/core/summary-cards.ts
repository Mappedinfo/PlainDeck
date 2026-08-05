import { z } from 'zod'
import type { SlideElement, Theme } from './schema.js'

export const SummaryCardSchema = z.object({
  title: z.string().trim().min(1).max(40),
  description: z.string().trim().min(1).max(320),
  icon: z.string().trim().min(1).max(80).optional(),
}).strict()

export const SummaryCardContentSchema = z.object({
  title: z.string().trim().min(1).max(120),
  cards: z.array(SummaryCardSchema).min(1).max(8),
}).strict()

export type SummaryCard = z.infer<typeof SummaryCardSchema>
export type SummaryCardContent = z.infer<typeof SummaryCardContentSchema>

const iconPattern = /^[a-z][a-z0-9_,\-]{0,79}$/i

function stripFence(input: string) {
  const trimmed = input.trim()
  if (!trimmed.startsWith('```')) return trimmed
  const lines = trimmed.split('\n')
  if (lines.length < 3 || lines.at(-1)?.trim() !== '```') return trimmed
  return lines.slice(1, -1).join('\n').trim()
}

function plainText(input: string) {
  return input
    .replaceAll(/<\s*br\s*\/?\s*>/gi, '\n')
    .replaceAll(/<[^>]+>/g, '')
    .replaceAll(/\*\*(.*?)\*\*/g, '$1')
    .replaceAll(/__(.*?)__/g, '$1')
    .replaceAll(/`([^`]+)`/g, '$1')
    .replaceAll(/\s+/g, ' ')
    .trim()
}

export function parseSummaryCards(input: string): SummaryCardContent {
  const cleaned = stripFence(input).replaceAll(/\r\n?/g, '\n').trim()
  if (!cleaned) throw new Error('卡片内容为空。')

  if (cleaned.startsWith('{')) {
    let value: unknown
    try { value = JSON.parse(cleaned) } catch { throw new Error('卡片 JSON 无法解析。') }
    if (!value || typeof value !== 'object') throw new Error('卡片 JSON 必须是对象。')
    const raw = value as { title?: unknown; mainTitle?: unknown; cards?: unknown }
    const normalized = {
      title: typeof raw.title === 'string' ? raw.title : raw.mainTitle,
      cards: Array.isArray(raw.cards) ? raw.cards.map(card => {
        const item = card as { title?: unknown; description?: unknown; desc?: unknown; icon?: unknown }
        return {
          title: item.title,
          description: typeof item.description === 'string' ? plainText(item.description) : typeof item.desc === 'string' ? plainText(item.desc) : item.description,
          ...(typeof item.icon === 'string' && iconPattern.test(item.icon) ? { icon: item.icon } : {}),
        }
      }) : raw.cards,
    }
    return SummaryCardContentSchema.parse(normalized)
  }

  const lines = cleaned.split('\n')
  let title = ''
  const cards: SummaryCard[] = []
  let cardTitle = ''
  let body: string[] = []
  const push = () => {
    if (!cardTitle) return
    const compact = body.map(line => line.trim()).filter(Boolean)
    const candidate = compact.at(-1)
    const icon = compact.length > 1 && candidate && iconPattern.test(candidate) ? candidate : undefined
    const description = plainText((icon ? compact.slice(0, -1) : compact).join(' '))
    if (description) cards.push({ title: plainText(cardTitle), description, ...(icon ? { icon } : {}) })
  }
  for (const rawLine of lines) {
    const line = rawLine.trim()
    if (line.startsWith('# ') && !line.startsWith('## ')) { if (!title) title = plainText(line.slice(2)); continue }
    if (line.startsWith('## ')) { push(); cardTitle = line.slice(3); body = []; continue }
    if (cardTitle && line) body.push(line)
  }
  push()
  return SummaryCardContentSchema.parse({ title, cards })
}

export function summaryCardsToMarkdown(content: SummaryCardContent) {
  const valid = SummaryCardContentSchema.parse(content)
  return `# ${valid.title}\n\n${valid.cards.map(card => `## ${card.title}\n${card.description}${card.icon ? `\n${card.icon}` : ''}`).join('\n\n')}`
}

const frame = (x: number, y: number, w: number, h: number) => ({ x: Math.round(x), y: Math.round(y), w: Math.round(w), h: Math.round(h) })

export function createSummaryCardElements(content: SummaryCardContent, theme: Theme, canvas = { width: 1600, height: 900 }): SlideElement[] {
  const valid = SummaryCardContentSchema.parse(content)
  const { width, height } = canvas
  const marginX = Math.round(width * .05); const top = Math.round(height * .06)
  const contentWidth = width - marginX * 2
  const cardsTop = Math.round(height * .275); const cardsBottom = Math.round(height * .885)
  const count = valid.cards.length
  const columns = count === 1 ? 1 : count === 2 ? 2 : count === 3 ? 3 : count === 4 ? 2 : count <= 6 ? 3 : 4
  const rows = Math.ceil(count / columns); const gap = Math.round(width * .015)
  const cardWidth = (contentWidth - gap * (columns - 1)) / columns
  const cardHeight = (cardsBottom - cardsTop - gap * (rows - 1)) / rows
  const compact = count >= 5
  const titleSize = compact ? 27 : count >= 3 ? 31 : 36
  const bodySize = compact ? 19 : count >= 3 ? 22 : 26
  const elements: SlideElement[] = [
    { id: 'summary-kicker', type: 'text', frame: frame(marginX, top, contentWidth, 34), text: 'BRIEF / STRUCTURED SUMMARY', fontSize: 17, fontWeight: 800, color: theme.colors.accent },
    { id: 'summary-title', type: 'text', styleRef: 'slide-title', frame: frame(marginX, top + 50, contentWidth, 105), text: valid.title, fontSize: 58, fontWeight: 800, color: theme.colors.text, fit: 'shrink' },
  ]

  valid.cards.forEach((card, index) => {
    const row = Math.floor(index / columns); const column = index % columns
    const x = marginX + column * (cardWidth + gap); const y = cardsTop + row * (cardHeight + gap)
    const primary = index === 0
    const fill = primary ? theme.colors.accent : theme.colors.background
    const foreground = primary ? theme.colors.background : theme.colors.text
    const muted = primary ? theme.colors.background : theme.colors.muted
    elements.push(
      { id: `summary-card-${index + 1}`, type: 'shape', frame: frame(x, y, cardWidth, cardHeight), shape: 'rounded-rectangle', fill, stroke: primary ? undefined : theme.colors.muted, strokeWidth: primary ? 0 : 2, radius: 22 },
      { id: `summary-card-${index + 1}-index`, type: 'text', frame: frame(x + 26, y + 22, cardWidth - 52, 28), text: `${String(index + 1).padStart(2, '0')}${card.icon ? ` / ${card.icon.replaceAll('_', ' ').toUpperCase()}` : ''}`, fontSize: compact ? 13 : 15, fontWeight: 800, color: primary ? foreground : theme.colors.accent, fit: 'shrink' },
      { id: `summary-card-${index + 1}-title`, type: 'text', frame: frame(x + 26, y + 65, cardWidth - 52, compact ? 54 : 62), text: card.title, fontSize: titleSize, fontWeight: 800, color: foreground, fit: 'shrink' },
      { id: `summary-card-${index + 1}-body`, type: 'text', frame: frame(x + 26, y + (compact ? 124 : 138), cardWidth - 52, cardHeight - (compact ? 146 : 164)), text: card.description, fontSize: bodySize, fontWeight: 500, color: muted, fit: 'shrink' },
    )
  })
  return elements
}

export const exampleSummaryCards = `# 生成式 AI 正在改变什么

## 内容生成
模型可以根据指令生成文字、图像、音频与代码，把创作起点从空白页变成可编辑的初稿。
auto_awesome

## 工作方式
人负责目标、判断与取舍，AI 负责搜索、组合和快速试错；高质量结果依然需要验证。
handshake

## 核心限制
模型可能产生事实错误、偏见或版权风险，重要内容必须保留来源、复核与责任边界。
verified

## 实用原则
从明确任务开始，提供上下文与评价标准，小步迭代，并把最终决定留给人。
route`
