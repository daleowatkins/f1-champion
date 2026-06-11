import { computeBeatHistory } from '../lib/beatHistory'
import type { DraftPick } from '../types/game'

interface Props {
  picks: DraftPick[]
  playerWcc: number
}

export function BeatHistoryPanel({ picks, playerWcc }: Props) {
  const summary = computeBeatHistory(picks, playerWcc)

  return (
    <div className="mb-6 max-w-4xl mx-auto np-panel">
      <p className="text-xs text-muted uppercase tracking-widest mb-1 font-semibold">Beat history</p>
      <h3 className="font-serif text-lg font-bold mb-2 text-foreground">You vs the real seasons</h3>
      <p className="text-sm text-muted mb-4">{summary.headline}</p>

      <div className="grid grid-cols-3 gap-3 mb-5 text-center">
        <div className="np-inset p-3">
          <p className="text-xs text-muted">Your WCC</p>
          <p className="text-xl font-bold text-accent">P{summary.playerWcc}</p>
        </div>
        <div className="np-inset p-3">
          <p className="text-xs text-muted">Best source</p>
          <p className="text-xl font-bold text-foreground">P{summary.bestHistoricalWcc}</p>
        </div>
        <div className="np-inset p-3">
          <p className="text-xs text-muted">Teams beaten</p>
          <p className="text-xl font-bold text-foreground">
            {summary.beatCount}/{summary.totalSources}
          </p>
        </div>
      </div>

      <div className="overflow-x-auto np-inset p-2">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-muted text-xs uppercase">
              <th className="pb-2 pr-3">Slot</th>
              <th className="pb-2 pr-3">Pick</th>
              <th className="pb-2 pr-3">Source</th>
              <th className="pb-2 pr-3 text-center">OVR</th>
              <th className="pb-2 pr-3 text-center">Hist. WCC</th>
              <th className="pb-2 text-center">Beat?</th>
            </tr>
          </thead>
          <tbody>
            {summary.rows.map((row) => (
              <tr key={`${row.slot}-${row.pickName}`} className="border-t border-surface">
                <td className="py-2 pr-3 text-muted">{row.slot}</td>
                <td className="py-2 pr-3 font-medium text-foreground">{row.pickName}</td>
                <td className="py-2 pr-3 text-muted">
                  {row.sourceTeam} {row.sourceYear}
                </td>
                <td className="py-2 pr-3 text-center text-accent font-bold">{row.rating}</td>
                <td className="py-2 pr-3 text-center text-foreground">P{row.historicalWcc}</td>
                <td className="py-2 text-center">
                  {row.beatHistorical ? (
                    <span className="text-accent-secondary font-semibold">Yes</span>
                  ) : (
                    <span className="text-placeholder">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
