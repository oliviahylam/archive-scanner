import { createStore, get, set } from 'idb-keyval'
import { SEED_LOTS } from './seed'
import type { Lot } from './types'

/**
 * Storage on this device (IndexedDB). Works offline.
 * Seed lots live in code; lots added by visitors are stored here.
 */
const store = createStore('the-archive', 'lots')
const VISITOR_LOTS = 'visitor-lots'
/** Seed lots that have been inherited on this device. */
const SEED_STATE = 'seed-state'

async function visitorLots(): Promise<Lot[]> {
  return (await get<Lot[]>(VISITOR_LOTS, store)) ?? []
}

/** Every lot, newest visitor lots first, then the seed lots. */
export async function listLots(): Promise<Lot[]> {
  const [visitors, inheritedSeeds] = await Promise.all([
    visitorLots(),
    get<string[]>(SEED_STATE, store).then((s) => new Set(s ?? [])),
  ])
  const seeds = SEED_LOTS.map((l) => ({ ...l, inherited: inheritedSeeds.has(l.id) }))
  return [...visitors.sort((a, b) => b.createdAt.localeCompare(a.createdAt)), ...seeds]
}

export async function getLot(id: string): Promise<Lot | undefined> {
  return (await listLots()).find((l) => l.id === id)
}

export async function addLot(lot: Lot): Promise<void> {
  await set(VISITOR_LOTS, [...(await visitorLots()), lot], store)
}
