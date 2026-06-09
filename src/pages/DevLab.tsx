import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
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
    <div className="min-h-screen py-8 px-4 max-w-6xl mx-auto">
      <Link to="/" className="text-sm text-white/40 hover:text-white">
        ← Home
      </Link>
      <div className="mt-4 mb-6">
        <p className="text-f1-accent text-xs uppercase tracking-widest">Dev only</p>
        <h1 className="text-3xl font-bold mt-1">Simulation Lab</h1>
        <p className="text-white/50 text-sm mt-2">
          Pick any components from any team/year, then run the 2026 grid simulation instantly.
        </p>
      </div>

      {error && (
        <p className="mb-4 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </p>
      )}

      {phase === 'configure' && (
        <div className="lg:grid lg:grid-cols-[1fr_220px] lg:gap-8">
          <div className="space-y-6">
            <div className="rounded-xl border border-white/10 bg-f1-card p-4 space-y-4">
              <p className="text-xs text-white/40 uppercase tracking-widest">Quick presets</p>
              <div className="flex flex-wrap gap-2">
                {PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => applyPreset(preset.source).catch(console.error)}
                    className="px-3 py-1.5 rounded-full border border-white/20 text-sm hover:border-f1-accent"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-f1-card p-4 space-y-4">
              <label className="flex items-center gap-2 text-sm text-white/70">
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
                    className="rounded-lg bg-black/30 border border-white/20 px-3 py-2 text-sm"
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
                    className="flex-1 min-w-[200px] rounded-lg bg-black/30 border border-white/20 px-3 py-2 text-sm"
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
                  className="rounded-lg bg-black/30 border border-white/20 px-3 py-2 text-sm"
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
                  className="w-36 rounded-lg bg-black/30 border border-white/20 px-3 py-2 text-sm"
                />
                <label className="flex items-center gap-2 text-sm text-white/60">
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
                  className="px-4 py-2 rounded-full border border-white/20 text-sm hover:border-f1-accent"
                >
                  Auto-fill best
                </button>
              </div>
            </div>

            <div className="rounded-xl border border-white/10 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-f1-card text-white/50 text-xs uppercase">
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
                      <tr key={slot} className="border-t border-white/5">
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
                              className="w-full rounded bg-black/30 border border-white/20 px-2 py-1 text-xs"
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
                              className="w-full rounded bg-black/30 border border-white/20 px-2 py-1 text-xs"
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
                            className="w-full rounded bg-black/30 border border-white/20 px-2 py-1.5 text-sm"
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
                        <td className="px-3 py-2 text-right font-bold tabular-nums text-f1-accent">
                          {selected?.rating ?? '—'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              {loadingPack && (
                <p className="px-3 py-2 text-xs text-white/40 border-t border-white/5">
                  Loading {loadingPack}…
                </p>
              )}
            </div>

            <button
              type="button"
              disabled={!resolvedPicks || !grid}
              onClick={() => runSimulation().catch(console.error)}
              className="w-full py-3 rounded-full bg-f1-red font-bold text-white disabled:opacity-40"
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
              className="px-5 py-2 rounded-full border border-white/30 text-sm hover:border-f1-accent"
            >
              Skip to results
            </button>
            <button
              type="button"
              onClick={reset}
              className="px-5 py-2 rounded-full border border-white/30 text-sm hover:border-f1-accent"
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
              className="px-5 py-2 rounded-full border border-white/30 text-sm hover:border-f1-accent"
            >
              New test run
            </button>
          </div>
          <ResultsPanel
            result={result}
            mode="classic"
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
