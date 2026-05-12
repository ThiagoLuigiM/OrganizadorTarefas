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

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
      <div style={{ padding: '14px 16px', borderBottom: '1px solid #1e1e35', display: 'flex', alignItems: 'center' }}>
        <span style={{ fontWeight: 700, fontSize: 14, color: '#e2e2f0' }}>{filterLabel}</span>
        <button onClick={() => setAdding(true)} style={{ marginLeft: 'auto', background: '#6c63ff', color: 'white', border: 'none', borderRadius: 6, padding: '5px 12px', fontSize: 11, cursor: 'pointer' }}>
          + Nova tarefa
        </button>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: 8 }}>
        {adding && (
          <div style={{ background: '#1e1e35', borderRadius: 8, padding: 10, marginBottom: 8 }}>
            <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Titulo da tarefa" autoFocus
              onKeyDown={(e) => { if (e.key === 'Enter') handleCreate(); if (e.key === 'Escape') setAdding(false) }}
              style={{ width: '100%', background: '#111122', border: '1px solid #333', borderRadius: 4, padding: '6px 8px', color: '#e2e2f0', fontSize: 12, marginBottom: 8 }} />
            <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
              {(['low', 'medium', 'high'] as Priority[]).map((p) => (
                <button key={p} onClick={() => setNewPriority(p)} style={{
                  flex: 1, border: 'none', borderRadius: 4, padding: 4, cursor: 'pointer', fontSize: 11,
                  background: newPriority === p ? (p === 'high' ? '#ef4444' : p === 'medium' ? '#f59e0b' : '#22c55e') : '#1a1a2e',
                  color: newPriority === p ? 'white' : '#888'
                }}>
                  {p === 'high' ? 'Alta' : p === 'medium' ? 'Media' : 'Baixa'}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              <button onClick={handleCreate} style={{ flex: 1, background: '#6c63ff', color: 'white', border: 'none', borderRadius: 4, padding: 5, cursor: 'pointer', fontSize: 11 }}>Criar</button>
              <button onClick={() => setAdding(false)} style={{ flex: 1, background: '#1a1a2e', color: '#888', border: 'none', borderRadius: 4, padding: 5, cursor: 'pointer', fontSize: 11 }}>Cancelar</button>
            </div>
          </div>
        )}
        {tasks.length === 0 && !adding && (
          <div style={{ textAlign: 'center', color: '#555', fontSize: 12, marginTop: 40 }}>Nenhuma tarefa aqui.</div>
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