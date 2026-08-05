import { useMemo, useState } from 'react'
import { ArrowRight, Search, Sparkles, X } from 'lucide-react'
import { designRecipeCategories, designRecipes, exampleSummaryCards, parseSummaryCards } from 'plaindeck/core'
import { useEditor } from '../store'

export function SummaryCardsDialog({ onClose }: { onClose: () => void }) {
  const [source, setSource] = useState(exampleSummaryCards)
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('')
  const [style, setStyle] = useState('claudeStyle')
  const parsed = useMemo(() => {
    try { return { content: parseSummaryCards(source), error: '' } }
    catch (error) { return { content: null, error: error instanceof Error ? error.message : String(error) } }
  }, [source])
  const filtered = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase()
    return designRecipes.filter(recipe => (!category || recipe.category.id === category) && (!normalized || `${recipe.id} ${recipe.name} ${recipe.description}`.toLocaleLowerCase().includes(normalized)))
  }, [category, query])
  const selected = designRecipes.find(recipe => recipe.id === style) ?? designRecipes[0]
  const addSummarySlide = useEditor(state => state.addSummarySlide)

  return <div className="modal-backdrop" onMouseDown={onClose}>
    <div className="summary-dialog" role="dialog" aria-label="从结构化内容创建卡片页" onMouseDown={event => event.stopPropagation()}>
      <div className="summary-dialog-head">
        <div><span className="eyebrow">174 NATIVE RECIPES / LOCAL + AGENT READY</span><h2>内容与风格，一次落到画布。</h2></div>
        <button onClick={onClose} aria-label="关闭"><X /></button>
      </div>
      <div className="summary-workbench">
        <section className="summary-content-panel">
          <div className="summary-panel-label"><strong>01 / CONTENT</strong><span>Markdown 或 JSON</span></div>
          <p>内容只在本地解析；生成后仍是可拖动、可改色、可被 Git 审查的普通元素。</p>
          <div className="summary-format"><code># 主标题</code><code>## 要点标题</code><code>描述</code><code>icon_name</code></div>
          <textarea value={source} onChange={event => setSource(event.target.value)} spellCheck={false} aria-label="结构化卡片内容" />
        </section>
        <section className="style-catalog">
          <div className="summary-panel-label"><strong>02 / VISUAL RECIPE</strong><span>{filtered.length} / {designRecipes.length}</span></div>
          <div className="style-filters">
            <label><Search /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="搜索风格…" aria-label="搜索设计配方" /></label>
            <select value={category} onChange={event => setCategory(event.target.value)} aria-label="设计配方分类"><option value="">全部分类</option>{designRecipeCategories.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
          </div>
          <div className="style-recipe-list">{filtered.map(recipe => <button key={recipe.id} className={recipe.id === style ? 'active' : ''} onClick={() => setStyle(recipe.id)} title={recipe.description}>
            <span className="recipe-swatches">{Object.values(recipe.theme.colors).map((color, index) => <i key={index} style={{ background: color }} />)}</span>
            <span><strong>{recipe.name}</strong><small>{recipe.id} · {recipe.category.name}</small></span>
            <em>{recipe.card.variant}</em>
          </button>)}</div>
        </section>
      </div>
      <div className="summary-dialog-foot">
        <div className="selected-recipe"><span className="recipe-swatches">{Object.values(selected.theme.colors).map((color, index) => <i key={index} style={{ background: color }} />)}</span><span><strong>{selected.name}</strong><small>{selected.description}</small></span></div>
        <span className={parsed.error ? 'invalid' : ''}>{parsed.error || `已识别 ${parsed.content?.cards.length ?? 0} 个要点`}</span>
        <button disabled={!parsed.content} onClick={() => {
          if (!parsed.content) return
          addSummarySlide(parsed.content, selected.id)
          onClose()
        }}><Sparkles /> 生成卡片页 <ArrowRight /></button>
      </div>
    </div>
  </div>
}
