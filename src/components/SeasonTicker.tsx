import { motion, AnimatePresence } from 'framer-motion'
import type { SeasonResult } from '../types/game'
import { getEraRules, pointsForPosition } from '../engine/eraRules'
import { PositionMedal } from './PositionMedal'
import { WikipediaSeasonTable } from './WikipediaSeasonTable'

interface Props {
  result: SeasonResult
  currentRound: number
  totalRounds: number
  totalPoints: number
  constructorName: string
  driver1Name: string
  driver2Name: string
}

export function SeasonTicker({
  result,
  currentRound,
  totalRounds,
  totalPoints,
  constructorName,
  driver1Name,
  driver2Name,
}: Props) {
  const current = result.raceResults[currentRound - 1]
  const progress = (currentRound / totalRounds) * 100

  const rules = getEraRules(result.year)
  const partialResult: SeasonResult = {
    ...result,
    standings: result.standings.map((d) => ({
      ...d,
      races: d.races.slice(0, currentRound),
      totalPoints: d.races.slice(0, currentRound).reduce((sum, cell) => {
        if (cell.position === null || cell.position === 'Ret') return sum
        return sum + pointsForPosition(cell.position, rules)
      }, 0),
    })),
    calendar: result.calendar.slice(0, currentRound),
    raceResults: result.raceResults.slice(0, currentRound),
  }

  return (
    <div className="w-full">
      <div className="text-center mb-6">
        <p className="text-sm text-muted mb-2">Simulating {result.year} season</p>
        <h2 className="font-serif text-2xl font-extrabold tracking-tight mb-4 text-foreground">
          {constructorName}
        </h2>

        <div className="h-2.5 np-inset overflow-hidden mb-4 max-w-lg mx-auto">
          <motion.div
            className="h-full bg-accent "
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>

        <AnimatePresence mode="wait">
          {current && (
            <motion.div
              key={current.round}
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: -8 }}
              transition={{ duration: 0.35 }}
              className="np-panel max-w-lg mx-auto mb-6"
            >
              <p className="text-muted text-sm">
                Round {current.round}/{totalRounds}
              </p>
              <p className="font-serif text-xl font-bold mt-1 mb-4 text-foreground">{current.grandPrix}</p>

              <div className="flex justify-center gap-3 flex-wrap mb-4">
                <PositionMedal position={current.driver1Position} label={driver1Name} />
                <PositionMedal position={current.driver2Position} label={driver2Name} />
              </div>

              <p className="text-accent font-bold text-lg">+{current.teamPoints} constructors pts</p>
            </motion.div>
          )}
        </AnimatePresence>

        <p className="text-3xl font-bold text-accent">{totalPoints} pts</p>
        <p className="text-xs text-muted mt-1">Season total</p>
      </div>

      <div className="np-well p-2 sm:p-4 overflow-hidden">
        <WikipediaSeasonTable result={partialResult} highlightRound={currentRound} />
      </div>
    </div>
  )
}
