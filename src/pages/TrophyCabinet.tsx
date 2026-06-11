import { useMemo } from 'react'
import { getTrophyCabinet } from '../lib/trophyCabinet'

export function TrophyCabinet() {
  const cabinet = useMemo(() => getTrophyCabinet(), [])

  return (
    <div className="py-10">
      <p className="np-label mb-2">Sports desk</p>
      <h1 className="font-serif text-4xl sm:text-5xl font-black tracking-tight mb-2 text-ink border-b-4 border-ink pb-4">
        Trophy Cabinet
      </h1>
      <p className="text-muted text-sm mb-8 max-w-xl">
        Achievements and season tiers from your runs — duplicates stack on the shelf.
      </p>

      <div className="trophy-cabinet-frame mb-8 newsprint-texture">
        <p className="font-mono text-[10px] uppercase tracking-widest text-muted mb-4">
          Fig. 2.1 — Season honours
        </p>
        <div className="trophy-cabinet-shelf">
          {cabinet.trophies.length === 0 ? (
            <p className="text-muted text-center py-16 text-sm font-mono uppercase tracking-widest">
              No trophies yet — complete a season to fill the shelf.
            </p>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-0 border border-ink">
              {cabinet.trophies.map((trophy, i) => (
                <div
                  key={trophy.id}
                  className={`trophy-slot border-0 border-r border-b border-ink ${
                    (i + 1) % 5 === 0 ? 'md:border-r-0' : ''
                  }`}
                  title={`${trophy.label} ×${trophy.count}`}
                >
                  <span className="text-4xl sm:text-5xl grayscale hover:sepia-[50%] transition-all">
                    {trophy.emoji}
                  </span>
                  <p className="text-[10px] sm:text-xs text-center text-muted mt-2 leading-tight px-1 font-mono uppercase tracking-wide">
                    {trophy.label}
                  </p>
                  {trophy.count > 1 && (
                    <span className="trophy-count-badge">{trophy.count}</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {cabinet.runs.length > 0 && (
        <div>
          <h2 className="np-label mb-3">Recent runs</h2>
          <div className="border border-ink divide-y divide-ink">
            {cabinet.runs.slice(0, 10).map((run) => (
              <div
                key={run.id}
                className="np-panel border-0 flex flex-wrap items-center justify-between gap-2 text-sm py-3 px-4"
              >
                <span className="font-serif font-bold text-foreground">{run.tier}</span>
                <span className="text-muted font-mono text-xs uppercase tracking-wide">
                  {run.year} · P{run.wccPosition} WCC
                </span>
                <span className="text-muted text-xs font-mono">Seed {run.runSeed}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
