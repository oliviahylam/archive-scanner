/**
 * Vercel function at /api/lots: the shared Archive.
 *
 * Needs two stores connected to the project in Vercel (Storage tab):
 *  - Blob (public) for photos            → sets BLOB_READ_WRITE_TOKEN
 *  - Upstash for Redis for lot records    → sets KV_REST_API_URL / KV_REST_API_TOKEN
 * Without them it answers "not-configured" and the app keeps lots on each phone instead.
 */
import { put } from '@vercel/blob'
import { Redis } from '@upstash/redis'
import { handleAdd, handleList, notConfigured, type ArchiveStore } from '../server/archive-api.js'
import type { Lot } from '../src/types.js'

const LOTS_KEY = 'archive:lots'

function store(): ArchiveStore | null {
  const url = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token || !process.env.BLOB_READ_WRITE_TOKEN) return null
  const redis = new Redis({ url, token })
  return {
    async listLots() {
      const all = await redis.hgetall<Record<string, Lot>>(LOTS_KEY)
      return Object.values(all ?? {})
    },
    async saveLot(lot) {
      await redis.hset(LOTS_KEY, { [lot.id]: lot })
    },
    async saveImage(id, image) {
      const ext = image.type === 'image/png' ? 'png' : image.type === 'image/webp' ? 'webp' : 'jpg'
      const blob = await put(`lots/${id}.${ext}`, image, {
        access: 'public',
        contentType: image.type,
        cacheControlMaxAge: 60 * 60 * 24 * 365,
      })
      return blob.url
    },
  }
}

export async function GET() {
  const s = store()
  if (!s) return notConfigured()
  try {
    return await handleList(s)
  } catch (err) {
    console.error(err)
    return serverError()
  }
}

export async function POST(request: Request) {
  const s = store()
  if (!s) return notConfigured()
  try {
    return await handleAdd(request, s)
  } catch (err) {
    console.error(err)
    return serverError()
  }
}

const serverError = () =>
  new Response(JSON.stringify({ error: 'server-error' }), {
    status: 500,
    headers: { 'content-type': 'application/json' },
  })
