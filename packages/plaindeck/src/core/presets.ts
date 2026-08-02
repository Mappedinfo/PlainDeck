import type { SlideElement, Theme } from './schema.js'

export type LayoutPresetId = 'blank' | 'title-body' | 'section' | 'two-column' | 'image-right' | 'three-cards'

export interface LayoutPreset {
  id: LayoutPresetId
  name: string
  description: string
}

export const layoutPresets: LayoutPreset[] = [
  { id: 'blank', name: '空白页', description: '从完全空白开始' },
  { id: 'title-body', name: '标题与正文', description: '标准信息页面' },
  { id: 'section', name: '章节标题', description: '醒目的过渡页面' },
  { id: 'two-column', name: '双栏文字', description: '并列观点或对比' },
  { id: 'image-right', name: '图文并排', description: '左文右图的叙事页' },
  { id: 'three-cards', name: '三张卡片', description: '步骤、能力或分类' },
]

export interface ThemePreset {
  id: string
  name: string
  description: string
  colors: Theme['colors']
}

export const themePresets: ThemePreset[] = [
  { id: 'paper-signal', name: '纸张信号', description: '温暖、直接', colors: { background: '#FFF8E9', text: '#20211D', muted: '#706F67', accent: '#E85538' } },
  { id: 'night-blue', name: '深夜蓝图', description: '技术、沉静', colors: { background: '#111820', text: '#F3F7F5', muted: '#8C9AA3', accent: '#36B7D4' } },
  { id: 'field-notes', name: '田野笔记', description: '自然、克制', colors: { background: '#F1F0E7', text: '#203027', muted: '#6E786F', accent: '#547A5A' } },
  { id: 'editorial-blue', name: '编辑蓝', description: '清晰、理性', colors: { background: '#F3F6F7', text: '#17242C', muted: '#6F7C83', accent: '#235D83' } },
  { id: 'poster-red', name: '海报红黑', description: '高对比、强表达', colors: { background: '#F1EBDF', text: '#171715', muted: '#706A62', accent: '#C93428' } },
]

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
