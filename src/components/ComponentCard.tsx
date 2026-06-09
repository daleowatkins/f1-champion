import { motion } from 'framer-motion'
import type { DraftOption, GameMode } from '../types/game'

interface Props {
  option: DraftOption
  mode: GameMode
  onSelect?: () => void
  disabled?: boolean
  isOnlyOption?: boolean
  fillsSlot?: string
  hideSelectButton?: boolean
}

export function ComponentCard({
  option,
  mode,
  onSelect,
  disabled,
  isOnlyOption,
  fillsSlot,
  hideSelectButton,
}: Props) {
  const showStats = mode === 'classic'
  const className = `w-full text-left rounded-xl border p-4 transition-colors ${
    hideSelectButton
      ? 'border-transparent bg-transparent'
      : disabled
        ? 'border-white/10 bg-f1-card/50 opacity-50 cursor-not-allowed'
        : 'border-white/20 bg-f1-card hover:border-f1-accent/60 cursor-pointer'
  }`

  const content = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-white truncate">{option.name}</p>
          {option.meta && (
            <p className="text-sm text-white/50 mt-0.5">{option.meta}</p>
          )}
          {fillsSlot && (
            <p className="text-xs text-f1-accent/80 mt-1">Fills {fillsSlot}</p>
          )}
        </div>
        {showStats && (
          <div className="shrink-0 text-right">
            <span className="text-2xl font-bold text-f1-accent">{option.rating}</span>
            <p className="text-xs text-white/40">OVR</p>
          </div>
        )}
      </div>
      {showStats && option.stats && (
        <div className="mt-3 flex flex-wrap gap-2 text-xs text-white/60">
          {option.stats.wins !== undefined && (
            <span className="bg-white/5 px-2 py-0.5 rounded">W {option.stats.wins}</span>
          )}
          {option.stats.poles !== undefined && (
            <span className="bg-white/5 px-2 py-0.5 rounded">P {option.stats.poles}</span>
          )}
          {option.stats.points !== undefined && (
            <span className="bg-white/5 px-2 py-0.5 rounded">Pts {option.stats.points}</span>
          )}
          {option.stats.avgFinish !== undefined && (
            <span className="bg-white/5 px-2 py-0.5 rounded">Avg {option.stats.avgFinish}</span>
          )}
        </div>
      )}
      {isOnlyOption && (
        <span className="mt-2 inline-block text-xs text-amber-400">Only option</span>
      )}
    </>
  )

  if (hideSelectButton) {
    return <div className={className}>{content}</div>
  }

  return (
    <motion.button
      type="button"
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      onClick={onSelect}
      disabled={disabled}
      className={className}
    >
      {content}
    </motion.button>
  )
}
