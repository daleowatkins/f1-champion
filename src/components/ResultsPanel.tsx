import { useState } from 'react'
import { motion } from 'framer-motion'
import type { DraftPick, SeasonResult } from '../types/game'
import { SEASON_PERK_DESCRIPTIONS, SEASON_PERK_LABELS, SLOT_LABELS } from '../types/game'
import { computeSeasonAchievements } from '../engine/seasonAchievements'
import { TIER_DESCRIPTIONS, TIER_LABELS } from '../engine/simulateSeason'
import { WikipediaSeasonTable } from './WikipediaSeasonTable'

interface Props {
  result: SeasonResult
  mode: 'classic' | 'expert'
  picks: DraftPick[]
  onPlayAgain: () => void
}

export function ResultsPanel({ result, mode, picks, onPlayAgain }: Props) {
  const [showFullGrid, setShowFullGrid] = useState(false)
  const achievements = computeSeasonAchievements(result)
  const driverCount = result.standings.length
  const shareText = `${result.constructorName} ${result.year}: ${TIER_LABELS[result.tier]} — P${result.wccPosition} WCC, ${result.totalPoints} pts, ${result.wins} wins`

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: 'F1 Champion Builder', text: shareText })
      } catch {
        /* user cancelled */
      }
    } else {
      await navigator.clipboard.writeText(shareText)
      alert('Result copied to clipboard!')
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full"
    >
      <div className="text-center mb-8 max-w-4xl mx-auto">
        <p className="text-sm text-white/50 uppercase tracking-widest">Season Complete</p>
        <h2 className="text-3xl font-bold mt-2">{result.constructorName}</h2>
        <p className="text-white/50 text-sm">{result.year} season simulation</p>
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          className={`mt-4 inline-block px-6 py-2 rounded-full font-bold text-lg ${
            result.tier === 'double-champion'
              ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/40'
              : result.tier === 'constructors-champion'
                ? 'bg-f1-accent/20 text-f1-accent border border-f1-accent/40'
                : 'bg-white/10 text-white border border-white/20'
          }`}
        >
          {TIER_LABELS[result.tier]}
        </motion.div>
        <p className="mt-2 text-white/60 text-sm">{TIER_DESCRIPTIONS[result.tier]}</p>
        {result.seasonPerk && (
          <div className="mt-4 mx-auto max-w-md rounded-xl border border-f1-accent/30 bg-f1-accent/10 px-4 py-3 text-left">
            <p className="text-xs text-f1-accent uppercase tracking-widest">Season perk</p>
            <p className="font-semibold text-white mt-1">{SEASON_PERK_LABELS[result.seasonPerk]}</p>
            <p className="text-sm text-white/55 mt-1">{SEASON_PERK_DESCRIPTIONS[result.seasonPerk]}</p>
          </div>
        )}
      </div>

      <div className="mb-6 max-w-4xl mx-auto">
        <p className="text-xs text-white/40 uppercase tracking-widest text-center mb-3">
          Season achievements
        </p>
        <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
          {achievements.map((achievement) => (
            <div
              key={achievement.id}
              title={achievement.detail}
              className={`rounded-full px-4 py-2 text-sm font-semibold border transition-colors ${
                achievement.achieved
                  ? 'bg-f1-accent/15 text-f1-accent border-f1-accent/50 shadow-[0_0_12px_rgba(0,210,190,0.25)]'
                  : 'bg-white/5 text-white/30 border-white/10'
              }`}
            >
              {achievement.shortLabel}
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6 max-w-4xl mx-auto">
        {[
          { label: 'WCC', value: `P${result.wccPosition}` },
          { label: 'WDC (D1)', value: `P${result.wdcPosition}` },
          { label: 'Points', value: result.totalPoints },
          { label: 'Wins', value: result.wins },
          { label: 'Podiums', value: result.podiums },
          { label: 'Team OVR', value: result.teamStrength },
          { label: 'Driver Lineup', value: result.teamRatings.driverLineup },
          { label: 'Car', value: result.teamRatings.car },
        ].map((stat) => (
          <div key={stat.label} className="rounded-lg bg-f1-card border border-white/10 p-3 text-center">
            <p className="text-xs text-white/40">{stat.label}</p>
            <p className="text-xl font-bold">{stat.value}</p>
          </div>
        ))}
      </div>

      {mode === 'expert' && (
        <div className="mb-6 rounded-lg bg-f1-card border border-white/10 p-4 max-w-4xl mx-auto">
          <p className="text-xs text-white/40 uppercase mb-2">Ratings Revealed</p>
          <div className="space-y-1 text-sm">
            {picks.map((p) => (
              <div key={p.slot} className="flex justify-between gap-2">
                <span className="text-white/70 truncate">
                  {SLOT_LABELS[p.slot]}: {p.option.name}
                  <span className="text-white/40 text-xs block">
                    {p.sourceConstructorName} {p.sourceYear}
                  </span>
                </span>
                <span className="text-f1-accent font-bold shrink-0">{p.option.rating}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mb-6 w-full">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3 px-1">
          <h3 className="text-sm text-white/50 uppercase tracking-widest">
            {result.year} World Championship — Driver standings
          </h3>
          <button
            type="button"
            onClick={() => setShowFullGrid((expanded) => !expanded)}
            className="shrink-0 rounded-full border border-white/25 px-4 py-2 text-sm text-white/80 hover:border-f1-accent hover:text-f1-accent transition-colors"
          >
            {showFullGrid
              ? 'Show my drivers only'
              : `Show full grid (${driverCount} drivers)`}
          </button>
        </div>
        <WikipediaSeasonTable result={result} showAllDrivers={showFullGrid} />
      </div>

      <div className="flex flex-col sm:flex-row gap-3 max-w-2xl mx-auto">
        <button
          type="button"
          onClick={handleShare}
          className="flex-1 py-3 rounded-full border border-white/30 text-white hover:border-f1-accent"
        >
          Share result
        </button>
        <button
          type="button"
          onClick={onPlayAgain}
          className="flex-1 py-3 rounded-full bg-f1-red font-bold text-white"
        >
          Build another
        </button>
      </div>
    </motion.div>
  )
}
