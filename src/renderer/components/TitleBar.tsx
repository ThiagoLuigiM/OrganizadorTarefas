import { useState } from 'react'

function WinBtn({ label, onClick, danger }: { label: string; onClick: () => void; danger?: boolean }) {
  const [hover, setHover] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        WebkitAppRegion: 'no-drag' as never,
        width: 46, height: 38, border: 'none', cursor: 'pointer', flexShrink: 0,
        background: hover ? (danger ? '#c42b1c' : 'rgba(255,255,255,0.07)') : 'transparent',
        color: hover && danger ? '#fff' : '#888',
        fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'background 0.15s, color 0.15s',
      }}
    >
      {label}
    </button>
  )
}

export default function TitleBar() {
  return (
    <div style={{
      height: 38, flexShrink: 0,
      background: 'linear-gradient(180deg, #12122a 0%, #0d0d1a 100%)',
      borderBottom: '1px solid #1a1a38',
      display: 'flex', alignItems: 'center',
      WebkitAppRegion: 'drag' as never,
      userSelect: 'none',
    }}>
      <div style={{ flex: 1, paddingLeft: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ color: '#6c63ff', fontSize: 15, lineHeight: 1 }}>✓</span>
        <span style={{ fontSize: 12, color: '#6060a0', fontWeight: 600, letterSpacing: 0.3 }}>
          OrganizadorTarefas
        </span>
      </div>
      <div style={{ display: 'flex' }}>
        <WinBtn label="─" onClick={() => window.api.minimizeWindow()} />
        <WinBtn label="□" onClick={() => window.api.maximizeWindow()} />
        <WinBtn label="✕" onClick={() => window.api.closeWindow()} danger />
      </div>
    </div>
  )
}
