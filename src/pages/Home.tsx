import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useDevGate } from '../hooks/useDevGate'
import { parseRunSeed } from '../lib/runSeed'

export function Home() {
  const devUnlocked = useDevGate()
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
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-lg"
      >
        <p className="text-f1-red font-bold uppercase tracking-[0.3em] text-sm mb-4">
          F1 Team Builder
        </p>
        <h1 className="text-5xl font-black mb-4">
          F1 <span className="text-f1-red">Champion</span>
        </h1>
        <p className="text-white/60 mb-10">
          Spin a team, grab any component you like, respin and repeat — build your dream squad and chase the title.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="flex flex-col gap-4 w-full max-w-sm"
      >
        <Link
          to="/play?mode=classic"
          className="block rounded-2xl bg-f1-card border border-white/20 p-6 hover:border-f1-accent/50 transition-colors"
        >
          <p className="font-bold text-lg">Classic</p>
          <p className="text-sm text-white/50 mt-1">
            Full ratings and stats on show. Always races the 2026 championship grid.
          </p>
        </Link>

        <div className="rounded-2xl bg-f1-card border border-white/20 p-5">
          <p className="font-bold text-lg">Expert</p>
          <p className="text-sm text-white/50 mt-1 mb-4">
            Ratings hidden — draft on pure F1 knowledge. Pick your simulation era below.
          </p>
          <div className="flex flex-col gap-2">
            <Link
              to="/play?mode=expert"
              className="block rounded-xl border border-white/15 bg-black/20 px-4 py-3 hover:border-f1-accent/50 transition-colors"
            >
              <p className="font-semibold text-white">2026 Championship</p>
              <p className="text-xs text-white/45 mt-0.5">Modern grid — Norris, Antonelli, Verstappen and co.</p>
            </Link>
            <Link
              to="/play?mode=expert&era=historical"
              className="block rounded-xl border border-white/15 bg-black/20 px-4 py-3 hover:border-f1-accent/50 transition-colors"
            >
              <p className="font-semibold text-white">Historical era</p>
              <p className="text-xs text-white/45 mt-0.5">
                Your first draft roll sets the season you race in.
              </p>
            </Link>
          </div>
        </div>

        <form
          onSubmit={handleSeedChallenge}
          className="rounded-2xl bg-f1-card border border-white/20 p-5"
        >
          <p className="font-bold text-lg">Seed challenge</p>
          <p className="text-sm text-white/50 mt-1 mb-3">
            Enter a seed or paste a full challenge link to replay a run.
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={seedInput}
              onChange={(e) => {
                setSeedInput(e.target.value)
                setSeedError(null)
              }}
              placeholder="Seed or challenge URL"
              className="flex-1 rounded-lg bg-black/30 border border-white/15 px-3 py-2 text-sm font-mono focus:border-f1-accent outline-none"
            />
            <button
              type="submit"
              className="shrink-0 rounded-lg bg-f1-accent text-f1-dark font-bold px-4 py-2 text-sm"
            >
              Play
            </button>
          </div>
          {seedError && <p className="text-f1-red text-xs mt-2">{seedError}</p>}
        </form>

        <Link
          to="/trophy-cabinet"
          className="block rounded-2xl bg-f1-card border border-amber-500/25 p-5 hover:border-amber-400/50 transition-colors text-center"
        >
          <p className="font-bold text-lg">🏆 Trophy Cabinet</p>
          <p className="text-sm text-white/50 mt-1">Your season tiers and achievements on the shelf.</p>
        </Link>

        <Link
          to="/how-to-play"
          className="text-center text-sm text-white/40 hover:text-white mt-2"
        >
          How to play
        </Link>
        {devUnlocked && (
          <div className="flex flex-col gap-1 mt-2">
            <Link
              to="/dev"
              className="text-center text-xs text-f1-accent/70 hover:text-f1-accent"
            >
              Dev lab
            </Link>
            <Link
              to="/admin"
              className="text-center text-xs text-white/30 hover:text-white/50"
            >
              Admin
            </Link>
          </div>
        )}
      </motion.div>
    </div>
  )
}
