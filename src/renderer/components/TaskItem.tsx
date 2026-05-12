import type { Task } from '../shared/types'

const PRI: Record<string, string> = { high: '#ef4444', medium: '#f59e0b', low: '#22c55e' }
const PRI_LABEL: Record<string, string> = { high: 'Alta', medium: 'Media', low: 'Baixa' }

interface Props {
  task: Task; selected: boolean
  onSelect: () => void; onToggleComplete: () => void
}

export default function TaskItem({ task, selected, onSelect, onToggleComplete }: Props) {
  const done = task.completed_at !== null
  const dueLabel = task.due_at
    ? new Date(task.due_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
    : null
  const overdue = task.due_at && !done && task.due_at < Date.now()

  return (
    <div onClick={onSelect} style={{
      display: 'flex', alignItems: 'flex-start', gap: 10,
      background: selected ? '#16163a' : '#111128',
      borderRadius: 9, padding: '10px 12px', marginBottom: 5,
      border: `1px solid ${selected ? '#6c63ff44' : '#1a1a38'}`,
      borderLeft: `3px solid ${PRI[task.priority]}`,
      cursor: 'pointer', opacity: done ? 0.4 : 1,
      transition: 'background 0.15s, border-color 0.15s',
    }}>
      <button onClick={(e) => { e.stopPropagation(); onToggleComplete() }} style={{
        width: 17, height: 17, borderRadius: '50%', flexShrink: 0, marginTop: 1,
        border: done ? 'none' : `2px solid #3a3a6a`,
        background: done ? '#22c55e' : 'transparent',
        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 10, color: 'white', transition: 'background 0.2s, border-color 0.2s',
      }}>
        {done && '✓'}
      </button>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 13, color: '#e2e2f0', textDecoration: done ? 'line-through' : 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {task.title}
        </div>
        <div style={{ fontSize: 10, marginTop: 3, display: 'flex', gap: 8, alignItems: 'center' }}>
          {dueLabel && <span style={{ color: overdue ? '#ef4444' : '#6060a0' }}>{dueLabel}</span>}
          <span style={{ color: PRI[task.priority], fontWeight: 600, fontSize: 9, letterSpacing: 0.5 }}>{PRI_LABEL[task.priority].toUpperCase()}</span>
        </div>
      </div>
    </div>
  )
}