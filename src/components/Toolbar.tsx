import { AlignCenter, AlignHorizontalDistributeCenter, AlignLeft, AlignRight, Box, Download, FilePlus2, FolderOpen, Image, LayoutDashboard, Minus, MousePointer2, Play, Redo2, Save, Square, Table2, Type, Undo2 } from 'lucide-react'
import { useEditor } from '../store'
import { version as plainDeckVersion } from '../../packages/plaindeck/package.json'

interface Props { onOpen: () => void; onNew: () => void; onImportZip: () => void; onAddImage: () => void; onAddCards: () => void; onAddTable: () => void; onExport: () => void; onPresent: () => void; onSave: () => void }
const ToolButton = ({ label, children, onClick, disabled, accent = false }: { label: string; children: React.ReactNode; onClick?: () => void; disabled?: boolean; accent?: boolean }) => <button className={`tool-button ${accent ? 'accent' : ''}`} title={label} aria-label={label} onClick={onClick} disabled={disabled}>{children}</button>

export function Toolbar({ onOpen, onNew, onImportZip, onAddImage, onAddCards, onAddTable, onExport, onPresent, onSave }: Props) {
  const { addElement, undo, redo, past, future, selectedIds, reorderLayer } = useEditor()
  return <header className="toolbar">
    <div className="brand"><span className="brand-mark">P/D</span><span>PlainDeck</span><small title="PlainDeck core version">v{plainDeckVersion}</small></div>
    <div className="tool-group project-tools">
      <ToolButton label="新建项目" onClick={onNew}><FilePlus2 /></ToolButton>
      <ToolButton label="打开本地目录" onClick={onOpen}><FolderOpen /></ToolButton>
      <button className="zip-import" onClick={onImportZip}>ZIP 导入</button>
      <ToolButton label="立即保存" onClick={onSave}><Save /></ToolButton>
    </div>
    <div className="tool-divider" />
    <div className="tool-group">
      <ToolButton label="选择工具"><MousePointer2 /></ToolButton>
      <ToolButton label="添加文本" onClick={() => addElement('text')}><Type /></ToolButton>
      <ToolButton label="插入本地图片" onClick={onAddImage}><Image /></ToolButton>
      <ToolButton label="从 Markdown / JSON 生成结构化卡片页" onClick={onAddCards}><LayoutDashboard /></ToolButton>
      <ToolButton label="从 Markdown / CSV / JSON 生成原生表格页" onClick={onAddTable}><Table2 /></ToolButton>
      <ToolButton label="添加矩形" onClick={() => addElement('shape')}><Square /></ToolButton>
      <ToolButton label="添加线条" onClick={() => addElement('line')}><Minus /></ToolButton>
    </div>
    <div className="tool-divider" />
    <div className="tool-group">
      <ToolButton label="撤销" onClick={undo} disabled={!past.length}><Undo2 /></ToolButton>
      <ToolButton label="重做" onClick={redo} disabled={!future.length}><Redo2 /></ToolButton>
      <ToolButton label="后移图层" onClick={() => reorderLayer(-1)} disabled={selectedIds.length !== 1}><Box className="layer-back" /></ToolButton>
      <ToolButton label="前移图层" onClick={() => reorderLayer(1)} disabled={selectedIds.length !== 1}><Box /></ToolButton>
    </div>
    <div className="toolbar-spacer" />
    <button className="text-action" onClick={onExport}><Download /> 导出</button>
    <button className="present-action" onClick={onPresent}><Play fill="currentColor" /> 演示</button>
  </header>
}
