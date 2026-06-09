import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import type { SpinEntry } from '../types/game'

interface Props {
  entry: SpinEntry | null
  spinPool: SpinEntry[]
  isSpinning: boolean
  onSpin: () => void
  onRespin?: () => void
  canRespin?: boolean
  respinsRemaining?: number | null
  hideSpinButton?: boolean
  spinReady?: boolean
}

export function SpinReel({
  entry,
  spinPool,
  isSpinning,
  onSpin,
  onRespin,
  canRespin,
  respinsRemaining,
  hideSpinButton,
  spinReady = true,
}: Props) {
  const [display, setDisplay] = useState<SpinEntry | null>(entry)
  const stepRef = useRef(0)

  useEffect(() => {
    if (!isSpinning) {
      setDisplay(entry)
      stepRef.current = 0
      return
    }

    const pool = spinPool.length > 0 ? spinPool : entry ? [entry] : []
    if (pool.length === 0) return

    let cancelled = false
    stepRef.current = 0

    const tick = () => {
      if (cancelled) return
      const idx = Math.floor(Math.random() * pool.length)
      setDisplay(pool[idx])
      stepRef.current++
      const delay = Math.min(40 + stepRef.current * stepRef.current * 2.5, 220)
      setTimeout(tick, delay)
    }

    tick()
    return () => {
      cancelled = true
    }
  }, [isSpinning, entry, spinPool])

  const shown = display ?? entry

  return (
    <div className="flex flex-col items-center gap-8">
      <div className="relative w-full max-w-md">
        <div className="grid grid-cols-2 gap-4">
          <motion.div
            animate={isSpinning ? { y: [0, -4, 0] } : { y: 0 }}
            transition={{ repeat: isSpinning ? Infinity : 0, duration: 0.12 }}
            className="rounded-2xl bg-f1-card border border-white/20 px-4 py-5 text-center min-h-[108px] flex flex-col justify-center"
          >
            <p className="text-xs uppercase tracking-widest text-white/40 mb-2 shrink-0">Team</p>
            <p
              className={`text-lg sm:text-xl font-bold text-white leading-snug line-clamp-2 ${
                isSpinning ? 'opacity-90' : ''
              }`}
            >
              {shown?.constructorName ?? '—'}
            </p>
          </motion.div>
          <motion.div
            animate={isSpinning ? { y: [0, 4, 0] } : { y: 0 }}
            transition={{ repeat: isSpinning ? Infinity : 0, duration: 0.12 }}
            className="rounded-2xl bg-f1-card border border-white/20 px-4 py-5 text-center min-h-[108px] flex flex-col justify-center"
          >
            <p className="text-xs uppercase tracking-widest text-white/40 mb-2 shrink-0">Year</p>
            <p className="text-xl font-bold text-f1-red leading-none">
              {shown?.year ?? '—'}
            </p>
          </motion.div>
        </div>
        {isSpinning && (
          <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 pointer-events-none flex flex-col gap-[52px]">
            <div className="h-px bg-f1-accent/40" />
          </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        {!hideSpinButton && (
          <motion.button
            type="button"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={onSpin}
            disabled={isSpinning || !spinReady}
            className="px-8 py-3 rounded-full bg-f1-red font-bold text-white uppercase tracking-wider disabled:opacity-50"
          >
            {isSpinning ? 'Spinning...' : spinReady ? 'Spin' : 'Loading...'}
          </motion.button>
        )}
        {canRespin && onRespin && entry && !isSpinning && (
          <button
            type="button"
            onClick={onRespin}
            className="px-6 py-3 rounded-full border border-white/30 text-white/80 text-sm hover:border-f1-accent"
          >
            Re-spin
            {respinsRemaining != null ? ` (${respinsRemaining} left)` : ''}
          </button>
        )}
      </div>
    </div>
  )
}
