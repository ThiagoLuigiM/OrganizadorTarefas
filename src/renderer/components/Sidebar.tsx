import { useState } from 'react'
import type { Category, TaskFilter } from '../shared/types'

const COLORS = ['#6c63ff', '#22c55e', '#f59e0b', '#ef4444', '#3b82f6', '#ec4899']

interface Props {
  categories: Category[]; filter: TaskFilter
  pendingToday: number; pendingPriority: number; pendingAll: number
  onFilterChange: (f: TaskFilter) => void
  onCreateCategory: (name: string, color: string) => Promise<void>
  onDeleteCategory: (id: number) => Promise<void>
}

export default function Sidebar({ categories, filter, pendingToday, pendingPriority, pendingAll, onFilterChange, onCreateCategory, onDeleteCategory }: Props) {
  const [adding, setAdding] = useState(false)
  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState(COLORS[0])

  const handleAdd = async () => {
    if (!newName.trim()) return
    await onCreateCategory(newName.trim(), newColor)
    setNewName(''); setNewColor(COLORS[0]); setAdding(false)
  }

  const btnStyle = (active: boolean): React.CSSProperties => ({
    display: 'flex', alignItems: 'center', gap: 8, width: '100%',
    padding: '6px 8px', borderRadius: 6, border: 'none', cursor: 'pointer',
    background: active ? '#1a1a35' : 'transparent',
    color: active ? '#e2e2f0' : '#888', marginBottom: 2, textAlign: 'left'
  })

  return (
    <aside style={{ width: 200, background: '#111122', borderRight: '1px solid #1e1e35', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
      <div style={{ padding: 16, borderBottom: '1px solid #1e1e35' }}>
        <span style={{ fontWeight: 700, fontSize: 15, color: '#a78bfa' }}>&#10003; OrganizadorTarefas</span>
      </div>
      <div style={{ padding: '12px 16px 4px' }}>
        <div style={{ fontSize: 9, color: '#555', fontWeight: 700, letterSpacing: 1, marginBottom: 6 }}>SMART LISTS</div>
        {([['today', 'Hoje', pendingToday], ['priority', 'Prioritarias', pendingPriority], ['all', 'Todas', pendingAll]] as [TaskFilter, string, number][]).map(([f, label, count]) => (
          <button key={String(f)} onClick={() => onFilterChange(f)} style={btnStyle(filter === f)}>
            <span style={{ flex: 1, fontSize: 12 }}>{label}</span>
            {count > 0 && <span style={{ background: '#6c63ff', color: 'white', borderRadius: 10, padding: '1px 7px', fontSize: 10 }}>{count}</span>}
          </button>
        ))}
      </div>
      <div style={{ padding: '12px 16px 4px', marginTop: 8, flex: 1 }}>
        <div style={{ fontSize: 9, color: '#555', fontWeight: 700, letterSpacing: 1, marginBottom: 6 }}>CATEGORIAS</div>
        {categories.map((cat) => (
          <button key={cat.id} onClick={() => onFilterChange(cat.id)} style={btnStyle(filter === cat.id)}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: cat.color, flexShrink: 0 }} />
            <span style={{ flex: 1, fontSize: 12 }}>{cat.name}</span>
            <span onClick={(e) => { e.stopPropagation(); onDeleteCategory(cat.id) }}
              style={{ color: '#555', cursor: 'pointer', fontSize: 14, padding: '0 2px' }}>&times;</span>
          </button>
        ))}
        {adding ? (
          <div style={{ marginTop: 6 }}>
            <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Nome" autoFocus
              onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') setAdding(false) }}
              style={{ width: '100%', background: '#1a1a2e', border: '1px solid #333', borderRadius: 4, padding: '4px 8px', color: '#e2e2f0', fontSize: 12, marginBottom: 6 }} />
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 6 }}>
              {COLORS.map((c) => (
                <button key={c} onClick={() => setNewColor(c)}
                  style={{ width: 18, height: 18, borderRadius: '50%', background: c, border: newColor === c ? '2px solid white' : '2px solid transparent', cursor: 'pointer' }} />
              ))}
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              <button onClick={handleAdd} style={{ flex: 1, background: '#6c63ff', color: 'white', border: 'none', borderRadius: 4, padding: 4, cursor: 'pointer', fontSize: 11 }}>Criar</button>
              <button onClick={() => setAdding(false)} style={{ flex: 1, background: '#1a1a2e', color: '#888', border: 'none', borderRadius: 4, padding: 4, cursor: 'pointer', fontSize: 11 }}>Cancelar</button>
            </div>
          </div>
        ) : (
          <button onClick={() => setAdding(true)} style={{ ...btnStyle(false), color: '#444', fontSize: 12, marginTop: 2 }}>+ Nova categoria</button>
        )}
      </div>
    </aside>
  )
}