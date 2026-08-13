import { useEffect, useRef, useState } from 'react'

interface Props {
  name: string
  onCommit: (name: string) => void
}

export function SlideNameEditor({ name, onCommit }: Props) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(name)
  const [draftSource, setDraftSource] = useState(name)
  const inputRef = useRef<HTMLInputElement>(null)

  // Sync the draft to an external rename without an effect (render-time adjustment).
  if (draftSource !== name) { setDraftSource(name); setDraft(name) }
  useEffect(() => { if (editing) inputRef.current?.select() }, [editing])

  const commit = () => {
    const next = draft.trim()
    if (next && next !== name) onCommit(next)
    else setDraft(name)
    setEditing(false)
  }
  const cancel = () => { setDraft(name); setEditing(false) }

  if (editing) return <input ref={inputRef} className="canvas-name-input" aria-label="页面名称" value={draft} maxLength={80} onChange={event => setDraft(event.target.value)} onBlur={commit} onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); commit() } else if (event.key === 'Escape') { event.preventDefault(); cancel() } }} />

  return <strong className="canvas-name" tabIndex={0} role="button" aria-label={`重命名页面：${name}`} title="双击重命名页面" onDoubleClick={() => setEditing(true)} onKeyDown={event => { if (event.key === 'Enter') setEditing(true) }}>{name}</strong>
}
