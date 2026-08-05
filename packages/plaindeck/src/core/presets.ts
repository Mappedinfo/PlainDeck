import type { SlideElement, Theme } from './schema.js'
import { createSummaryCardElements } from './summary-cards.js'

export type LayoutPresetId = 'blank' | 'title-body' | 'section' | 'statement' | 'metric' | 'two-column' | 'image-right' | 'three-cards' | 'summary-cards'

export interface LayoutPreset {
  id: LayoutPresetId
  name: string
  description: string
}

export const layoutPresets: LayoutPreset[] = [
  { id: 'blank', name: '空白页', description: '从完全空白开始' },
  { id: 'title-body', name: '标题与正文', description: '标准信息页面' },
  { id: 'section', name: '章节标题', description: '醒目的过渡页面' },
  { id: 'statement', name: '核心观点', description: '一句话成为视觉中心' },
  { id: 'metric', name: '关键数字', description: '数据、结论与解释' },
  { id: 'two-column', name: '双栏文字', description: '并列观点或对比' },
  { id: 'image-right', name: '图文并排', description: '左文右图的叙事页' },
  { id: 'three-cards', name: '三张卡片', description: '步骤、能力或分类' },
  { id: 'summary-cards', name: '结构化卡片', description: '1–8 个自适应信息要点' },
]

export interface ThemePreset {
  id: string
  name: string
  description: string
  colors: Theme['colors']
  theme: Theme
}

const makeTheme = (colors: Theme['colors'], fonts: Theme['fonts'] = {
  title: 'Avenir Next, Aptos Display, Helvetica Neue, sans-serif',
  body: 'Avenir Next, Aptos, Helvetica Neue, sans-serif',
  mono: 'SFMono-Regular, IBM Plex Mono, Consolas, monospace',
}): Theme => ({
  fonts,
  fontSizes: { title: 76, heading: 48, body: 28, caption: 19 },
  colors,
  spacing: { page: 80, small: 16, medium: 30, large: 64 },
})

const themePreset = (id: string, name: string, description: string, colors: Theme['colors'], fonts?: Theme['fonts']): ThemePreset => {
  const theme = makeTheme(colors, fonts)
  return { id, name, description, colors: theme.colors, theme }
}

export const themePresets: ThemePreset[] = [
  themePreset('studio-cobalt', '钴蓝工作室', '编辑感、鲜明、现代', { background: '#F2F0E8', text: '#102A43', muted: '#667085', accent: '#FF5A4F' }),
  themePreset('night-citrus', '午夜柑橘', '深色、锐利、舞台感', { background: '#101714', text: '#F6F3E8', muted: '#9FAB9F', accent: '#D8FF52' }),
  themePreset('ink-rose', '墨色玫瑰', '克制、时尚、高对比', { background: '#171319', text: '#FFF7F2', muted: '#BAAEB6', accent: '#FF6B8A' }),
  themePreset('paper-signal', '纸张信号', '温暖、直接', { background: '#FFF8E9', text: '#20211D', muted: '#706F67', accent: '#E85538' }, { title: 'Georgia, Charter, serif', body: 'Avenir Next, Aptos, sans-serif', mono: 'SFMono-Regular, Consolas, monospace' }),
  themePreset('night-blue', '深夜蓝图', '技术、沉静', { background: '#111820', text: '#F3F7F5', muted: '#8C9AA3', accent: '#36B7D4' }),
  themePreset('field-notes', '田野笔记', '自然、克制', { background: '#F1F0E7', text: '#203027', muted: '#6E786F', accent: '#547A5A' }, { title: 'Georgia, Charter, serif', body: 'Avenir Next, Aptos, sans-serif', mono: 'SFMono-Regular, Consolas, monospace' }),
  themePreset('editorial-blue', '编辑蓝', '清晰、理性', { background: '#F3F6F7', text: '#17242C', muted: '#6F7C83', accent: '#235D83' }),
  themePreset('poster-red', '海报红黑', '高对比、强表达', { background: '#F1EBDF', text: '#171715', muted: '#706A62', accent: '#C93428' }),
]

export function getThemePreset(id: string): ThemePreset | undefined {
  return themePresets.find(preset => preset.id === id)
}

const imagePlaceholder = 'placeholder:image'
const frame = (x: number, y: number, w: number, h: number) => ({ x, y, w, h })

export function createLayoutElements(layoutId: LayoutPresetId, theme: Theme): SlideElement[] {
  const text = theme.colors.text
  const muted = theme.colors.muted
  const accent = theme.colors.accent
  const background = theme.colors.background
  const title = (id: string, value: string, x: number, y: number, w: number, h: number, fontSize = 58): SlideElement => ({ id, type: 'text', styleRef: 'slide-title', frame: frame(x, y, w, h), text: value, fontSize, fontWeight: 700 })
  const body = (id: string, value: string, x: number, y: number, w: number, h: number): SlideElement => ({ id, type: 'text', frame: frame(x, y, w, h), text: value, fontSize: 28, color: muted })

  if (layoutId === 'blank') return []
  if (layoutId === 'title-body') return [
    title('title', '点击输入标题', 96, 88, 1408, 110),
    { id: 'accent-rule', type: 'shape', frame: frame(96, 230, 120, 8), shape: 'rectangle', fill: accent },
    body('body', '点击输入正文。用清晰的段落组织观点，也可以从工具栏继续添加文字、图片或形状。', 96, 286, 1220, 360),
  ]
  if (layoutId === 'section') return [
    { id: 'section-number', type: 'text', frame: frame(96, 96, 300, 54), text: 'SECTION 01', fontSize: 22, fontWeight: 700, color: accent },
    title('title', '章节标题', 96, 286, 1300, 180, 76),
    body('subtitle', '用一句话说明接下来要讨论的主题', 100, 500, 1100, 70),
    { id: 'section-block', type: 'shape', frame: frame(1370, 0, 230, 900), shape: 'rectangle', fill: accent, text: '01', textColor: background, fontSize: 72, fontWeight: 700, align: 'center', verticalAlign: 'middle' },
  ]
  if (layoutId === 'statement') return [
    { id: 'kicker', type: 'text', frame: frame(88, 72, 720, 40), text: 'ONE IDEA / ONE SLIDE', fontSize: 18, fontWeight: 700, color: accent },
    { id: 'index', type: 'text', frame: frame(1260, 52, 252, 150), text: '01', fontSize: 112, fontWeight: 700, align: 'right', color: accent },
    title('statement', '把最重要的观点，\n写成一句能被记住的话。', 88, 238, 1240, 270, 76),
    { id: 'rule', type: 'shape', frame: frame(88, 620, 1424, 3), shape: 'rectangle', fill: text },
    body('context', '补充一行证据、限定条件或行动含义。', 88, 682, 1040, 70),
  ]
  if (layoutId === 'metric') return [
    { id: 'kicker', type: 'text', frame: frame(88, 72, 720, 40), text: 'SIGNAL / METRIC', fontSize: 18, fontWeight: 700, color: accent },
    { id: 'metric', type: 'text', frame: frame(84, 190, 850, 260), text: '72%', fontSize: 196, fontWeight: 700, color: text },
    { id: 'metric-rule', type: 'shape', frame: frame(930, 214, 8, 420), shape: 'rectangle', fill: accent },
    title('title', '关键数字说明了什么', 1010, 224, 500, 138, 46),
    body('body', '不要只展示数字。解释它改变了哪个判断，以及观众下一步应该做什么。', 1010, 410, 480, 220),
    { id: 'source', type: 'text', frame: frame(88, 746, 900, 40), text: 'SOURCE · PERIOD · SAMPLE', fontSize: 17, fontWeight: 700, color: muted },
  ]
  if (layoutId === 'two-column') return [
    title('title', '双栏标题', 88, 70, 1424, 100, 54),
    { id: 'divider', type: 'shape', frame: frame(796, 230, 3, 490), shape: 'rectangle', fill: accent },
    { id: 'left-label', type: 'text', frame: frame(88, 230, 620, 48), text: '观点 A', fontSize: 24, fontWeight: 700, color: accent },
    body('left-body', '在这里输入左栏内容。适合呈现一种方法、一个立场或一组信息。', 88, 302, 620, 320),
    { id: 'right-label', type: 'text', frame: frame(890, 230, 620, 48), text: '观点 B', fontSize: 24, fontWeight: 700, color: accent },
    body('right-body', '在这里输入右栏内容。两栏保持相似的信息层级，更容易比较。', 890, 302, 620, 320),
  ]
  if (layoutId === 'image-right') return [
    { id: 'kicker', type: 'text', frame: frame(88, 72, 600, 42), text: 'IMAGE + STORY', fontSize: 19, fontWeight: 700, color: accent },
    title('title', '让图片承担一半表达', 88, 154, 620, 170, 58),
    body('body', '左侧保留关键叙述，右侧替换为照片、图表或研究结果。', 88, 370, 590, 210),
    { id: 'image', type: 'image', frame: frame(800, 72, 712, 756), src: imagePlaceholder, fit: 'cover', alt: '图片占位' },
  ]
  if (layoutId === 'summary-cards') return createSummaryCardElements({
    title: '把长内容整理成清楚的卡片',
    cards: [
      { title: '提炼', description: '每张卡只承载一个核心要点，保留主体、数字与必要限定。', icon: 'filter_alt' },
      { title: '编排', description: '卡片数量会自动适配为一到两行，生成后仍可逐元素编辑。', icon: 'dashboard' },
      { title: '复核', description: 'AI 负责初稿，人负责事实、判断与最终表达。', icon: 'verified' },
    ],
  }, theme)
  return [
    title('title', '三个并列要点', 80, 64, 1440, 90, 54),
    ...[0, 1, 2].map((index): SlideElement => ({
      id: `card-${index + 1}`,
      type: 'shape',
      frame: frame(80 + index * 510, 230, 440, 430),
      shape: 'rounded-rectangle',
      fill: index === 0 ? accent : index === 1 ? text : '#DED8CA',
      radius: 22,
      text: `0${index + 1}\n双击编辑卡片文字`,
      textColor: index < 2 ? background : text,
      fontSize: 32,
      fontWeight: 700,
      align: 'left',
      verticalAlign: 'middle',
    })),
  ]
}
