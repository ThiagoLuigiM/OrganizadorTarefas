import { useState, useEffect } from 'react'
import type { Task, Subtask, Priority, UpdateTaskInput, Category } from '../shared/types'

const PRI_COLOR: Record<Priority, string> = { high: '#ef4444', medium: '#f59e0b', low: '#22c55e' }

interface Props {
  task: Task; subtasks: Subtask[]; categories: Category[]
  onUpdate: (id: number, input: UpdateTaskInput) => Promise<void>
  onDelete: (id: number) => Promise<void>
  onClose: () => void
  onCreateSubtask: (taskId: number, title: string) => Promise<void>
  onUpdateSubtask: (id: number, completed: boolean) => Promise<void>
  onDeleteSubtask: (id: number) => Promise<void>
}

export default function TaskDetail({ task, subtasks, categories, onUpdate, onDelete, onClose, onCreateSubtask, onUpdateSubtask, onDeleteSubtask }: Props) {
  const [title, setTitle] = useState(task.title)
  const [notes, setNotes] = useState(task.notes ?? '')
  const [newSub, setNewSub] = useState('')

  useEffect(() => { setTitle(task.title); setNotes(task.notes ?? '') }, [task.id])

  const handleTitleBlur = () => { if (title.trim() && title !== task.title) onUpdate(task.id, { title: title.trim() }) }
  const handleNotesBlur = () => { if (notes !== (task.notes ?? '')) onUpdate(task.id, { notes: notes || null }) }
  const handleAddSub = async () => { if (!newSub.trim()) return; await onCreateSubtask(task.id, newSub.trim()); setNewSub('') }
  const tzOffset = new Date().getTimezoneOffset() * 60000
  const dueDateValue = task.due_at
    ? new Date(task.due_at - tzOffset).toISOString().slice(0, 16) : ''

  const label9: React.CSSProperties = { fontSize: 9, color: '#555', letterSpacing: 1, fontWeight: 700, marginBottom: 4 }
  const inputStyle: React.CSSProperties = { width: '100%', background: '#1a1a2e', border: '1px solid #333', borderRadius: 4, padding: '6px 8px', color: '#e2e2f0', fontSize: 12 }

  return (
    <div style={{ width: 260, background: '#111122', borderLeft: '1px solid #1e1e35', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
      <div style={{ padding: '14px 16px', borderBottom: '1px solid #1e1e35', display: 'flex', alignItems: 'center' }}>
        <span style={{ fontWeight: 600, fontSize: 12, color: '#e2e2f0', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.title}</span>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: 18 }}>&times;</button>
      </div>
      <div style={{ padding: '14px 16px', flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <div style={label9}>TITULO</div>
          <input value={title} onChange={(e) => setTitle(e.target.value)} onBlur={handleTitleBlur} style={inputStyle} />
        </div>
        <div>
          <div style={label9}>PRIORIDADE</div>
          <div style={{ display: 'flex', gap: 4 }}>
            {(['low', 'medium', 'high'] as Priority[]).map((p) => (
              <button key={p} onClick={() => onUpdate(task.id, { priority: p })} style={{
                flex: 1, border: task.priority === p ? '1px solid ' + PRI_COLOR[p] : '1px solid transparent',
                borderRadius: 4, padding: 4, cursor: 'pointer', fontSize: 11,
                background: task.priority === p ? PRI_COLOR[p] + '33' : '#1a1a2e',
                color: task.priority === p ? PRI_COLOR[p] : '#888'
              }}>
                {p === 'high' ? 'Alta' : p === 'medium' ? 'Media' : 'Baixa'}
              </button>
            ))}
          </div>
        </div>
        <div>
          <div style={label9}>VENCIMENTO</div>
          <input type="datetime-local" value={dueDateValue}
            onChange={(e) => onUpdate(task.id, { due_at: e.target.value ? new Date(e.target.value).getTime() : null })}
            style={{ ...inputStyle, fontSize: 11 }} />
        </div>
        <div>
          <div style={label9}>CATEGORIA</div>
          <select value={task.category_id ?? ''} onChange={(e) => onUpdate(task.id, { category_id: e.target.value ? Number(e.target.value) : null })}
            style={inputStyle}>
            <option value="">Sem categoria</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <div style={label9}>NOTAS</div>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} onBlur={handleNotesBlur} rows={3}
            placeholder="Adicionar notas..." style={{ ...inputStyle, resize: 'vertical' }} />
        </div>
        <div>
          <div style={label9}>SUBTAREFAS</div>
          {subtasks.map((sub) => (
            <div key={sub.id} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <button onClick={() => onUpdateSubtask(sub.id, sub.completed_at === null)} style={{
                width: 14, height: 14, borderRadius: 3, flexShrink: 0, cursor: 'pointer',
                background: sub.completed_at ? '#22c55e' : 'transparent',
                border: sub.completed_at ? 'none' : '1px solid #555',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: 'white'
              }}>
                {sub.completed_at ? '&#10003;' : ''}
              </button>
              <span style={{ flex: 1, fontSize: 11, color: '#ccc', textDecoration: sub.completed_at ? 'line-through' : 'none' }}>{sub.title}</span>
              <button onClick={() => onDeleteSubtask(sub.id)} style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: 14, padding: '0 2px' }}>&times;</button>
            </div>
          ))}
          <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
            <input value={newSub} onChange={(e) => setNewSub(e.target.value)} placeholder="Nova subtarefa"
              onKeyDown={(e) => { if (e.key === 'Enter') handleAddSub() }}
              style={{ flex: 1, background: '#1a1a2e', border: '1px solid #333', borderRadius: 4, padding: '4px 8px', color: '#e2e2f0', fontSize: 11 }} />
            <button onClick={handleAddSub} style={{ background: '#6c63ff', color: 'white', border: 'none', borderRadius: 4, padding: '4px 8px', cursor: 'pointer', fontSize: 11 }}>+</button>
          </div>
        </div>
        <button onClick={() => onDelete(task.id)} style={{ marginTop: 'auto', background: 'none', border: '1px solid #333', borderRadius: 6, padding: 6, color: '#888', cursor: 'pointer', fontSize: 11 }}>
          Excluir tarefa
        </button>
      </div>
    </div>
  )
}