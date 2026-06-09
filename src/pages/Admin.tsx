import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useDevGate } from '../hooks/useDevGate'
import {
  deleteOverrideItem,
  loadAdminIndex,
  rebuildData,
  saveOverrideItem,
} from '../api/admin'
import type { AdminIndexEntry, AdminSlot } from '../types/admin'
import { ADMIN_SLOT_LABELS } from '../types/admin'

const PAGE_SIZE = 50

export function Admin() {
  const devUnlocked = useDevGate()
  const [entries, setEntries] = useState<AdminIndexEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<string | null>(null)
  const [rebuilding, setRebuilding] = useState(false)

  const [yearFilter, setYearFilter] = useState<string>('all')
  const [slotFilter, setSlotFilter] = useState<AdminSlot | 'all'>('drivers')
  const [search, setSearch] = useState('')
  const [overriddenOnly, setOverriddenOnly] = useState(false)
  const [page, setPage] = useState(0)
  const [selected, setSelected] = useState<AdminIndexEntry | null>(null)
  const [editRating, setEditRating] = useState('')
  const [editNote, setEditNote] = useState('')
  const [saving, setSaving] = useState(false)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await loadAdminIndex()
      setEntries(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const years = useMemo(
    () => [...new Set(entries.map((e) => e.year))].sort((a, b) => b - a),
    [entries],
  )

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return entries.filter((e) => {
      if (yearFilter !== 'all' && e.year !== Number(yearFilter)) return false
      if (slotFilter !== 'all' && e.slot !== slotFilter) return false
      if (overriddenOnly && !e.isOverridden) return false
      if (q) {
        const hay = `${e.name} ${e.constructorName} ${e.optionId}`.toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [entries, yearFilter, slotFilter, search, overriddenOnly])

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const pageItems = filtered.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE)

  useEffect(() => {
    setPage(0)
  }, [yearFilter, slotFilter, search, overriddenOnly])

  useEffect(() => {
    if (page >= pageCount) setPage(Math.max(0, pageCount - 1))
  }, [page, pageCount])

  const selectEntry = (entry: AdminIndexEntry) => {
    setSelected(entry)
    setEditRating(String(entry.rating))
    setEditNote('')
    setStatus(null)
  }

  const handleSave = async () => {
    if (!selected) return
    const rating = Number(editRating)
    if (!Number.isFinite(rating) || rating < 30 || rating > 99) {
      setStatus('Rating must be between 30 and 99')
      return
    }
    setSaving(true)
    setStatus(null)
    try {
      await saveOverrideItem(selected.key, Math.round(rating), editNote || undefined)
      setStatus('Override saved. Rebuild data to apply in game packs.')
      setEntries((prev) =>
        prev.map((e) =>
          e.key === selected.key
            ? { ...e, rating: Math.round(rating), isOverridden: true }
            : e,
        ),
      )
      setSelected((prev) =>
        prev ? { ...prev, rating: Math.round(rating), isOverridden: true } : prev,
      )
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const handleClearOverride = async () => {
    if (!selected) return
    setSaving(true)
    setStatus(null)
    try {
      await deleteOverrideItem(selected.key)
      setStatus('Override removed. Rebuild data to restore computed rating.')
      setEditRating(String(selected.computedRating))
      setEntries((prev) =>
        prev.map((e) =>
          e.key === selected.key
            ? { ...e, rating: e.computedRating, isOverridden: false }
            : e,
        ),
      )
      setSelected((prev) =>
        prev
          ? { ...prev, rating: prev.computedRating, isOverridden: false }
          : prev,
      )
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Clear failed')
    } finally {
      setSaving(false)
    }
  }

  const handleRebuild = async () => {
    setRebuilding(true)
    setStatus(null)
    try {
      await rebuildData()
      await refresh()
      setStatus('Data rebuilt successfully.')
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Rebuild failed')
    } finally {
      setRebuilding(false)
    }
  }

  if (!devUnlocked) return <Navigate to="/" replace />

  return (
    <div className="min-h-screen px-4 py-8 max-w-7xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <Link to="/" className="text-sm text-white/40 hover:text-white">
            ← Home
          </Link>
          <h1 className="text-2xl font-bold mt-2">Ratings Admin</h1>
          <p className="text-sm text-white/50 mt-1">
            Explore computed ratings, edit overrides, then rebuild data.
          </p>
        </div>
        <button
          type="button"
          onClick={handleRebuild}
          disabled={rebuilding}
          className="px-5 py-2.5 rounded-full bg-f1-red font-semibold text-sm disabled:opacity-50"
        >
          {rebuilding ? 'Rebuilding…' : 'Rebuild data'}
        </button>
      </div>

      {error && (
        <p className="mb-4 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </p>
      )}
      {status && (
        <p className="mb-4 rounded-lg border border-f1-accent/40 bg-f1-accent/10 px-4 py-3 text-sm text-f1-accent">
          {status}
        </p>
      )}

      <div className="grid lg:grid-cols-[1fr_320px] gap-6">
        <div className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <select
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              className="rounded-lg bg-f1-card border border-white/20 px-3 py-2 text-sm"
            >
              <option value="all">All years</option>
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
            <select
              value={slotFilter}
              onChange={(e) => setSlotFilter(e.target.value as AdminSlot | 'all')}
              className="rounded-lg bg-f1-card border border-white/20 px-3 py-2 text-sm"
            >
              <option value="all">All components</option>
              {(Object.keys(ADMIN_SLOT_LABELS) as AdminSlot[]).map((slot) => (
                <option key={slot} value={slot}>
                  {ADMIN_SLOT_LABELS[slot]}
                </option>
              ))}
            </select>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name or team…"
              className="flex-1 min-w-[200px] rounded-lg bg-f1-card border border-white/20 px-3 py-2 text-sm"
            />
            <label className="flex items-center gap-2 text-sm text-white/60">
              <input
                type="checkbox"
                checked={overriddenOnly}
                onChange={(e) => setOverriddenOnly(e.target.checked)}
              />
              Overridden only
            </label>
          </div>

          <p className="text-xs text-white/40">
            {loading ? 'Loading…' : `${filtered.length} entries`}
          </p>

          <div className="rounded-xl border border-white/10 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-f1-card text-white/50 text-xs uppercase">
                <tr>
                  <th className="text-left px-3 py-2">Year</th>
                  <th className="text-left px-3 py-2">Team</th>
                  <th className="text-left px-3 py-2">Name</th>
                  <th className="text-right px-3 py-2">OVR</th>
                  <th className="text-right px-3 py-2">Δ TM</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((entry) => (
                  <tr
                    key={entry.key}
                    onClick={() => selectEntry(entry)}
                    className={`border-t border-white/5 cursor-pointer hover:bg-white/5 ${
                      selected?.key === entry.key ? 'bg-f1-accent/10' : ''
                    }`}
                  >
                    <td className="px-3 py-2">{entry.year}</td>
                    <td className="px-3 py-2 text-white/70">{entry.constructorName}</td>
                    <td className="px-3 py-2">
                      <span className="font-medium">{entry.name}</span>
                      {entry.isOverridden && (
                        <span className="ml-2 text-xs text-amber-400">edited</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-right font-bold tabular-nums">
                      {entry.rating}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums text-white/50">
                      {entry.teammateDelta !== null
                        ? entry.teammateDelta > 0
                          ? `+${Math.round(entry.teammateDelta)}`
                          : Math.round(entry.teammateDelta)
                        : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between text-sm">
            <button
              type="button"
              disabled={page === 0}
              onClick={() => setPage((p) => p - 1)}
              className="px-3 py-1 rounded border border-white/20 disabled:opacity-40"
            >
              Previous
            </button>
            <span className="text-white/50">
              Page {page + 1} of {pageCount}
            </span>
            <button
              type="button"
              disabled={page >= pageCount - 1}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1 rounded border border-white/20 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>

        <aside className="rounded-xl border border-white/10 bg-f1-card p-4 h-fit sticky top-6">
          {selected ? (
            <div className="space-y-4">
              <div>
                <p className="text-xs text-white/40 uppercase">Selected</p>
                <h2 className="font-bold text-lg mt-1">{selected.name}</h2>
                <p className="text-sm text-white/50">
                  {selected.constructorName} · {selected.year}
                </p>
                <p className="text-xs text-white/40 mt-1">
                  {ADMIN_SLOT_LABELS[selected.slot]} · {selected.optionId}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="rounded-lg bg-white/5 p-2">
                  <p className="text-xs text-white/40">Current OVR</p>
                  <p className="text-xl font-bold">{selected.rating}</p>
                </div>
                <div className="rounded-lg bg-white/5 p-2">
                  <p className="text-xs text-white/40">Computed</p>
                  <p className="text-xl font-bold">{selected.computedRating}</p>
                </div>
                {selected.seasonForm !== null && (
                  <div className="rounded-lg bg-white/5 p-2">
                    <p className="text-xs text-white/40">Season form</p>
                    <p className="text-lg font-semibold">{selected.seasonForm}</p>
                  </div>
                )}
                {selected.computedRating !== selected.seasonForm && (
                  <div className="rounded-lg bg-white/5 p-2 col-span-2">
                    <p className="text-xs text-white/40">Career-aware blend (rookies weight year more)</p>
                    <p className="text-sm text-white/60">
                      Blended from season results and career pedigree
                    </p>
                  </div>
                )}
                {selected.teammateDelta !== null && (
                  <div className="rounded-lg bg-white/5 p-2">
                    <p className="text-xs text-white/40">vs teammate</p>
                    <p className="text-lg font-semibold">
                      {selected.teammateDelta > 0 ? '+' : ''}
                      {Math.round(selected.teammateDelta)} pts
                    </p>
                  </div>
                )}
              </div>

              {selected.teammateNames.length > 0 && (
                <p className="text-xs text-white/50">
                  Compared to: {selected.teammateNames.join(', ')}
                </p>
              )}

              {selected.points !== null && (
                <p className="text-xs text-white/50">Season points: {selected.points}</p>
              )}

              <div>
                <label className="text-xs text-white/40 uppercase">Override rating</label>
                <input
                  type="number"
                  min={30}
                  max={99}
                  value={editRating}
                  onChange={(e) => setEditRating(e.target.value)}
                  className="mt-1 w-full rounded-lg bg-black/30 border border-white/20 px-3 py-2"
                />
              </div>

              <div>
                <label className="text-xs text-white/40 uppercase">Note (optional)</label>
                <input
                  type="text"
                  value={editNote}
                  onChange={(e) => setEditNote(e.target.value)}
                  placeholder="Why this change?"
                  className="mt-1 w-full rounded-lg bg-black/30 border border-white/20 px-3 py-2 text-sm"
                />
              </div>

              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full py-2.5 rounded-lg bg-f1-red font-semibold text-sm disabled:opacity-50"
                >
                  {saving ? 'Saving…' : 'Save override'}
                </button>
                {selected.isOverridden && (
                  <button
                    type="button"
                    onClick={handleClearOverride}
                    disabled={saving}
                    className="w-full py-2.5 rounded-lg border border-white/20 text-sm disabled:opacity-50"
                  >
                    Clear override
                  </button>
                )}
              </div>
            </div>
          ) : (
            <p className="text-sm text-white/50">Select a row to inspect and edit.</p>
          )}
        </aside>
      </div>
    </div>
  )
}
