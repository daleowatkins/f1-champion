import type { DraftOption } from '../types/game'

interface Props {
  option: DraftOption
}

export function RatingBreakdownDetail({ option }: Props) {
  const b = option.ratingBreakdown
  if (!b) return null

  const rows: { label: string; value: string }[] = [
    { label: 'Season form', value: String(b.seasonForm) },
  ]
  if (b.yearPerformance !== undefined) rows.push({ label: 'Year performance', value: String(b.yearPerformance) })
  if (b.careerPeakToDate !== undefined) rows.push({ label: 'Career peak', value: String(b.careerPeakToDate) })
  if (b.seasonsToDate !== undefined) rows.push({ label: 'Seasons', value: String(b.seasonsToDate) })
  if (b.teammateDelta !== null && b.teammateDelta !== undefined) {
    rows.push({
      label: 'Teammate delta',
      value: `${b.teammateDelta > 0 ? '+' : ''}${b.teammateDelta}`,
    })
  }
  if (b.teammateNames.length > 0) {
    rows.push({ label: 'Teammate', value: b.teammateNames.join(', ') })
  }
  if (b.deltaPercentile !== null) {
    rows.push({ label: 'Delta percentile', value: `${b.deltaPercentile}%` })
  }

  return (
    <div className="mt-3 rounded-lg border border-white/10 bg-black/20 p-3 text-xs">
      <p className="text-white/40 uppercase tracking-wider mb-2">Rating breakdown</p>
      <dl className="grid grid-cols-2 gap-x-3 gap-y-1">
        {rows.map((row) => (
          <div key={row.label} className="contents">
            <dt className="text-white/45">{row.label}</dt>
            <dd className="text-white/80 text-right font-medium">{row.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
