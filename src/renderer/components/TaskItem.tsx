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
      background: selected ? '#1e1e3a' : '#1a1a2e',
      borderRadius: 8, padding: '10px 12px', marginBottom: 6,
      borderLeft: '3px solid ' + PRI[task.priority],
      cursor: 'pointer', opacity: done ? 0.45 : 1
    }}>
      <button onClick={(e) => { e.stopPropagation(); onToggleComplete() }} style={{
        width: 16, height: 16, borderRadius: '50%', flexShrink: 0, marginTop: 1,
        border: done ? 'none' : '2px solid #555', background: done ? '#22c55e' : 'transparent',
        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: 'white'
      }}>
        {done && '&#10003;'}
      </button>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 12, color: '#e2e2f0', textDecoration: done ? 'line-through' : 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {task.title}
        </div>
        <div style={{ color: '#888', fontSize: 10, marginTop: 2, display: 'flex', gap: 6 }}>
          {dueLabel && <span style={{ color: overdue ? '#ef4444' : '#888' }}>{dueLabel}</span>}
          <span style={{ color: PRI[task.priority] }}>{PRI_LABEL[task.priority]}</span>
        </div>
      </div>
    </div>
  )
}