import { useMemo, useState } from 'react'
import { ArrowRight, Table2, X } from 'lucide-react'
import { exampleTable, parseTableContent, tableStyles, type TableStyle } from 'plaindeck/core'
import { useEditor } from '../store'

const styleCopy: Record<TableStyle, { name: string; description: string }> = {
  rules: { name: 'Nature rules', description: '无竖线，以表头规则和留白建立层级' },
  grid: { name: 'Compact grid', description: '完整网格，适合参数矩阵与密集清单' },
  stripes: { name: 'Quiet stripes', description: '弱斑马纹，适合逐行比较' },
}

export function TableDialog({ onClose }: { onClose: () => void }) {
  const [source, setSource] = useState(exampleTable)
  const [style, setStyle] = useState<TableStyle>('rules')
  const parsed = useMemo(() => {
    try { return { content: parseTableContent(source), error: '' } }
    catch (error) { return { content: null, error: error instanceof Error ? error.message : String(error) } }
  }, [source])
  const addTableSlide = useEditor(state => state.addTableSlide)

  return <div className="modal-backdrop" onMouseDown={onClose}>
    <div className="summary-dialog table-dialog" role="dialog" aria-label="从结构化数据创建表格页" onMouseDown={event => event.stopPropagation()}>
      <div className="summary-dialog-head">
        <div><span className="eyebrow">NATIVE TABLE / EVIDENCE FIRST</span><h2>让比较结果保持可读、可改、可追踪。</h2></div>
        <button onClick={onClose} aria-label="关闭"><X /></button>
      </div>
      <div className="summary-workbench table-workbench">
        <section className="summary-content-panel">
          <div className="summary-panel-label"><strong>01 / DATA</strong><span>Markdown · CSV · TSV · JSON</span></div>
          <p>第一行为表头；建议不超过 8 列、12 行。标题写作结论，来源与 takeaway 会落到同一页。</p>
          <div className="summary-format"><code># 结论式标题</code><code>| 方法 | 指标 |</code><code>Takeaway:</code><code>Source:</code></div>
          <textarea value={source} onChange={event => setSource(event.target.value)} spellCheck={false} aria-label="结构化表格数据" />
        </section>
        <section className="table-preview-panel">
          <div className="summary-panel-label"><strong>02 / PREVIEW</strong><span>{parsed.content ? `${parsed.content.rows.length} × ${parsed.content.columns.length}` : 'INVALID'}</span></div>
          <div className="table-style-options">{tableStyles.map(value => <button key={value} className={style === value ? 'active' : ''} onClick={() => setStyle(value)}><Table2 /><span><strong>{styleCopy[value].name}</strong><small>{styleCopy[value].description}</small></span></button>)}</div>
          <div className={`table-data-preview preview-${style}`}>
            {parsed.content ? <><h3>{parsed.content.title}</h3><div className="table-preview-scroll"><table><thead><tr>{parsed.content.columns.map(column => <th key={column}>{column}</th>)}</tr></thead><tbody>{parsed.content.rows.map((row, rowIndex) => <tr key={rowIndex}>{row.map((cell, columnIndex) => <td key={columnIndex}>{cell}</td>)}</tr>)}</tbody></table></div>{parsed.content.takeaway && <p>{parsed.content.takeaway}</p>}</> : <div className="table-preview-error">{parsed.error}</div>}
          </div>
        </section>
      </div>
      <div className="summary-dialog-foot table-dialog-foot">
        <div><strong>{styleCopy[style].name}</strong><small>生成后可双击单元格，或在右侧属性面板批量编辑。</small></div>
        <span className={parsed.error ? 'invalid' : ''}>{parsed.error || `已识别 ${parsed.content?.rows.length ?? 0} 行数据`}</span>
        <button disabled={!parsed.content} onClick={() => { if (!parsed.content) return; addTableSlide(parsed.content, style); onClose() }}><Table2 /> 生成表格页 <ArrowRight /></button>
      </div>
    </div>
  </div>
}
