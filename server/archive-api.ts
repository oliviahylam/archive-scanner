/**
 * The shared Archive: the server side of "everyone sees every lot".
 * Used by api/lots.ts on Vercel, and by an in-memory stand-in during local development.
 */
import {
  CITIZEN_NUMBER,
  LAST_SEEN,
  NAME_MAX_LENGTH,
  OBJECT_NUMBER,
  generateCitizenNumber,
  generateLastSeen,
  generateObjNumber,
} from '../src/archive-rules.js'
import { SEED_LOTS } from '../src/seed.js'
import type { Lot } from '../src/types.js'

export const DESCRIPTION_MAX_LENGTH = 140
const IMAGE_MAX_BYTES = 4 * 1024 * 1024
const IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp']

/** Where records and photos are kept. */
export interface ArchiveStore {
  listLots(): Promise<Lot[]>
  saveLot(lot: Lot): Promise<void>
  saveImage(id: string, image: Blob): Promise<string>
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  })

export const notConfigured = () => json({ error: 'not-configured' }, 503)

/** GET: every visitor lot, newest first. */
export async function handleList(store: ArchiveStore): Promise<Response> {
  const lots = await store.listLots()
  lots.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  return json(lots)
}

const pattern = {
  obj: new RegExp(`^\\d{${OBJECT_NUMBER.digits}}$`),
  citizen: new RegExp(
    '^' + CITIZEN_NUMBER.groups.map((g) => `\\d{${g.digits}}`).join(CITIZEN_NUMBER.separator) + '$',
  ),
  lastSeen: new RegExp(`^\\d{4}\\${LAST_SEEN.separator}\\d{2}\\${LAST_SEEN.separator}\\d{2}$`),
}

/**
 * POST (multipart form): `lot` = JSON with name, objNumber, citizenNumber, lastSeen,
 * description; `image` = the cutout. Numbers that are malformed or already taken
 * are replaced, so every lot stays unique.
 */
export async function handleAdd(request: Request, store: ArchiveStore): Promise<Response> {
  let form: FormData
  try {
    form = await request.formData()
  } catch {
    return json({ error: 'bad-request' }, 400)
  }
  const image = form.get('image')
  let draft: Partial<Lot>
  try {
    draft = JSON.parse(String(form.get('lot') ?? ''))
  } catch {
    return json({ error: 'bad-request' }, 400)
  }

  const name = String(draft.name ?? '').trim().slice(0, NAME_MAX_LENGTH)
  if (!name) return json({ error: 'name-required' }, 400)
  if (!(image instanceof Blob) || !IMAGE_TYPES.includes(image.type) || image.size > IMAGE_MAX_BYTES) {
    return json({ error: 'bad-image' }, 400)
  }

  const existing = [...(await store.listLots()), ...SEED_LOTS]
  const takenObj = new Set(existing.map((l) => l.objNumber))
  const takenCitizen = new Set(existing.map((l) => l.citizenNumber))
  const objNumber =
    typeof draft.objNumber === 'string' && pattern.obj.test(draft.objNumber) && !takenObj.has(draft.objNumber)
      ? draft.objNumber
      : generateObjNumber(takenObj)
  const citizenNumber =
    typeof draft.citizenNumber === 'string' &&
    pattern.citizen.test(draft.citizenNumber) &&
    !takenCitizen.has(draft.citizenNumber)
      ? draft.citizenNumber
      : generateCitizenNumber(takenCitizen)
  const lastSeen =
    typeof draft.lastSeen === 'string' && pattern.lastSeen.test(draft.lastSeen)
      ? draft.lastSeen
      : generateLastSeen()

  const id = crypto.randomUUID()
  const imageUrl = await store.saveImage(id, image)
  const lot: Lot = {
    id,
    objNumber,
    name,
    citizenNumber,
    lastSeen,
    description: String(draft.description ?? '').trim().slice(0, DESCRIPTION_MAX_LENGTH),
    images: [imageUrl],
    createdAt: new Date().toISOString(),
    inherited: false,
  }
  await store.saveLot(lot)
  return json(lot, 201)
}

/** Stand-in store for `npm run dev`: lots live in memory until the dev server restarts. */
export function memoryStore(): ArchiveStore & { image(id: string): Blob | undefined } {
  const lots = new Map<string, Lot>()
  const images = new Map<string, Blob>()
  return {
    async listLots() {
      return [...lots.values()]
    },
    async saveLot(lot) {
      lots.set(lot.id, lot)
    },
    async saveImage(id, image) {
      images.set(id, image)
      return `/api/dev-images/${id}`
    },
    image: (id) => images.get(id),
  }
}
