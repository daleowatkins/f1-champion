import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { parseRunSeed } from '../lib/runSeed'

export function Home() {
  const navigate = useNavigate()
  const [seedInput, setSeedInput] = useState('')
  const [seedError, setSeedError] = useState<string | null>(null)

  const handleSeedChallenge = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = seedInput.trim()
    if (trimmed.includes('/play?') || trimmed.startsWith('http')) {
      try {
        const url = new URL(trimmed, window.location.origin)
        navigate(`${url.pathname}${url.search}`)
        return
      } catch {
        setSeedError('Paste a seed number or full challenge link')
        return
      }
    }
    const parsed = parseRunSeed(trimmed)
    if (!parsed) {
      setSeedError('Enter a valid seed number (1–2147483646)')
      return
    }
    setSeedError(null)
    navigate(`/play?mode=classic&seed=${parsed}`)
  }

  return (
    <div className="py-12 sm:py-16 newsprint-texture">
      <div className="grid grid-cols-1 lg:grid-cols-12 border border-ink">
        <motion.header
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-8 border-b lg:border-b-0 lg:border-r border-ink p-6 sm:p-10"
        >
          <p className="np-label mb-4">F1 Team Builder · Front Page</p>
          <h1 className="font-serif text-5xl sm:text-6xl lg:text-8xl font-black tracking-tighter leading-[0.9] mb-6 text-ink">
            F1 <span className="text-editorial-red">Champion</span>
          </h1>
          <p className="text-base sm:text-lg text-foreground leading-relaxed text-justify max-w-2xl np-drop-cap">
            Spin a team, grab any component you like, respin and repeat — build your dream squad and
            chase the title across eight draft rolls and a full championship simulation.
          </p>
        </motion.header>

        <aside className="lg:col-span-4 border-b lg:border-b-0 border-ink p-6 sm:p-8 bg-neutral-100">
          <p className="np-label mb-3">Fig. 1 — Quick start</p>
          <Link to="/play?mode=classic" className="np-btn-primary w-full mb-3 np-focus">
            Play classic
          </Link>
          <Link to="/how-to-play" className="np-btn-secondary w-full np-focus">
            How to play
          </Link>
          <div className="mt-8 pt-6 border-t border-ink">
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted mb-2">
              Edition note
            </p>
            <p className="text-sm text-muted leading-relaxed">
              Classic shows full ratings. Expert hides them. Historical era sets your simulation year
              on the first spin.
            </p>
          </div>
        </aside>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="lg:col-span-12 grid grid-cols-1 md:grid-cols-2 border-t border-ink"
        >
          <Link
            to="/play?mode=classic"
            className="np-link-card border-0 border-b md:border-b-0 md:border-r border-ink np-hard-shadow-hover np-focus"
          >
            <p className="np-label mb-2">Mode I</p>
            <p className="font-serif font-bold text-2xl text-foreground">Classic</p>
            <p className="text-sm text-muted mt-2 text-justify">
              Full ratings and stats on show. Always races the 2026 championship grid.
            </p>
          </Link>

          <div className="np-panel border-0 border-b border-ink p-6 sm:p-8">
            <p className="np-label mb-2">Mode II</p>
            <p className="font-serif font-bold text-2xl text-foreground mb-4">Expert</p>
            <div className="grid grid-cols-1 gap-0 border border-ink">
              <Link
                to="/play?mode=expert"
                className="block px-4 py-3 border-b border-ink hover:bg-neutral-100 np-hard-shadow-hover np-focus transition-colors"
              >
                <p className="font-semibold text-foreground">2026 Championship</p>
                <p className="text-xs text-muted mt-0.5 font-mono uppercase tracking-wide">
                  Norris · Antonelli · Verstappen
                </p>
              </Link>
              <Link
                to="/play?mode=expert&era=historical"
                className="block px-4 py-3 hover:bg-neutral-100 np-hard-shadow-hover np-focus transition-colors"
              >
                <p className="font-semibold text-foreground">Historical era</p>
                <p className="text-xs text-muted mt-0.5 font-mono uppercase tracking-wide">
                  First spin sets the season
                </p>
              </Link>
            </div>
          </div>
        </motion.div>

        <form
          onSubmit={handleSeedChallenge}
          className="lg:col-span-7 border-t border-r border-ink p-6 sm:p-8 np-grid-border-r"
        >
          <p className="np-label mb-2">Challenge desk</p>
          <p className="font-serif font-bold text-xl text-foreground mb-1">Seed challenge</p>
          <p className="text-sm text-muted mb-4">
            Enter a seed or paste a full challenge link to replay a run.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={seedInput}
              onChange={(e) => {
                setSeedInput(e.target.value)
                setSeedError(null)
              }}
              placeholder="Seed or challenge URL"
              className="np-input flex-1 np-focus"
            />
            <button type="submit" className="np-btn-primary shrink-0 np-focus w-full sm:w-auto">
              Play
            </button>
          </div>
          {seedError && <p className="text-destructive text-xs mt-2 font-mono">{seedError}</p>}
        </form>

        <Link
          to="/trophy-cabinet"
          className="lg:col-span-5 border-t border-ink p-6 sm:p-8 np-link-card border-0 np-hard-shadow-hover np-focus flex flex-col justify-center"
        >
          <p className="np-label mb-2">Sports desk</p>
          <p className="font-serif font-bold text-2xl text-foreground">Trophy Cabinet</p>
          <p className="text-sm text-muted mt-2">
            Your season tiers and achievements on the shelf — duplicates stack.
          </p>
        </Link>
      </div>

      <div className="py-8 text-center font-serif text-2xl text-neutral-400 tracking-[1em]">
        &#x2727; &#x2727; &#x2727;
      </div>
    </div>
  )
}
