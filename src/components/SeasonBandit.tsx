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
      className={`flex flex-col items-center justify-center np-inset ${
        large ? 'h-24 w-full' : 'h-16 w-full'
      }`}
    >
      <span className={large ? 'text-4xl' : 'text-2xl'} role="img" aria-hidden>
        {symbol.emoji}
      </span>
      <span className="text-[10px] uppercase tracking-wider text-muted mt-1 font-medium">
        {symbol.label}
      </span>
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
    <div className="max-w-lg mx-auto text-center np-section-inverted p-8 sm:p-10 border border-ink">
      <p className="font-mono text-[10px] uppercase tracking-widest mb-2 text-neutral-400">Pre-season bonus</p>
      <h2 className="font-serif text-2xl font-extrabold tracking-tight mb-2 text-paper">
        Paddock Fruit Machine
      </h2>
      <p className="text-neutral-400 text-sm mb-8">
        Pull the lever. Line up three trophies for a random season perk — roughly 1 in 5 runs.
      </p>

      <div className="border border-paper bg-ink p-4 mb-6">
        <div className="grid grid-cols-3 gap-3 mb-4">
          {displayReels.map((symbolId, index) => (
            <div key={index} className="overflow-hidden np-inset p-1">
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

        <div className="flex flex-wrap justify-center gap-2 text-[10px] text-muted uppercase tracking-wider">
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
            className="mb-6 np-panel text-left"
          >
            {result.won && result.perk ? (
              <>
                <p className="text-accent font-bold text-lg mb-1">
                  🏆 Jackpot — {SEASON_PERK_LABELS[result.perk]}
                </p>
                <p className="text-sm text-muted">{SEASON_PERK_DESCRIPTIONS[result.perk]}</p>
              </>
            ) : (
              <>
                <p className="font-semibold text-foreground mb-1">No jackpot this time</p>
                <p className="text-sm text-muted">Your team heads into the season as built.</p>
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
          className="np-btn-inverted uppercase tracking-wider np-focus"
        >
          Pull lever
        </motion.button>
      )}

      {phase === 'spinning' && (
        <p className="text-accent animate-pulse font-semibold">Spinning…</p>
      )}

      {phase === 'done' && result && (
        <motion.button
          type="button"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          whileHover={{ scale: 1.02 }}
          onClick={() => onComplete(result.perk)}
          className="np-btn-inverted np-focus"
        >
          Start season
        </motion.button>
      )}
    </div>
  )
}
