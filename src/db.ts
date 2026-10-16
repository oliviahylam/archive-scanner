import { createStore, get, set } from 'idb-keyval'
import { generateCitizenNumber, generateObjNumber } from './archive-rules'
import { SEED_LOTS } from './seed'
import type { Lot } from './types'

/**
 * Where lots live.
 *
 * Shared mode: once the Vercel stores are connected, /api/lots holds every
 * visitor's lots, so all phones see the same Archive. The last copy is kept on
 * the phone, so the Inventory still opens if the wifi drops.
 *
 * Local mode: until then (or with `npm run dev` offline), lots are saved on
 * each phone only (IndexedDB), as before.
 *
 * Seed lots always come from src/seed.ts.
 */
const store = createStore('the-archive', 'lots')
const LOCAL_LOTS = 'visitor-lots'
const SHARED_CACHE = 'shared-cache'
/** Seed lots that have been inherited on this device. */
const SEED_STATE = 'seed-state'

type Mode = 'shared' | 'local'
let mode: Mode | null = null
let lastList: Lot[] | null = null

async function localLots(): Promise<Lot[]> {
  return (await get<Lot[]>(LOCAL_LOTS, store)) ?? []
}

async function fetchWithTimeout(input: string, init: RequestInit = {}, ms = 10000) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), ms)
  try {
    return await fetch(input, { ...init, signal: controller.signal })
  } finally {
    clearTimeout(timer)
  }
}

/** Shared lots, or null when the shared Archive isn't set up. Throws when offline. */
async function fetchShared(): Promise<Lot[] | null> {
  const res = await fetchWithTimeout('/api/lots', { cache: 'no-store' })
  if (res.status === 503 || res.status === 404) return null
  const type = res.headers.get('content-type') ?? ''
  if (!res.ok || !type.includes('application/json')) throw new Error(`Archive unavailable (${res.status})`)
  return res.json()
}

async function seeds(): Promise<Lot[]> {
  const inherited = new Set((await get<string[]>(SEED_STATE, store)) ?? [])
  return SEED_LOTS.map((l) => ({ ...l, inherited: inherited.has(l.id) }))
}

const newestFirst = (lots: Lot[]) => [...lots].sort((a, b) => b.createdAt.localeCompare(a.createdAt))

/** Every lot: newest visitor lots first, then the seed lots. */
export async function listLots(): Promise<Lot[]> {
  let visitors: Lot[]
  try {
    const shared = await fetchShared()
    if (shared) {
      mode = 'shared'
      visitors = shared
      set(SHARED_CACHE, shared, store).catch(() => {})
    } else {
      mode = 'local'
      visitors = await localLots()
    }
  } catch {
    // Offline or the server is busy: show the last copy we have.
    visitors = mode === 'local' ? await localLots() : ((await get<Lot[]>(SHARED_CACHE, store)) ?? [])
  }
  lastList = [...newestFirst(visitors), ...(await seeds())]
  return lastList
}

export async function getLot(id: string): Promise<Lot | undefined> {
  return lastList?.find((l) => l.id === id) ?? (await listLots()).find((l) => l.id === id)
}

/** Object and citizen numbers already in the Archive, so new ones never repeat. */
export async function takenNumbers(): Promise<{ obj: Set<string>; citizen: Set<string> }> {
  const lots = lastList ?? (await listLots())
  return {
    obj: new Set(lots.map((l) => l.objNumber)),
    citizen: new Set(lots.map((l) => l.citizenNumber)),
  }
}

export type Draft = Pick<Lot, 'name' | 'objNumber' | 'citizenNumber' | 'lastSeen' | 'description'>

/**
 * Add a lot to the Archive and return it as saved. In shared mode the server
 * may change the numbers if someone else took them a moment earlier.
 */
export async function addLot(draft: Draft, image: Blob): Promise<Lot> {
  if (mode === null) await listLots().catch(() => {})

  if (mode !== 'local') {
    const form = new FormData()
    form.append('lot', JSON.stringify(draft))
    form.append('image', image, 'cutout.png')
    const res = await fetchWithTimeout('/api/lots', { method: 'POST', body: form }, 30000)
    if (res.ok) {
      const lot: Lot = await res.json()
      lastList = [lot, ...(lastList ?? [])]
      return lot
    }
    if (res.status !== 503 && res.status !== 404) throw new Error(`Could not add the lot (${res.status})`)
    mode = 'local'
  }

  const taken = await takenNumbers()
  const lot: Lot = {
    ...draft,
    id: crypto.randomUUID?.() ?? `lot-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`,
    objNumber: taken.obj.has(draft.objNumber) ? generateObjNumber(taken.obj) : draft.objNumber,
    citizenNumber: taken.citizen.has(draft.citizenNumber)
      ? generateCitizenNumber(taken.citizen)
      : draft.citizenNumber,
    images: [image],
    createdAt: new Date().toISOString(),
    inherited: false,
  }
  await set(LOCAL_LOTS, [...(await localLots()), lot], store)
  lastList = [lot, ...(lastList ?? [])]
  return lot
}
