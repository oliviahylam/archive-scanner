/**
 * Vercel function at /api/lots: the shared Archive.
 *
 * Needs two stores connected to the project in Vercel (Storage tab):
 *  - Blob (public) for photos            → sets BLOB_READ_WRITE_TOKEN
 *  - Upstash for Redis for lot records    → sets KV_REST_API_URL / KV_REST_API_TOKEN
 *    (any prefix works, e.g. STORAGE_REST_API_URL)
 * Without them it answers "not-configured" and the app keeps lots on each phone instead.
 */
import { put } from '@vercel/blob'
import { Redis } from '@upstash/redis'
import { handleAdd, handleList, notConfigured, type ArchiveStore } from '../server/archive-api.js'
import type { Lot } from '../src/types.js'

const LOTS_KEY = 'archive:lots'

/**
 * Upstash settings are named <PREFIX>_REST_API_URL / _TOKEN, where the prefix is
 * chosen when connecting the store (KV by default). Accept any prefix.
 */
function env(suffix: string): string | undefined {
  if (process.env[`KV_${suffix}`]) return process.env[`KV_${suffix}`]
  const key = Object.keys(process.env).find((k) => k.endsWith(`_${suffix}`) && !k.includes('READ_ONLY'))
  return key ? process.env[key] : undefined
}

/** Upstash REST address and token, from REST settings or from a rediss://default:TOKEN@host URL. */
function redisSettings(): { url: string; token: string } | null {
  const url = env('REST_API_URL') ?? process.env.UPSTASH_REDIS_REST_URL
  const token = env('REST_API_TOKEN') ?? process.env.UPSTASH_REDIS_REST_TOKEN
  if (url && token) return { url, token }
  const redisUrl = Object.values(process.env).find((v) => v && /^rediss?:\/\/.*upstash\.io/.test(v))
  if (!redisUrl) return null
  const parsed = new URL(redisUrl)
  return parsed.password ? { url: `https://${parsed.hostname}`, token: decodeURIComponent(parsed.password) } : null
}

/** What's missing, for the status page. Names only, never values. */
function missing(): string[] {
  return [
    !process.env.BLOB_READ_WRITE_TOKEN && 'photos (Blob store)',
    !redisSettings() && 'lot details (Upstash for Redis)',
  ].filter((m): m is string => Boolean(m))
}

function store(): ArchiveStore | null {
  const settings = redisSettings()
  if (!settings || !process.env.BLOB_READ_WRITE_TOKEN) return null
  const redis = new Redis(settings)
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
  if (!s) return notConfigured(missing())
  try {
    return await handleList(s)
  } catch (err) {
    console.error(err)
    return serverError()
  }
}

export async function POST(request: Request) {
  const s = store()
  if (!s) return notConfigured(missing())
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
