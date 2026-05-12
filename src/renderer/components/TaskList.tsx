import { useState } from 'react'
import type { Task, CreateTaskInput, Priority, UpdateTaskInput } from '../shared/types'
import TaskItem from './TaskItem'

interface Props {
  tasks: Task[]; selectedTaskId: number | null; filterLabel: string
  onSelectTask: (id: number | null) => void
  onCreateTask: (input: CreateTaskInput) => Promise<void>
  onUpdateTask: (id: number, input: UpdateTaskInput) => Promise<void>
}

export default function TaskList({ tasks, selectedTaskId, filterLabel, onSelectTask, onCreateTask, onUpdateTask }: Props) {
  const [adding, setAdding] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newPriority, setNewPriority] = useState<Priority>('medium')

  const handleCreate = async () => {
    if (!newTitle.trim()) return
    await onCreateTask({ title: newTitle.trim(), priority: newPriority })
    setNewTitle(''); setNewPriority('medium'); setAdding(false)
  }

  const priorityColor = { high: '#ef4444', medium: '#f59e0b', low: '#22c55e' }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
      <div style={{ padding: '12px 16px', borderBottom: '1px solid #1a1a38', display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontWeight: 700, fontSize: 14, color: '#e2e2f0', flex: 1 }}>{filterLabel}</span>
        <button onClick={() => setAdding(true)} style={{
          background: 'linear-gradient(135deg,#6c63ff,#8b82ff)', color: 'white', border: 'none',
          borderRadius: 7, padding: '5px 14px', fontSize: 12, cursor: 'pointer', fontWeight: 600,
          boxShadow: '0 2px 10px rgba(108,99,255,0.35)',
        }}>
          ＋ Nova tarefa
        </button>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '10px 8px' }}>
        {adding && (
          <div style={{ background: '#13132e', border: '1px solid #2a2a50', borderRadius: 10, padding: 12, marginBottom: 10 }}>
            <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Título da tarefa…" autoFocus
              onKeyDown={(e) => { if (e.key === 'Enter') handleCreate(); if (e.key === 'Escape') setAdding(false) }}
              style={{ width: '100%', background: '#0d0d1a', border: '1px solid #2a2a50', borderRadius: 6, padding: '7px 10px', color: '#e2e2f0', fontSize: 13, marginBottom: 10 }} />
            <div style={{ display: 'flex', gap: 5, marginBottom: 10 }}>
              {(['low', 'medium', 'high'] as Priority[]).map((p) => (
                <button key={p} onClick={() => setNewPriority(p)} style={{
                  flex: 1, border: `1px solid ${newPriority === p ? priorityColor[p] : '#2a2a50'}`,
                  borderRadius: 6, padding: '4px 0', cursor: 'pointer', fontSize: 11, fontWeight: 600,
                  background: newPriority === p ? priorityColor[p] + '22' : 'transparent',
                  color: newPriority === p ? priorityColor[p] : '#6060a0',
                }}>
                  {p === 'high' ? '🔴 Alta' : p === 'medium' ? '🟡 Média' : '🟢 Baixa'}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 5 }}>
              <button onClick={handleCreate} style={{ flex: 1, background: '#6c63ff', color: 'white', border: 'none', borderRadius: 6, padding: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>Criar</button>
              <button onClick={() => setAdding(false)} style={{ flex: 1, background: 'transparent', color: '#6060a0', border: '1px solid #2a2a50', borderRadius: 6, padding: 6, cursor: 'pointer', fontSize: 12 }}>Cancelar</button>
            </div>
          </div>
        )}
        {tasks.length === 0 && !adding && (
          <div style={{ textAlign: 'center', color: '#3a3a6a', fontSize: 13, marginTop: 60 }}>
            <div style={{ fontSize: 32, marginBottom: 10 }}>✓</div>
            Nenhuma tarefa aqui.
          </div>
        )}
        {tasks.map((task) => (
          <TaskItem key={task.id} task={task} selected={selectedTaskId === task.id}
            onSelect={() => onSelectTask(selectedTaskId === task.id ? null : task.id)}
            onToggleComplete={() => onUpdateTask(task.id, { completed_at: task.completed_at === null ? Date.now() : null })} />
        ))}
      </div>
    </div>
  )
}