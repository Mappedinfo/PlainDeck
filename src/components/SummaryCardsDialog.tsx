import { useMemo, useState } from 'react'
import { ArrowRight, Sparkles, X } from 'lucide-react'
import { exampleSummaryCards, parseSummaryCards } from 'plaindeck/core'
import { useEditor } from '../store'

export function SummaryCardsDialog({ onClose }: { onClose: () => void }) {
  const [source, setSource] = useState(exampleSummaryCards)
  const parsed = useMemo(() => {
    try { return { content: parseSummaryCards(source), error: '' } }
    catch (error) { return { content: null, error: error instanceof Error ? error.message : String(error) } }
  }, [source])
  const addSummarySlide = useEditor(state => state.addSummarySlide)

  return <div className="modal-backdrop" onMouseDown={onClose}>
    <div className="summary-dialog" role="dialog" aria-label="从结构化内容创建卡片页" onMouseDown={event => event.stopPropagation()}>
      <div className="summary-dialog-head">
        <div><span className="eyebrow">LOCAL / AGENT READY</span><h2>把要点变成一页。</h2></div>
        <button onClick={onClose} aria-label="关闭"><X /></button>
      </div>
      <p>粘贴 AI 生成的 Markdown 或 JSON。PlainDeck 只在本地解析，并把结果转换为可拖动、可改色、可被 Git 审查的普通元素。</p>
      <div className="summary-format"><code># 主标题</code><code>## 要点标题</code><code>描述</code><code>icon_name（可选）</code></div>
      <textarea value={source} onChange={event => setSource(event.target.value)} spellCheck={false} aria-label="结构化卡片内容" />
      <div className="summary-dialog-foot">
        <span className={parsed.error ? 'invalid' : ''}>{parsed.error || `已识别 ${parsed.content?.cards.length ?? 0} 个要点 · 将新增一页`}</span>
        <button disabled={!parsed.content} onClick={() => {
          if (!parsed.content) return
          addSummarySlide(parsed.content)
          onClose()
        }}><Sparkles /> 生成卡片页 <ArrowRight /></button>
      </div>
    </div>
  </div>
}
