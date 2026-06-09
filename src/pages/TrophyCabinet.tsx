import { Link } from 'react-router-dom'
import { useMemo } from 'react'
import { getTrophyCabinet } from '../lib/trophyCabinet'

export function TrophyCabinet() {
  const cabinet = useMemo(() => getTrophyCabinet(), [])

  return (
    <div className="min-h-screen py-10 px-4">
      <div className="max-w-4xl mx-auto">
        <Link to="/" className="text-sm text-white/40 hover:text-white mb-6 inline-block">
          ← Home
        </Link>
        <h1 className="text-3xl font-black mb-2">Trophy Cabinet</h1>
        <p className="text-white/50 text-sm mb-8">
          Achievements and season tiers from your runs — duplicates stack on the shelf.
        </p>

        <div className="trophy-cabinet-frame rounded-2xl p-6 sm:p-8 mb-8">
          <div className="trophy-cabinet-shelf">
            {cabinet.trophies.length === 0 ? (
              <p className="text-white/40 text-center py-16 text-sm">
                No trophies yet. Complete a season to start filling the cabinet.
              </p>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
                {cabinet.trophies.map((trophy) => (
                  <div
                    key={trophy.id}
                    className="trophy-slot relative flex flex-col items-center justify-end pb-2 pt-8"
                    title={`${trophy.label} ×${trophy.count}`}
                  >
                    <span className="text-4xl sm:text-5xl drop-shadow-lg">{trophy.emoji}</span>
                    <p className="text-[10px] sm:text-xs text-center text-amber-100/80 mt-2 leading-tight px-1">
                      {trophy.label}
                    </p>
                    {trophy.count > 1 && (
                      <span className="trophy-count-badge absolute top-2 right-1 sm:right-3">
                        {trophy.count}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="trophy-cabinet-shelf mt-4 opacity-60" aria-hidden />
          <div className="trophy-cabinet-shelf mt-4 opacity-35" aria-hidden />
        </div>

        {cabinet.runs.length > 0 && (
          <div>
            <h2 className="text-sm uppercase tracking-widest text-white/40 mb-3">Recent runs</h2>
            <div className="space-y-2">
              {cabinet.runs.slice(0, 10).map((run) => (
                <div
                  key={run.id}
                  className="rounded-lg border border-white/10 bg-f1-card px-4 py-3 flex flex-wrap items-center justify-between gap-2 text-sm"
                >
                  <span className="font-medium">{run.tier}</span>
                  <span className="text-white/50">
                    {run.year} · P{run.wccPosition} WCC
                  </span>
                  <span className="text-white/35 text-xs font-mono">Seed {run.runSeed}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
