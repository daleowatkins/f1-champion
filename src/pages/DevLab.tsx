import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Navigate } from 'react-router-dom'
import {
  DRIVER_PRIORITY_LABELS,
  SLOT_LABELS,
  SLOT_ORDER,
  type DraftPick,
  type DriverPriority,
  type SeasonPack,
  type SeasonResult,
  type SimulationGrid,
  type SlotType,
  type SpinEntry,
} from '../types/game'
import { useDevGate } from '../hooks/useDevGate'
import {
  autoFillBest,
  optionsForSlot,
  packCacheKey,
  selectionToPicks,
  type SlotSource,
} from '../engine/devDraft'
import { simulateSeason } from '../engine/simulateSeason'
import { loadSeasonPack, loadSimulationGrid, loadSpinIndex } from '../engine/spinPool'
import { TeamRatingsPanel } from '../components/TeamRatingsPanel'
import { SeasonTicker } from '../components/SeasonTicker'
import { ResultsPanel } from '../components/ResultsPanel'

const RACE_TICK_MS = 1100
const RESULTS_PAUSE_MS = 1200

const PRESETS: { label: string; source: SlotSource }[] = [
  { label: '1988 McLaren', source: { year: 1988, constructorId: 'mclaren' } },
  { label: '2023 Red Bull', source: { year: 2023, constructorId: 'red-bull' } },
  { label: '2004 Ferrari', source: { year: 2004, constructorId: 'ferrari' } },
  { label: '2025 McLaren', source: { year: 2025, constructorId: 'mclaren' } },
  { label: '2026 Grid (McLaren)', source: { year: 2026, constructorId: 'mclaren' } },
]

type DevPhase = 'configure' | 'simulate' | 'results'

function defaultSources(entry: SpinEntry | null): Record<SlotType, SlotSource> {
  const base: SlotSource = entry
    ? { year: entry.year, constructorId: entry.constructorId }
    : { year: 2026, constructorId: 'mclaren' }
  return Object.fromEntries(SLOT_ORDER.map((slot) => [slot, { ...base }])) as Record<
    SlotType,
    SlotSource
  >
}

function DevLabInner() {
  const [spinIndex, setSpinIndex] = useState<SpinEntry[]>([])
  const [grid, setGrid] = useState<SimulationGrid | null>(null)
  const [packs, setPacks] = useState<Record<string, SeasonPack>>({})
  const [loadingPack, setLoadingPack] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [globalSource, setGlobalSource] = useState<SlotSource>({
    year: 1988,
    constructorId: 'mclaren',
  })
  const [mixSources, setMixSources] = useState(false)
  const [sources, setSources] = useState<Record<SlotType, SlotSource>>(defaultSources(null))
  const [selection, setSelection] = useState<Partial<Record<SlotType, string>>>({})
  const [priority, setPriority] = useState<DriverPriority>('equal')
  const [seed, setSeed] = useState('')
  const [animateSim, setAnimateSim] = useState(false)

  const [phase, setPhase] = useState<DevPhase>('configure')
  const [picks, setPicks] = useState<DraftPick[]>([])
  const [result, setResult] = useState<SeasonResult | null>(null)
  const [tickerRound, setTickerRound] = useState(0)
  const [tickerPoints, setTickerPoints] = useState(0)
  const simulationTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    Promise.all([loadSpinIndex(), loadSimulationGrid()])
      .then(([entries, simulationGrid]) => {
        setSpinIndex(entries)
        setGrid(simulationGrid)
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load data'))
  }, [])

  const spinEntries = useMemo(() => {
    const seen = new Set<string>()
    return [...spinIndex]
      .filter((e) => {
        const key = packCacheKey({ year: e.year, constructorId: e.constructorId })
        if (seen.has(key)) return false
        seen.add(key)
        return true
      })
      .sort((a, b) => b.year - a.year || a.constructorName.localeCompare(b.constructorName))
  }, [spinIndex])

  const years = useMemo(
    () => [...new Set(spinEntries.map((e) => e.year))].sort((a, b) => b - a),
    [spinEntries],
  )

  const teamsForYear = useCallback(
    (year: number) =>
      spinEntries.filter((e) => e.year === year).sort((a, b) => a.constructorName.localeCompare(b.constructorName)),
    [spinEntries],
  )

  const ensurePack = useCallback(
    async (source: SlotSource) => {
      const key = packCacheKey(source)
      if (packs[key]) return packs[key]
      setLoadingPack(key)
      try {
        const pack = await loadSeasonPack(source.year, source.constructorId)
        setPacks((prev) => ({ ...prev, [key]: pack }))
        return pack
      } finally {
        setLoadingPack((current) => (current === key ? null : current))
      }
    },
    [packs],
  )

  useEffect(() => {
    const unique = new Set(SLOT_ORDER.map((slot) => packCacheKey(sources[slot])))
    for (const key of unique) {
      const [year, constructorId] = key.split('/')
      ensurePack({ year: Number(year), constructorId }).catch((err) =>
        setError(err instanceof Error ? err.message : 'Failed to load pack'),
      )
    }
  }, [sources, ensurePack])

  useEffect(() => {
    if (!mixSources) {
      setSources(defaultSources({
        id: `${globalSource.constructorId}-${globalSource.year}`,
        constructorId: globalSource.constructorId,
        constructorName: '',
        year: globalSource.year,
        weight: 1,
      }))
    }
  }, [globalSource, mixSources])

  const resolvedPicks = useMemo(
    () => selectionToPicks(selection, sources, packs),
    [selection, sources, packs],
  )

  const applyPreset = async (source: SlotSource) => {
    setGlobalSource(source)
    setMixSources(false)
    const nextSources = defaultSources({
      id: `${source.constructorId}-${source.year}`,
      constructorId: source.constructorId,
      constructorName: '',
      year: source.year,
      weight: 1,
    })
    setSources(nextSources)
    const pack = await ensurePack(source)
    const loaded = { ...packs, [packCacheKey(source)]: pack }
    setPacks(loaded)
    setSelection(autoFillBest(nextSources, loaded))
  }

  const handleAutoFill = async () => {
    const loaded = { ...packs }
    for (const slot of SLOT_ORDER) {
      const key = packCacheKey(sources[slot])
      if (!loaded[key]) {
        loaded[key] = await ensurePack(sources[slot])
      }
    }
    setPacks(loaded)
    setSelection(autoFillBest(sources, loaded))
  }

  const skipSimulation = useCallback(() => {
    if (!result) return
    if (simulationTimerRef.current) {
      clearInterval(simulationTimerRef.current)
      simulationTimerRef.current = null
    }
    setTickerRound(result.raceResults.length)
    setTickerPoints(result.totalPoints)
    setPhase('results')
  }, [result])

  useEffect(() => {
    if (phase !== 'simulate' || !result || !animateSim) return
    const races = result.raceResults
    let round = 0
    let points = 0
    const interval = setInterval(() => {
      round++
      if (round > races.length) {
        clearInterval(interval)
        simulationTimerRef.current = null
        setTimeout(() => setPhase('results'), RESULTS_PAUSE_MS)
        return
      }
      points += races[round - 1].teamPoints
      setTickerRound(round)
      setTickerPoints(points)
    }, RACE_TICK_MS)
    simulationTimerRef.current = interval
    return () => {
      clearInterval(interval)
      simulationTimerRef.current = null
    }
  }, [phase, result, animateSim])

  const runSimulation = async () => {
    if (!resolvedPicks || !grid) return
    setError(null)
    const parsedSeed = seed.trim() ? Number(seed) : undefined
    const seasonResult = simulateSeason(
      grid,
      resolvedPicks,
      Number.isFinite(parsedSeed) ? parsedSeed : undefined,
      priority,
    )
    setPicks(resolvedPicks)
    setResult(seasonResult)
    setTickerRound(0)
    setTickerPoints(0)

    if (animateSim) {
      setPhase('simulate')
      setTickerRound(1)
      setTickerPoints(seasonResult.raceResults[0]?.teamPoints ?? 0)
    } else {
      setPhase('results')
    }
  }

  const reset = () => {
    if (simulationTimerRef.current) clearInterval(simulationTimerRef.current)
    setPhase('configure')
    setResult(null)
    setPicks([])
    setTickerRound(0)
    setTickerPoints(0)
  }

  const driver1Name = picks.find((p) => p.slot === 'driver1')?.option.name ?? 'Driver 1'
  const driver2Name = picks.find((p) => p.slot === 'driver2')?.option.name ?? 'Driver 2'

  return (
    <div className="py-8 max-w-6xl mx-auto">
      <div className="mb-6 border-b-4 border-ink pb-4">
        <p className="np-label mb-2">Editorial desk · Dev only</p>
        <h1 className="font-serif text-3xl font-black tracking-tight text-foreground">
          Simulation Lab
        </h1>
        <p className="text-muted text-sm mt-2">
          Pick any components from any team/year, then run the 2026 grid simulation instantly.
        </p>
      </div>

      {error && (
        <p className="mb-4 np-inset px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      )}

      {phase === 'configure' && (
        <div className="lg:grid lg:grid-cols-[1fr_220px] lg:gap-8">
          <div className="space-y-6">
            <div className="np-panel space-y-4">
              <p className="text-xs text-muted uppercase tracking-widest">Quick presets</p>
              <div className="flex flex-wrap gap-2">
                {PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => applyPreset(preset.source).catch(console.error)}
                    className="np-btn-ghost text-sm min-h-0 px-3 py-1.5"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="np-panel space-y-4">
              <label className="flex items-center gap-2 text-sm text-foreground">
                <input
                  type="checkbox"
                  checked={mixSources}
                  onChange={(e) => setMixSources(e.target.checked)}
                />
                Mix different team/years per slot
              </label>

              {!mixSources && (
                <div className="flex flex-wrap gap-3">
                  <select
                    value={globalSource.year}
                    onChange={(e) => {
                      const year = Number(e.target.value)
                      const teams = teamsForYear(year)
                      setGlobalSource({
                        year,
                        constructorId: teams[0]?.constructorId ?? globalSource.constructorId,
                      })
                    }}
                    className="np-input py-2 text-sm"
                  >
                    {years.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                  <select
                    value={globalSource.constructorId}
                    onChange={(e) =>
                      setGlobalSource((prev) => ({ ...prev, constructorId: e.target.value }))
                    }
                    className="flex-1 min-w-[200px] np-input py-2 text-sm"
                  >
                    {teamsForYear(globalSource.year).map((entry) => (
                      <option key={entry.id} value={entry.constructorId}>
                        {entry.constructorName}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex flex-wrap gap-3 items-center">
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as DriverPriority)}
                  className="np-input py-2 text-sm"
                >
                  {(Object.keys(DRIVER_PRIORITY_LABELS) as DriverPriority[]).map((key) => (
                    <option key={key} value={key}>
                      {DRIVER_PRIORITY_LABELS[key]}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  value={seed}
                  onChange={(e) => setSeed(e.target.value)}
                  placeholder="Seed (optional)"
                  className="w-36 np-input py-2 text-sm"
                />
                <label className="flex items-center gap-2 text-sm text-muted">
                  <input
                    type="checkbox"
                    checked={animateSim}
                    onChange={(e) => setAnimateSim(e.target.checked)}
                  />
                  Animate season
                </label>
                <button
                  type="button"
                  onClick={() => handleAutoFill().catch(console.error)}
                  className="np-btn-ghost text-sm min-h-0"
                >
                  Auto-fill best
                </button>
              </div>
            </div>

            <div className="np-inset overflow-hidden">
              <table className="w-full text-sm">
                <thead className="text-muted text-xs uppercase np-inset">
                  <tr>
                    <th className="text-left px-3 py-2">Slot</th>
                    {mixSources && <th className="text-left px-3 py-2">Year</th>}
                    {mixSources && <th className="text-left px-3 py-2">Team</th>}
                    <th className="text-left px-3 py-2">Component</th>
                    <th className="text-right px-3 py-2">OVR</th>
                  </tr>
                </thead>
                <tbody>
                  {SLOT_ORDER.map((slot) => {
                    const source = sources[slot]
                    const pack = packs[packCacheKey(source)]
                    const options = pack ? optionsForSlot(pack, slot) : []
                    const selected = options.find((o) => o.id === selection[slot])
                    const usedDriverIds = new Set(
                      SLOT_ORDER.filter((s) => s !== slot && (s === 'driver1' || s === 'driver2' || s === 'reserveDriver'))
                        .map((s) => selection[s])
                        .filter(Boolean),
                    )

                    return (
                      <tr key={slot} className="border-t border-surface">
                        <td className="px-3 py-2 font-medium">{SLOT_LABELS[slot]}</td>
                        {mixSources && (
                          <td className="px-3 py-2">
                            <select
                              value={source.year}
                              onChange={(e) => {
                                const year = Number(e.target.value)
                                const teams = teamsForYear(year)
                                setSources((prev) => ({
                                  ...prev,
                                  [slot]: {
                                    year,
                                    constructorId:
                                      teams[0]?.constructorId ?? prev[slot].constructorId,
                                  },
                                }))
                                setSelection((prev) => ({ ...prev, [slot]: undefined }))
                              }}
                              className="np-input py-1 text-xs"
                            >
                              {years.map((y) => (
                                <option key={y} value={y}>
                                  {y}
                                </option>
                              ))}
                            </select>
                          </td>
                        )}
                        {mixSources && (
                          <td className="px-3 py-2">
                            <select
                              value={source.constructorId}
                              onChange={(e) => {
                                setSources((prev) => ({
                                  ...prev,
                                  [slot]: { ...prev[slot], constructorId: e.target.value },
                                }))
                                setSelection((prev) => ({ ...prev, [slot]: undefined }))
                              }}
                              className="np-input py-1 text-xs"
                            >
                              {teamsForYear(source.year).map((entry) => (
                                <option key={entry.id} value={entry.constructorId}>
                                  {entry.constructorName}
                                </option>
                              ))}
                            </select>
                          </td>
                        )}
                        <td className="px-3 py-2">
                          <select
                            value={selection[slot] ?? ''}
                            disabled={!pack || loadingPack === packCacheKey(source)}
                            onChange={(e) =>
                              setSelection((prev) => ({ ...prev, [slot]: e.target.value }))
                            }
                            className="np-input py-1.5 text-sm"
                          >
                            <option value="">Select…</option>
                            {options
                              .filter(
                                (o) =>
                                  !(
                                    (slot === 'driver1' ||
                                      slot === 'driver2' ||
                                      slot === 'reserveDriver') &&
                                    usedDriverIds.has(o.id)
                                  ),
                              )
                              .sort((a, b) => b.rating - a.rating)
                              .map((o) => (
                                <option key={o.id} value={o.id}>
                                  {o.name} ({o.rating})
                                </option>
                              ))}
                          </select>
                        </td>
                        <td className="px-3 py-2 text-right font-bold tabular-nums text-accent">
                          {selected?.rating ?? '—'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              {loadingPack && (
                <p className="px-3 py-2 text-xs text-muted border-t border-surface">
                  Loading {loadingPack}…
                </p>
              )}
            </div>

            <button
              type="button"
              disabled={!resolvedPicks || !grid}
              onClick={() => runSimulation().catch(console.error)}
              className="np-btn-primary w-full disabled:opacity-40"
            >
              Run simulation
            </button>
          </div>

          <div className="mt-6 lg:mt-0">
            <TeamRatingsPanel picks={resolvedPicks ?? []} />
          </div>
        </div>
      )}

      {phase === 'simulate' && result && grid && (
        <div>
          <div className="flex justify-center gap-3 mb-4">
            <button
              type="button"
              onClick={skipSimulation}
              className="np-btn-ghost text-sm min-h-0"
            >
              Skip to results
            </button>
            <button
              type="button"
              onClick={reset}
              className="np-btn-ghost text-sm min-h-0"
            >
              Back to builder
            </button>
          </div>
          <SeasonTicker
            result={result}
            currentRound={tickerRound || 1}
            totalRounds={grid.raceCount}
            totalPoints={tickerPoints}
            constructorName="Dev Team"
            driver1Name={driver1Name}
            driver2Name={driver2Name}
          />
        </div>
      )}

      {phase === 'results' && result && (
        <div>
          <div className="flex justify-center mb-4">
            <button
              type="button"
              onClick={reset}
              className="np-btn-ghost text-sm min-h-0"
            >
              New test run
            </button>
          </div>
          <ResultsPanel
            result={result}
            picks={picks}
            onPlayAgain={reset}
          />
        </div>
      )}
    </div>
  )
}

export function DevLab() {
  const devUnlocked = useDevGate()
  if (!devUnlocked) return <Navigate to="/" replace />
  return <DevLabInner />
}
