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
    padding: '7px 10px', borderRadius: 6, border: 'none', cursor: 'pointer',
    background: active ? 'linear-gradient(90deg,#16163a,#1a1a40)' : 'transparent',
    color: active ? '#e2e2f0' : '#6060a0',
    marginBottom: 2, textAlign: 'left',
    boxShadow: active ? 'inset 2px 0 0 #6c63ff' : 'none',
    transition: 'background 0.15s, color 0.15s',
  })

  const sectionLabel: React.CSSProperties = {
    fontSize: 9, color: '#3a3a6a', fontWeight: 700, letterSpacing: 1.2, marginBottom: 6, paddingLeft: 2,
  }

  return (
    <aside style={{ width: 200, background: '#0f0f24', borderRight: '1px solid #1a1a38', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
      <div style={{ padding: '14px 16px', borderBottom: '1px solid #1a1a38' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{
            width: 26, height: 26, borderRadius: '50%',
            background: 'linear-gradient(135deg,#6c63ff,#a78bfa)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, color: 'white', flexShrink: 0,
          }}>✓</span>
          <span style={{ fontWeight: 700, fontSize: 13, color: '#c4b5fd', letterSpacing: 0.2 }}>Tarefas</span>
        </div>
      </div>

      <div style={{ padding: '14px 12px 4px' }}>
        <div style={sectionLabel}>LISTAS</div>
        {([['today', '📅  Hoje', pendingToday], ['priority', '🔥  Prioritárias', pendingPriority], ['all', '📋  Todas', pendingAll]] as [TaskFilter, string, number][]).map(([f, label, count]) => (
          <button key={String(f)} onClick={() => onFilterChange(f)} style={btnStyle(filter === f)}>
            <span style={{ flex: 1, fontSize: 12 }}>{label}</span>
            {count > 0 && (
              <span style={{ background: '#6c63ff', color: 'white', borderRadius: 10, padding: '1px 7px', fontSize: 10, fontWeight: 600 }}>{count}</span>
            )}
          </button>
        ))}
      </div>

      <div style={{ padding: '14px 12px 4px', flex: 1 }}>
        <div style={sectionLabel}>CATEGORIAS</div>
        {categories.map((cat) => (
          <button key={cat.id} onClick={() => onFilterChange(cat.id)} style={btnStyle(filter === cat.id)}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: cat.color, flexShrink: 0 }} />
            <span style={{ flex: 1, fontSize: 12 }}>{cat.name}</span>
            <span onClick={(e) => { e.stopPropagation(); onDeleteCategory(cat.id) }}
              style={{ color: '#3a3a6a', cursor: 'pointer', fontSize: 14, padding: '0 2px', lineHeight: 1 }}>&times;</span>
          </button>
        ))}
        {adding ? (
          <div style={{ marginTop: 8 }}>
            <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Nome da categoria" autoFocus
              onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') setAdding(false) }}
              style={{ width: '100%', background: '#16163a', border: '1px solid #2a2a50', borderRadius: 6, padding: '5px 8px', color: '#e2e2f0', fontSize: 12, marginBottom: 6 }} />
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 8 }}>
              {COLORS.map((c) => (
                <button key={c} onClick={() => setNewColor(c)}
                  style={{ width: 18, height: 18, borderRadius: '50%', background: c, border: newColor === c ? '2px solid white' : '2px solid transparent', cursor: 'pointer' }} />
              ))}
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              <button onClick={handleAdd} style={{ flex: 1, background: '#6c63ff', color: 'white', border: 'none', borderRadius: 6, padding: '5px 4px', cursor: 'pointer', fontSize: 11, fontWeight: 600 }}>Criar</button>
              <button onClick={() => setAdding(false)} style={{ flex: 1, background: '#16163a', color: '#6060a0', border: 'none', borderRadius: 6, padding: '5px 4px', cursor: 'pointer', fontSize: 11 }}>Cancelar</button>
            </div>
          </div>
        ) : (
          <button onClick={() => setAdding(true)} style={{ ...btnStyle(false), color: '#3a3a6a', fontSize: 12, marginTop: 4 }}>＋ Nova categoria</button>
        )}
      </div>
    </aside>
  )
}