import { computeBeatHistory } from '../lib/beatHistory'
import type { DraftPick } from '../types/game'

interface Props {
  picks: DraftPick[]
  playerWcc: number
}

export function BeatHistoryPanel({ picks, playerWcc }: Props) {
  const summary = computeBeatHistory(picks, playerWcc)

  return (
    <div className="mb-6 max-w-4xl mx-auto rounded-xl border border-white/15 bg-f1-card p-5">
      <p className="text-xs text-white/40 uppercase tracking-widest mb-1">Beat history</p>
      <h3 className="text-lg font-bold mb-2">You vs the real seasons</h3>
      <p className="text-sm text-white/60 mb-4">{summary.headline}</p>

      <div className="grid grid-cols-3 gap-3 mb-5 text-center">
        <div className="rounded-lg bg-black/25 p-3">
          <p className="text-xs text-white/40">Your WCC</p>
          <p className="text-xl font-bold text-f1-accent">P{summary.playerWcc}</p>
        </div>
        <div className="rounded-lg bg-black/25 p-3">
          <p className="text-xs text-white/40">Best source</p>
          <p className="text-xl font-bold">P{summary.bestHistoricalWcc}</p>
        </div>
        <div className="rounded-lg bg-black/25 p-3">
          <p className="text-xs text-white/40">Teams beaten</p>
          <p className="text-xl font-bold">
            {summary.beatCount}/{summary.totalSources}
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-white/40 text-xs uppercase">
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
              <tr key={`${row.slot}-${row.pickName}`} className="border-t border-white/10">
                <td className="py-2 pr-3 text-white/70">{row.slot}</td>
                <td className="py-2 pr-3 font-medium">{row.pickName}</td>
                <td className="py-2 pr-3 text-white/60">
                  {row.sourceTeam} {row.sourceYear}
                </td>
                <td className="py-2 pr-3 text-center text-f1-accent font-bold">{row.rating}</td>
                <td className="py-2 pr-3 text-center">P{row.historicalWcc}</td>
                <td className="py-2 text-center">
                  {row.beatHistorical ? (
                    <span className="text-f1-accent font-semibold">Yes</span>
                  ) : (
                    <span className="text-white/35">—</span>
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
