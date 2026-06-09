import type { AdminIndexEntry, RatingOverridesFile } from '../types/admin'
import { publicUrl } from '../lib/publicUrl'

export async function loadAdminIndex(): Promise<AdminIndexEntry[]> {
  const res = await fetch(publicUrl('data/admin-ratings-index.json'))
  if (!res.ok) throw new Error('Failed to load admin index')
  return res.json()
}

export async function loadOverrides(): Promise<RatingOverridesFile> {
  const res = await fetch('/api/admin/overrides')
  if (!res.ok) throw new Error('Failed to load overrides')
  return res.json()
}

export async function saveOverrideItem(
  key: string,
  rating: number,
  note?: string,
): Promise<void> {
  const res = await fetch('/api/admin/overrides/item', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key, rating, note }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error ?? 'Failed to save override')
  }
}

export async function deleteOverrideItem(key: string): Promise<void> {
  const res = await fetch(`/api/admin/overrides/item/${encodeURIComponent(key)}`, {
    method: 'DELETE',
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error ?? 'Failed to delete override')
  }
}

export async function rebuildData(): Promise<void> {
  const res = await fetch('/api/admin/rebuild', { method: 'POST' })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error ?? 'Failed to rebuild data')
  }
}
