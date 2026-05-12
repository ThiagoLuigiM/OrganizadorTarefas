import { useEffect, useState } from 'react'

export default function Fab() {
  const [count, setCount] = useState(0)
  const allDone = count === 0

  useEffect(() => {
    window.api.getPendingCount().then(setCount)
    const unsub = window.api.onTasksUpdated(setCount)
    return unsub
  }, [])

  return (
    <div style={{ width: 72, height: 72, WebkitAppRegion: 'drag' as never, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <button
        onClick={() => window.api.openMain()}
        style={{
          WebkitAppRegion: 'no-drag' as never,
          width: 52, height: 52, borderRadius: '50%', border: 'none',
          background: allDone ? '#22c55e' : '#6c63ff', color: 'white', fontSize: 22,
          cursor: 'pointer', position: 'relative',
          boxShadow: allDone ? '0 4px 16px rgba(34,197,94,0.5)' : '0 4px 16px rgba(108,99,255,0.5)',
          transition: 'background 0.2s'
        }}>
        ✓
        {count > 0 && (
          <span style={{
            position: 'absolute', top: -4, right: -4, background: '#ef4444',
            borderRadius: '50%', width: 18, height: 18, fontSize: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700
          }}>
            {count > 99 ? '99+' : count}
          </span>
        )}
      </button>
    </div>
  )
}