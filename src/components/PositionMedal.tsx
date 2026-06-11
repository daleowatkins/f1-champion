type Position = number | 'DNF'

interface Props {
  position: Position
  label: string
  compact?: boolean
}

function medalForPosition(position: Position): { emoji: string; className: string; label: string } | null {
  if (position === 'DNF' || position > 3) return null
  if (position === 1) return { emoji: '🥇', className: 'text-amber-600', label: 'Gold' }
  if (position === 2) return { emoji: '🥈', className: 'text-slate-500', label: 'Silver' }
  return { emoji: '🥉', className: 'text-amber-700', label: 'Bronze' }
}

export function PositionMedal({ position, label, compact }: Props) {
  const medal = medalForPosition(position)
  const posText = position === 'DNF' ? 'DNF' : `P${position}`

  if (compact) {
    return (
      <span className={`inline-flex items-center gap-1 ${medal?.className ?? 'text-muted'}`}>
        {medal && <span aria-hidden>{medal.emoji}</span>}
        <span>{label}: {posText}</span>
      </span>
    )
  }

  return (
    <div
      className={`px-3 py-2 text-center min-w-[100px] ${
        medal ? 'np-card' : 'np-inset'
      }`}
    >
      <p className="text-xs text-muted truncate max-w-[120px]">{label}</p>
      {medal ? (
        <>
          <p className="text-2xl mt-1" aria-label={medal.label}>
            {medal.emoji}
          </p>
          <p className={`text-sm font-bold ${medal.className}`}>{posText}</p>
        </>
      ) : (
        <p className="text-lg font-bold text-muted mt-1">{posText}</p>
      )}
    </div>
  )
}

export function teamBestPosition(d1: Position, d2: Position): Position | null {
  const positions = [d1, d2].filter((p): p is number => p !== 'DNF')
  if (positions.length === 0) return null
  return Math.min(...positions)
}
