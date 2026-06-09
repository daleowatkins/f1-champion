import { useCallback, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BANDIT_SYMBOLS,
  getBanditSymbol,
  spinBandit,
  type BanditSpinResult,
  type BanditSymbolId,
} from '../engine/bandit'
import { deriveSeed, seededRandom } from '../lib/runSeed'
import { SEASON_PERK_DESCRIPTIONS, SEASON_PERK_LABELS, type SeasonPerk } from '../types/game'

interface Props {
  onComplete: (perk: SeasonPerk | null) => void
  runSeed?: number | null
}

const REEL_STRIP = [...BANDIT_SYMBOLS, ...BANDIT_SYMBOLS, ...BANDIT_SYMBOLS]

function SymbolTile({ id, large }: { id: BanditSymbolId; large?: boolean }) {
  const symbol = getBanditSymbol(id)
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-lg border border-white/15 bg-[#12121c] ${
        large ? 'h-24 w-full' : 'h-16 w-full'
      }`}
      style={{ boxShadow: `inset 0 0 24px ${symbol.accent}22` }}
    >
      <span className={large ? 'text-4xl' : 'text-2xl'} role="img" aria-hidden>
        {symbol.emoji}
      </span>
      <span className="text-[10px] uppercase tracking-wider text-white/40 mt-1">{symbol.label}</span>
    </div>
  )
}

export function SeasonBandit({ onComplete, runSeed = null }: Props) {
  const [phase, setPhase] = useState<'ready' | 'spinning' | 'done'>('ready')
  const [displayReels, setDisplayReels] = useState<[BanditSymbolId, BanditSymbolId, BanditSymbolId]>([
    'car',
    'flag',
    'helmet',
  ])
  const [result, setResult] = useState<BanditSpinResult | null>(null)

  const runSpin = useCallback(() => {
    if (phase !== 'ready') return
    setPhase('spinning')
    const rand =
      runSeed !== null
        ? seededRandom(deriveSeed(runSeed, 'bandit'))
        : Math.random
    const spinResult = spinBandit(rand)
    setResult(spinResult)

    const intervals: ReturnType<typeof setInterval>[] = []
    const timeouts: ReturnType<typeof setTimeout>[] = []

    spinResult.reels.forEach((finalSymbol, reelIndex) => {
      let ticks = 0
      const maxTicks = 14 + reelIndex * 5
      const interval = setInterval(() => {
        ticks++
        setDisplayReels((prev) => {
          const next = [...prev] as [BanditSymbolId, BanditSymbolId, BanditSymbolId]
          next[reelIndex] = REEL_STRIP[ticks % REEL_STRIP.length].id
          return next
        })
        if (ticks >= maxTicks) {
          clearInterval(interval)
          setDisplayReels((prev) => {
            const next = [...prev] as [BanditSymbolId, BanditSymbolId, BanditSymbolId]
            next[reelIndex] = finalSymbol
            return next
          })
        }
      }, 70 + reelIndex * 15)
      intervals.push(interval)
    })

    const doneTimer = setTimeout(() => {
      intervals.forEach(clearInterval)
      setDisplayReels(spinResult.reels)
      setPhase('done')
    }, 2400)
    timeouts.push(doneTimer)

    return () => {
      intervals.forEach(clearInterval)
      timeouts.forEach(clearTimeout)
    }
  }, [phase, runSeed])

  return (
    <div className="max-w-lg mx-auto text-center">
      <p className="text-sm text-white/50 uppercase tracking-widest mb-2">Pre-season bonus</p>
      <h2 className="text-2xl font-bold mb-2">Paddock Fruit Machine</h2>
      <p className="text-white/60 text-sm mb-8">
        Pull the lever. Line up three trophies for a random season perk — roughly 1 in 5 runs.
      </p>

      <div className="rounded-2xl border-2 border-f1-accent/30 bg-gradient-to-b from-f1-card to-[#0d0d14] p-6 mb-6 shadow-[0_0_40px_rgba(0,210,190,0.08)]">
        <div className="grid grid-cols-3 gap-3 mb-4">
          {displayReels.map((symbolId, index) => (
            <div key={index} className="overflow-hidden rounded-xl border border-white/10 bg-black/40 p-1">
              <motion.div
                animate={phase === 'spinning' ? { y: [0, -8, 0] } : { y: 0 }}
                transition={
                  phase === 'spinning'
                    ? { repeat: Infinity, duration: 0.12, delay: index * 0.04 }
                    : { duration: 0.2 }
                }
              >
                <SymbolTile id={symbolId} large />
              </motion.div>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap justify-center gap-2 text-[10px] text-white/35 uppercase tracking-wider">
          {BANDIT_SYMBOLS.map((s) => (
            <span key={s.id}>
              {s.emoji} {s.label}
            </span>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {phase === 'done' && result && (
          <motion.div
            key="outcome"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 rounded-xl border border-white/15 bg-f1-card p-4 text-left"
          >
            {result.won && result.perk ? (
              <>
                <p className="text-f1-accent font-bold text-lg mb-1">
                  🏆 Jackpot — {SEASON_PERK_LABELS[result.perk]}
                </p>
                <p className="text-sm text-white/60">{SEASON_PERK_DESCRIPTIONS[result.perk]}</p>
              </>
            ) : (
              <>
                <p className="font-semibold text-white/80 mb-1">No jackpot this time</p>
                <p className="text-sm text-white/50">Your team heads into the season as built.</p>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {phase === 'ready' && (
        <motion.button
          type="button"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={runSpin}
          className="px-10 py-4 rounded-full bg-f1-red font-bold text-white uppercase tracking-wider shadow-lg"
        >
          Pull lever
        </motion.button>
      )}

      {phase === 'spinning' && (
        <p className="text-f1-accent animate-pulse font-semibold">Spinning…</p>
      )}

      {phase === 'done' && result && (
        <motion.button
          type="button"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          whileHover={{ scale: 1.02 }}
          onClick={() => onComplete(result.perk)}
          className="px-10 py-3 rounded-full bg-f1-accent text-f1-dark font-bold"
        >
          Start season
        </motion.button>
      )}
    </div>
  )
}
