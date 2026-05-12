import { useEffect, useRef, useState } from 'react'

export default function Fab() {
  const [count, setCount] = useState(0)
  const allDone = count === 0
  const drag = useRef<{ startX: number; startY: number; winX: number; winY: number; moved: boolean } | null>(null)

  useEffect(() => {
    window.api.getPendingCount().then(setCount)
    const unsub = window.api.onTasksUpdated(setCount)
    return unsub
  }, [])

  const handleMouseDown = async (e: React.MouseEvent) => {
    if (e.button !== 0) return
    e.preventDefault()
    const pos = await window.api.getFabPosition()
    drag.current = { startX: e.screenX, startY: e.screenY, winX: pos.x, winY: pos.y, moved: false }

    const onMove = (me: MouseEvent) => {
      if (!drag.current) return
      const dx = me.screenX - drag.current.startX
      const dy = me.screenY - drag.current.startY
      if (Math.abs(dx) > 4 || Math.abs(dy) > 4) drag.current.moved = true
      if (drag.current.moved) window.api.moveFabWindow(drag.current.winX + dx, drag.current.winY + dy)
    }

    const onUp = () => {
      if (drag.current && !drag.current.moved) window.api.openMain()
      drag.current = null
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }

    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }

  return (
    <div style={{ width: 72, height: 72, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <button
        onMouseDown={handleMouseDown}
        style={{
          width: 52, height: 52, borderRadius: '50%', border: 'none',
          background: allDone ? '#22c55e' : '#6c63ff', color: 'white', fontSize: 22,
          cursor: 'grab', position: 'relative',
          boxShadow: allDone ? '0 4px 20px rgba(34,197,94,0.6)' : '0 4px 20px rgba(108,99,255,0.6)',
          transition: 'background 0.2s, transform 0.1s',
        }}
      >
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
