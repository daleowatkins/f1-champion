import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useDevGate } from '../../hooks/useDevGate'
import { cn } from '../../lib/cn'

const NAV_LINKS = [
  { to: '/', label: 'Home' },
  { to: '/play?mode=classic', label: 'Play' },
  { to: '/trophy-cabinet', label: 'Trophies' },
  { to: '/how-to-play', label: 'How to play' },
]

const TICKER_ITEMS = [
  'WCC chase',
  'Draft spins',
  'Historical eras',
  '2026 grid',
  'Seed challenges',
  'Pure WDC',
  'Frankenstein squads',
]

function editionDate() {
  return new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function AppNav() {
  const [open, setOpen] = useState(false)
  const location = useLocation()
  const devUnlocked = useDevGate()

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path.split('?')[0])
  }

  const linkClass = (path: string) =>
    cn(
      'np-btn-ghost min-h-11 px-3 np-focus',
      isActive(path) && 'bg-neutral-100 underline decoration-2 decoration-editorial-red underline-offset-4',
    )

  return (
    <header className="sticky top-0 z-40 bg-paper border-b border-ink sharp-corners">
      <div className="border-b border-ink px-4 py-1.5 flex flex-wrap justify-between gap-2 text-[10px] font-mono uppercase tracking-widest text-muted">
        <span>Vol. I · F1 Champion</span>
        <span>{editionDate()}</span>
        <span className="hidden sm:inline">London Edition</span>
      </div>

      <div className="max-w-screen-xl mx-auto px-4 py-3 flex items-center justify-between gap-4 border-b border-ink">
        <Link
          to="/"
          className="font-serif font-black text-xl sm:text-2xl tracking-tighter text-ink np-focus"
        >
          F1 <span className="text-editorial-red">Champion</span>
        </Link>

        <nav className="hidden md:flex items-center gap-1" aria-label="Main">
          {NAV_LINKS.map((item) => (
            <Link key={item.to} to={item.to} className={linkClass(item.to)}>
              {item.label}
            </Link>
          ))}
          {devUnlocked && (
            <>
              <Link to="/dev" className={linkClass('/dev')}>
                Dev lab
              </Link>
              <Link to="/admin" className={linkClass('/admin')}>
                Admin
              </Link>
            </>
          )}
        </nav>

        <button
          type="button"
          className="md:hidden np-btn-secondary min-h-11 w-11 p-0 np-focus"
          aria-expanded={open}
          aria-label={open ? 'Close menu' : 'Open menu'}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? '×' : '≡'}
        </button>
      </div>

      <div className="np-ticker hidden sm:block" aria-hidden>
        <div className="np-ticker-track">
          {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
            <span key={`${item}-${i}`}>
              <span className="text-editorial-red">■</span> {item}
            </span>
          ))}
        </div>
      </div>

      {open && (
        <nav
          className="md:hidden border-b border-ink bg-paper p-3 flex flex-col gap-1"
          aria-label="Mobile"
        >
          {NAV_LINKS.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={linkClass(item.to)}
              onClick={() => setOpen(false)}
            >
              {item.label}
            </Link>
          ))}
          {devUnlocked && (
            <>
              <Link to="/dev" className={linkClass('/dev')} onClick={() => setOpen(false)}>
                Dev lab
              </Link>
              <Link to="/admin" className={linkClass('/admin')} onClick={() => setOpen(false)}>
                Admin
              </Link>
            </>
          )}
        </nav>
      )}
    </header>
  )
}
