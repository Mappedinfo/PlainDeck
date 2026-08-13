import { assertDocument, type DeckDocument, type Slide, type SlideElement, type Theme } from './schema.js'
import { createLayoutElements, getThemePreset, type LayoutPresetId } from './presets.js'

export type DeckTemplateId = 'showcase' | 'pitch' | 'blank' | 'paper-reading' | 'nature-methods'

export interface DeckTemplatePreset {
  id: DeckTemplateId
  name: string
  description: string
  slideCount: number
}

export interface CreateDeckTemplateOptions {
  title?: string
  id?: string
  theme?: string | Theme
}

export const deckTemplatePresets: DeckTemplatePreset[] = [
  { id: 'showcase', name: 'Editorial showcase', description: '五页叙事骨架，适合介绍、报告与作品展示', slideCount: 5 },
  { id: 'pitch', name: 'Focused pitch', description: '问题、方案、证据与行动的五页提案', slideCount: 5 },
  { id: 'blank', name: 'Minimal start', description: '只有一张精心排版的封面', slideCount: 1 },
  { id: 'paper-reading', name: 'Paper reading', description: '论文解读八页：问题、贡献、证据、对比、局限与 takeaway', slideCount: 8 },
  { id: 'nature-methods', name: 'Nature methods', description: '证据优先的方法汇报：问题、流程、图表、边界与结论', slideCount: 7 },
]

const frame = (x: number, y: number, w: number, h: number) => ({ x, y, w, h })
const text = (id: string, value: string, x: number, y: number, w: number, h: number, options: Partial<Extract<SlideElement, { type: 'text' }>> = {}): SlideElement => ({ id, type: 'text', frame: frame(x, y, w, h), text: value, ...options })
const shape = (id: string, x: number, y: number, w: number, h: number, fill: string, options: Partial<Extract<SlideElement, { type: 'shape' }>> = {}): SlideElement => ({ id, type: 'shape', frame: frame(x, y, w, h), shape: 'rectangle', fill, ...options })

function slug(value: string) {
  const normalized = value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  return normalized || 'plaindeck-project'
}

function copyFor(template: 'showcase' | 'pitch', title: string) {
  if (template === 'pitch') return {
    coverKicker: 'FOCUSED PITCH / FIVE SLIDES', coverTitle: title, coverSubtitle: '把问题、方案与下一步压缩成一条清晰的决策路径。',
    thesisKicker: '01 / THE PROBLEM', thesis: '先描述一个真实、具体、值得解决的问题。', thesisNote: '谁在何时遇到它？现有方案为什么仍然不够？',
    pillarsTitle: '方案必须同时回答三件事', cards: [['01', '价值\n解决什么'], ['02', '机制\n如何做到'], ['03', '差异\n为何是你']],
    evidenceTitle: '用一个证据降低不确定性', evidenceBody: '替换左侧图片或图表，并在这里解释：它验证了什么、还没有验证什么。', metric: '3×', metricLabel: '可验证的改进',
    closeTitle: '明确说出你希望观众做什么。', closeBody: '下一步 · 负责人 · 时间点',
  }
  return {
    coverKicker: 'EDITORIAL SHOWCASE / PLAINDECK', coverTitle: title, coverSubtitle: '一套为人阅读、为 Agent 编辑、为 Web 播放而设计的开放幻灯片。',
    thesisKicker: '01 / POINT OF VIEW', thesis: '每一页只负责一个值得记住的观点。', thesisNote: '标题给结论，正文给证据；把装饰留给真正需要强调的地方。',
    pillarsTitle: '让叙事拥有清楚的骨架', cards: [['01', '观点\n先说结论'], ['02', '证据\n建立可信度'], ['03', '行动\n给出下一步']],
    evidenceTitle: '让视觉承担一半表达', evidenceBody: '使用本地图片、图表或研究结果。导出 HTML 时可嵌入资源，分享一个真正独立的文件。', metric: '1:1', metricLabel: '内容与视觉同等重要',
    closeTitle: '结束在决定，而不是总结。', closeBody: '打开编辑器 · 替换内容 · 讲出你的版本',
  }
}

function storySlides(template: 'showcase' | 'pitch', theme: Theme, title: string): Record<string, Slide> {
  const c = theme.colors; const copy = copyFor(template, title)
  return {
    './slides/001-cover.json': { id: 'cover', name: 'Cover', layoutRef: 'showcase-cover', background: { color: c.background }, elements: [
      shape('accent-panel', 0, 0, 420, 900, c.accent),
      text('panel-mark', 'PLAIN\nDECK', 62, 76, 300, 170, { fontSize: 62, fontWeight: 800, color: c.background }),
      text('panel-index', '01 — 05', 62, 756, 280, 50, { fontSize: 20, fontWeight: 700, color: c.background }),
      text('kicker', copy.coverKicker, 510, 78, 880, 42, { fontSize: 18, fontWeight: 800, color: c.accent }),
      text('title', copy.coverTitle, 510, 188, 980, 260, { styleRef: 'slide-title', fontSize: 84, fontWeight: 800, color: c.text }),
      shape('rule', 510, 530, 980, 4, c.text),
      text('subtitle', copy.coverSubtitle, 510, 588, 890, 130, { fontSize: 30, fontWeight: 500, color: c.muted }),
      text('hint', 'ARROWS TO NAVIGATE · F FOR FULLSCREEN', 510, 790, 900, 34, { fontSize: 16, fontWeight: 700, color: c.muted }),
    ] },
    './slides/002-thesis.json': { id: 'thesis', name: 'Core idea', layoutRef: 'statement', background: { color: c.background }, elements: [
      text('kicker', copy.thesisKicker, 88, 72, 720, 40, { fontSize: 18, fontWeight: 800, color: c.accent }),
      text('index', '01', 1260, 46, 252, 150, { fontSize: 112, fontWeight: 800, align: 'right', color: c.accent }),
      text('statement', copy.thesis, 88, 230, 1240, 275, { styleRef: 'slide-title', fontSize: 76, fontWeight: 800, color: c.text }),
      shape('rule', 88, 622, 1424, 3, c.text),
      text('context', copy.thesisNote, 88, 682, 1180, 90, { fontSize: 28, fontWeight: 500, color: c.muted }),
    ] },
    './slides/003-structure.json': { id: 'structure', name: 'Structure', layoutRef: 'three-cards', background: { color: c.background }, elements: [
      text('kicker', '02 / STRUCTURE', 80, 64, 600, 36, { fontSize: 18, fontWeight: 800, color: c.accent }),
      text('title', copy.pillarsTitle, 80, 122, 1200, 95, { styleRef: 'slide-title', fontSize: 60, fontWeight: 800, color: c.text }),
      ...copy.cards.flatMap(([number, label], index) => {
        const x = 80 + index * 510; const fill = index === 0 ? c.accent : index === 1 ? c.text : c.background; const labelColor = index < 2 ? c.background : c.text
        return [
          shape(`card-${index + 1}`, x, 280, 440, 430, fill, { shape: 'rounded-rectangle', radius: 24, stroke: index === 2 ? c.text : undefined, strokeWidth: index === 2 ? 3 : 0 }),
          text(`card-number-${index + 1}`, number, x + 38, 316, 160, 52, { fontSize: 24, fontWeight: 800, color: labelColor }),
          text(`card-label-${index + 1}`, label, x + 38, 430, 340, 170, { fontSize: 44, fontWeight: 800, color: labelColor }),
        ]
      }),
      text('footer', 'ONE SLIDE · ONE JOB · ONE CLEAR NEXT STEP', 80, 786, 1440, 36, { fontSize: 17, fontWeight: 800, align: 'center', color: c.muted }),
    ] },
    './slides/004-evidence.json': { id: 'evidence', name: 'Evidence', layoutRef: 'image-right', background: { color: c.background }, elements: [
      { id: 'visual', type: 'image', frame: frame(0, 0, 900, 900), src: 'placeholder:image', fit: 'cover', alt: 'Replace with evidence' },
      text('kicker', '03 / EVIDENCE', 990, 76, 500, 36, { fontSize: 18, fontWeight: 800, color: c.accent }),
      text('title', copy.evidenceTitle, 990, 148, 510, 170, { styleRef: 'slide-title', fontSize: 52, fontWeight: 800, color: c.text }),
      text('body', copy.evidenceBody, 990, 372, 500, 175, { fontSize: 25, fontWeight: 500, color: c.muted }),
      shape('metric-rule', 990, 602, 500, 3, c.text),
      text('metric', copy.metric, 990, 636, 220, 120, { fontSize: 82, fontWeight: 800, color: c.accent }),
      text('metric-label', copy.metricLabel, 1216, 654, 274, 86, { fontSize: 21, fontWeight: 700, color: c.text, verticalAlign: 'middle' }),
    ] },
    './slides/005-close.json': { id: 'close', name: 'Close', layoutRef: 'section', background: { color: c.text }, elements: [
      shape('accent-block', 0, 0, 34, 900, c.accent),
      text('kicker', '04 / THE DECISION', 96, 80, 700, 42, { fontSize: 18, fontWeight: 800, color: c.accent }),
      text('title', copy.closeTitle, 96, 220, 1270, 260, { styleRef: 'slide-title', fontSize: 82, fontWeight: 800, color: c.background }),
      shape('rule', 96, 598, 1408, 3, c.accent),
      text('body', copy.closeBody, 96, 660, 1200, 70, { fontSize: 29, fontWeight: 600, color: c.muted }),
      text('end', 'END / 05', 1320, 768, 184, 46, { fontSize: 19, fontWeight: 800, align: 'right', color: c.accent }),
    ] },
  }
}

/** Build a slide from a layout preset, overriding placeholder text by element id. */
function layoutSlide(id: string, name: string, layoutId: LayoutPresetId, theme: Theme, overrides: Record<string, string> = {}): Slide {
  const elements = createLayoutElements(layoutId, theme).map(element =>
    element.type === 'text' && overrides[element.id] ? { ...element, text: overrides[element.id] } : element)
  return { id, name, layoutRef: layoutId, background: { color: theme.colors.background }, elements }
}

function paperReadingSlides(theme: Theme, title: string): Record<string, Slide> {
  const c = theme.colors; const mono = theme.fonts.mono ?? theme.fonts.body
  return {
    './slides/001-cover.json': { id: 'cover', name: 'Cover', layoutRef: 'paper-cover', background: { color: c.background }, elements: [
      shape('accent-panel', 0, 0, 420, 900, c.accent),
      text('panel-mark', 'PAPER\nREADING', 62, 76, 320, 170, { fontSize: 56, fontWeight: 800, color: c.background }),
      text('panel-index', '01 — 08', 62, 756, 280, 50, { fontSize: 20, fontWeight: 700, color: c.background, fontFamily: mono }),
      text('kicker', 'VENUE · YEAR · TRACK', 510, 78, 880, 42, { fontSize: 18, fontWeight: 800, color: c.accent, fontFamily: mono, letterSpacing: 2 }),
      text('title', title, 510, 188, 980, 260, { styleRef: 'slide-title', fontSize: 80, fontWeight: 800, color: c.text }),
      shape('rule', 510, 530, 980, 4, c.text),
      text('authors', '作者列表 · 机构', 510, 588, 890, 60, { fontSize: 28, fontWeight: 500, color: c.muted }),
      text('hint', 'ONE PAPER · ONE READING · EIGHT SLIDES', 510, 790, 900, 34, { fontSize: 16, fontWeight: 700, color: c.muted, fontFamily: mono, letterSpacing: 2 }),
    ] },
    './slides/002-problem.json': layoutSlide('problem', 'Problem', 'statement', theme, {
      kicker: '01 / THE PROBLEM', index: '01',
      statement: '这篇论文要解决的核心问题，\n用一句话说清楚。',
      context: '为什么已有方法在这个问题上仍然不够？',
    }),
    './slides/003-contributions.json': layoutSlide('contributions', 'Contributions', 'contributions', theme, { kicker: '02 / CONTRIBUTIONS' }),
    './slides/004-figure.json': layoutSlide('figure', 'Key figure', 'paper-figure', theme, { kicker: '03 / EVIDENCE · FIGURE' }),
    './slides/005-table.json': layoutSlide('table', 'Key table', 'paper-table', theme, { kicker: '04 / EVIDENCE · TABLE' }),
    './slides/006-versus.json': layoutSlide('versus', 'Comparison', 'versus', theme, { kicker: '05 / COMPARISON' }),
    './slides/007-limits.json': layoutSlide('limits', 'Limitations', 'limits', theme, { kicker: '06 / LIMITATIONS' }),
    './slides/008-closing.json': layoutSlide('closing', 'Takeaway', 'closing', theme, { kicker: '07 / TAKEAWAY' }),
  }
}

function natureMethodsSlides(theme: Theme, title: string): Record<string, Slide> {
  const c = theme.colors; const mono = theme.fonts.mono ?? theme.fonts.body
  return {
    './slides/001-cover.json': { id: 'cover', name: 'Cover', layoutRef: 'nature-cover', background: { color: c.background }, elements: [
      shape('accent-rule', 88, 76, 8, 748, c.accent),
      text('kicker', 'METHODS / EVIDENCE-LED DECK', 132, 82, 920, 34, { fontSize: 17, fontWeight: 700, color: c.accent, fontFamily: mono, letterSpacing: 2 }),
      text('title', title, 132, 204, 1240, 250, { styleRef: 'slide-title', fontSize: 72, fontWeight: 700, color: c.text, fit: 'shrink' }),
      text('subtitle', '用问题、方法、证据与边界组织一场可信的学术汇报。', 132, 520, 1080, 80, { fontSize: 28, fontWeight: 400, color: c.muted }),
      shape('metadata-rule', 132, 706, 1380, 2, c.muted),
      text('metadata', 'AUTHOR · AFFILIATION · VENUE · YEAR', 132, 738, 1180, 32, { fontSize: 15, fontWeight: 600, color: c.muted, fontFamily: mono, letterSpacing: 1.5 }),
      text('page', '01', 1370, 738, 142, 40, { fontSize: 23, fontWeight: 700, color: c.accent, fontFamily: mono, align: 'right' }),
    ] },
    './slides/002-problem.json': { id: 'problem', name: 'Problem', layoutRef: 'claim-led', background: { color: c.background }, elements: [
      text('kicker', '01 / BOTTLENECK', 88, 62, 720, 34, { fontSize: 17, fontWeight: 700, color: c.accent, fontFamily: mono, letterSpacing: 2 }),
      text('title', '现有方法在哪个关键条件下仍然不够？', 88, 142, 1260, 146, { styleRef: 'slide-title', fontSize: 58, fontWeight: 700, color: c.text, fit: 'shrink' }),
      text('claim', '把研究缺口写成一个可验证的瓶颈，而不是宽泛的背景。', 88, 382, 1130, 118, { fontSize: 38, fontWeight: 600, color: c.text, lineHeight: 1.32 }),
      shape('claim-rule', 88, 548, 170, 7, c.accent),
      text('boundary', '限定对象、条件与失败方式；下一页的方法必须逐项回应这些条件。', 88, 602, 1140, 90, { fontSize: 25, color: c.muted, lineHeight: 1.45 }),
      text('index', '02', 1354, 96, 158, 80, { fontSize: 52, fontWeight: 700, color: c.surface, fontFamily: mono, align: 'right' }),
    ] },
    './slides/003-method.json': { id: 'method', name: 'Method', layoutRef: 'process-wide', background: { color: c.background }, elements: [
      text('kicker', '02 / METHOD', 88, 56, 720, 34, { fontSize: 17, fontWeight: 700, color: c.accent, fontFamily: mono, letterSpacing: 2 }),
      text('title', '方法流程直接对应问题中的四个约束', 88, 112, 1340, 76, { styleRef: 'slide-title', fontSize: 48, fontWeight: 700, color: c.text, fit: 'shrink' }),
      ...['输入与假设', '核心机制', '验证设计', '可复用输出'].flatMap((label, index): SlideElement[] => {
        const x = 88 + index * 374
        return [
          { id: `stage-${index + 1}-number`, type: 'text', frame: frame(x, 276, 110, 46), text: `0${index + 1}`, fontSize: 23, fontWeight: 700, color: c.accent, fontFamily: mono },
          { id: `stage-${index + 1}-title`, type: 'text', frame: frame(x, 350, 300, 52), text: label, fontSize: 30, fontWeight: 700, color: c.text },
          { id: `stage-${index + 1}-body`, type: 'text', frame: frame(x, 430, 300, 148), text: ['定义输入、假设与适用边界。', '说明关键变换与作用路径。', '用数据、基线与消融建立证据。', '输出可复查结果与使用边界。'][index], fontSize: 22, color: c.muted, lineHeight: 1.45 },
          { id: `stage-${index + 1}-rule`, type: 'shape', frame: frame(x, 620, 300, index === 3 ? 7 : 3), shape: 'rectangle', fill: index === 3 ? c.accent : c.muted, opacity: index === 3 ? 1 : .45 },
          ...(index < 3 ? [{ id: `stage-${index + 1}-arrow`, type: 'line', frame: frame(x + 304, 452, 56, 2), color: c.accent, strokeWidth: 2, arrowEnd: true } as SlideElement] : []),
        ]
      }),
      text('takeaway', '每个阶段都应留下可检查的输入、输出或证据。', 88, 736, 1320, 58, { fontSize: 26, fontWeight: 600, color: c.text }),
    ] },
    './slides/004-figure.json': layoutSlide('figure', 'Key figure', 'paper-figure', theme, { kicker: '03 / EVIDENCE · FIGURE', title: '主图必须直接支撑本页结论' }),
    './slides/005-table.json': layoutSlide('table', 'Key table', 'paper-table', theme, { kicker: '04 / EVIDENCE · TABLE', title: '比较表只保留改变判断的指标' }),
    './slides/006-boundaries.json': { id: 'boundaries', name: 'Boundaries', layoutRef: 'discussion', background: { color: c.background }, elements: [
      text('kicker', '05 / BOUNDARIES', 88, 58, 720, 34, { fontSize: 17, fontWeight: 700, color: c.accent, fontFamily: mono, letterSpacing: 2 }),
      text('title', '可信结论同时说明证据覆盖与失效条件', 88, 118, 1350, 76, { styleRef: 'slide-title', fontSize: 48, fontWeight: 700, color: c.text, fit: 'shrink' }),
      ...[
        ['01', '证据覆盖', '哪些数据、场景与比较已经被实验直接支持？'],
        ['02', '失效条件', '哪些假设一旦不成立，方法表现就可能改变？'],
        ['03', '仍待验证', '哪些外推、机制解释或应用判断仍是开放问题？'],
      ].flatMap(([number, heading, body], index): SlideElement[] => {
        const y = 284 + index * 156
        return [
          { id: `boundary-${index + 1}-number`, type: 'text', frame: frame(88, y, 100, 48), text: number, fontSize: 23, fontWeight: 700, color: c.accent, fontFamily: mono },
          { id: `boundary-${index + 1}-title`, type: 'text', frame: frame(226, y, 300, 48), text: heading, fontSize: 29, fontWeight: 700, color: c.text },
          { id: `boundary-${index + 1}-body`, type: 'text', frame: frame(558, y, 890, 74), text: body, fontSize: 23, color: c.muted, lineHeight: 1.4 },
          { id: `boundary-${index + 1}-rule`, type: 'line', frame: frame(226, y + 104, 1222, 2), color: c.muted, strokeWidth: 1, opacity: .35 },
        ]
      }),
      shape('boundary-anchor', 88, 770, 8, 58, c.accent),
      text('boundary-takeaway', '结论强度不能超过证据覆盖范围。', 124, 770, 1120, 58, { fontSize: 27, fontWeight: 600, color: c.text, verticalAlign: 'middle' }),
    ] },
    './slides/007-closing.json': { id: 'closing', name: 'Takeaway', layoutRef: 'closing', background: { color: c.background }, elements: [
      text('kicker', 'TAKEAWAY / ONE CLAIM', 88, 72, 720, 34, { fontSize: 17, fontWeight: 700, color: c.accent, fontFamily: mono, letterSpacing: 2 }),
      text('quote', '方法的价值不在于看起来复杂，\n而在于证据能否改变判断。', 88, 262, 1300, 210, { styleRef: 'slide-title', fontSize: 62, fontWeight: 700, color: c.text, fit: 'shrink' }),
      shape('rule', 88, 584, 1424, 4, c.accent),
      text('next', '下一步：替换占位证据，核对来源，并把未验证的部分明确标出。', 88, 646, 1260, 72, { fontSize: 27, color: c.muted }),
      text('end', 'END / 07', 1300, 790, 212, 34, { fontSize: 17, fontWeight: 700, color: c.accent, fontFamily: mono, align: 'right', letterSpacing: 2 }),
    ] },
  }
}

export function createDeckTemplate(templateId: DeckTemplateId = 'showcase', options: CreateDeckTemplateOptions = {}): DeckDocument {
  if (!deckTemplatePresets.some(template => template.id === templateId)) throw new Error(`未知模板：${templateId}`)
  const preset = typeof options.theme === 'string' ? getThemePreset(options.theme) : undefined
  if (typeof options.theme === 'string' && !preset) throw new Error(`未知主题：${options.theme}`)
  const defaultTheme = templateId === 'paper-reading' || templateId === 'nature-methods' ? 'nature-editorial' : 'studio-cobalt'
  const theme = structuredClone(typeof options.theme === 'object' ? options.theme : preset?.theme ?? getThemePreset(defaultTheme)!.theme)
  const title = options.title?.trim() || (templateId === 'pitch' ? 'A focused idea, ready to move.' : templateId === 'blank' ? 'Untitled presentation' : templateId === 'paper-reading' ? '论文标题：一句话说清核心贡献' : templateId === 'nature-methods' ? '方法标题：一句话说清解决了什么' : 'Make the idea visible.')
  const id = options.id?.trim() || slug(title)
  if (templateId === 'blank') {
    const path = './slides/001-cover.json'
    return assertDocument({
      deck: { schemaVersion: '0.1', id, title, canvas: { width: 1600, height: 900 }, theme: './theme.json', slides: [path] }, theme,
      slides: { [path]: { id: 'cover', name: 'Cover', layoutRef: 'section', background: { color: theme.colors.background }, elements: [
        text('kicker', 'PLAINDECK / NEW STORY', 88, 76, 760, 40, { fontSize: 18, fontWeight: 800, color: theme.colors.accent }),
        text('title', title, 88, 256, 1280, 220, { styleRef: 'slide-title', fontSize: 86, fontWeight: 800, color: theme.colors.text }),
        shape('rule', 88, 602, 1424, 4, theme.colors.text),
        text('subtitle', 'Add a point of view, then build one slide at a time.', 88, 664, 1120, 70, { fontSize: 28, fontWeight: 500, color: theme.colors.muted }),
        text('page', '01', 1330, 732, 182, 78, { fontSize: 56, fontWeight: 800, align: 'right', color: theme.colors.accent }),
      ] } },
    })
  }
  const slides = templateId === 'paper-reading' ? paperReadingSlides(theme, title) : templateId === 'nature-methods' ? natureMethodsSlides(theme, title) : storySlides(templateId, theme, title)
  return assertDocument({
    deck: { schemaVersion: '0.1', id, title, canvas: { width: 1600, height: 900 }, theme: './theme.json', slides: Object.keys(slides) },
    theme, slides,
  })
}
