import type { Config } from '@imgly/background-removal'
import { log } from './log'

/**
 * Background removal, on the phone, with @imgly/background-removal.
 * The model (~44 MB) and engine (~10 MB) are served by this app from /cutout/
 * (copied there by scripts/copy-cutout-model.mjs). Phones download them once,
 * then keep them for offline use (see vite.config.ts).
 */
const lib = () => import('@imgly/background-removal')
const cutoutBase = () => new URL('/cutout/', location.href)

/** The files a phone needs: the model, and the engine build every current phone can run. */
const NEEDED = ['/models/small', '/onnxruntime-web/ort-wasm-simd.wasm']

// After a failure the library would keep handing back the same failed start-up,
// so each new attempt gets a different number (the library ignores the field itself).
let attempt = 0
const config = (): Config =>
  ({
    publicPath: cutoutBase().href,
    model: 'small', // quickest download and fastest on mid-range phones
    output: { format: 'image/png' },
    attempt,
  }) as Config

// ---- Preparing the scanner: one shared download ----------------------------

type Progress = (fraction: number) => void
let preparing: Promise<void> | null = null
let prepared = 0
const listeners = new Set<Progress>()

/**
 * Download the model and engine (once), so scanning can start straight away.
 * Starts quietly when the Inventory opens; a scan waits for the same download
 * instead of starting a second one.
 */
export function prepareScanner(): Promise<void> {
  if (preparing) return preparing
  preparing = (async () => {
    log('scanner: preparing')
    const base = cutoutBase()
    const res = await fetch(new URL('resources.json', base))
    if (!res.ok) throw new Error(`resources.json ${res.status}`)
    const resources = await res.json()
    const chunks: { hash: string; offsets: [number, number] }[] = NEEDED.flatMap(
      (key) => resources[key]?.chunks ?? [],
    )
    const total = chunks.reduce((sum, c) => sum + c.offsets[1] - c.offsets[0], 0)
    let loaded = 0
    const queue = [...chunks]
    // Three downloads at a time, counting bytes as they arrive, so progress moves smoothly.
    const worker = async () => {
      for (let chunk = queue.shift(); chunk; chunk = queue.shift()) {
        const r = await fetch(new URL(chunk.hash, base))
        if (!r.ok || !r.body) throw new Error(`download ${r.status}`)
        const reader = r.body.getReader()
        for (;;) {
          const { done, value } = await reader.read()
          if (done) break
          loaded += value.byteLength
          prepared = Math.min(1, loaded / total)
          listeners.forEach((l) => l(prepared))
        }
      }
    }
    await Promise.all([worker(), worker(), worker()])
    prepared = 1
    log('scanner: ready')
  })().catch((err) => {
    log(`scanner: preparing failed (${err instanceof Error ? err.message : String(err)})`)
    preparing = null // try again next time
    throw err
  })
  return preparing
}

/** Called when the Inventory opens. Skipped when the phone asks to save data. */
export function preloadCutoutModel() {
  const nav = navigator as Navigator & { connection?: { saveData?: boolean } }
  if (nav.connection?.saveData) return
  prepareScanner().catch(() => {})
}

/** Wait for the download, but give up if no data arrives for 60 seconds. */
function waitForDownload(onProgress?: Progress): Promise<void> {
  return new Promise((resolve, reject) => {
    let idle = setTimeout(() => reject(new Error('download stalled')), 60_000)
    const listener: Progress = (fraction) => {
      clearTimeout(idle)
      idle = setTimeout(() => reject(new Error('download stalled')), 60_000)
      onProgress?.(fraction)
    }
    listeners.add(listener)
    onProgress?.(prepared)
    prepareScanner()
      .then(resolve, reject)
      .finally(() => {
        clearTimeout(idle)
        listeners.delete(listener)
      })
  })
}

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`${label} timed out`)), ms)
    promise.then(
      (v) => (clearTimeout(timer), resolve(v)),
      (e) => (clearTimeout(timer), reject(e)),
    )
  })
}

export interface CutoutResult {
  image: Blob
  /** false when the background could not be removed and the photo was kept, cropped to a circle. */
  removed: boolean
}

/** Remove the background, then trim the empty space around the object. */
export async function makeCutout(photo: Blob, onProgress?: Progress): Promise<CutoutResult> {
  try {
    await waitForDownload(onProgress)
    onProgress?.(1)
    const { removeBackground } = await lib()
    const png = await withTimeout(removeBackground(photo, config()), 180_000, 'cut-out')
    const trimmed = await trimTransparent(png)
    if (trimmed) return { image: trimmed, removed: true }
  } catch (err) {
    log(`cutout failed (${err instanceof Error ? err.message : String(err)}), keeping the photo`)
    attempt++
  }
  return { image: await circleCrop(photo), removed: false }
}

// ---------------------------------------------------------------------------

const MAX_SIDE = 1200

function loadImage(blob: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Could not read the photo.'))
    }
    img.src = url
  })
}

function toBlob(canvas: HTMLCanvasElement, type = 'image/png', quality?: number): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Could not save the photo.'))), type, quality),
  )
}

function canvas2d(w: number, h: number) {
  const c = document.createElement('canvas')
  c.width = Math.max(1, Math.round(w))
  c.height = Math.max(1, Math.round(h))
  return { c, ctx: c.getContext('2d')! }
}

/**
 * Crop to the object's outline plus a little margin.
 * Returns null when almost nothing was kept (no clear object found).
 */
async function trimTransparent(png: Blob): Promise<Blob | null> {
  const img = await loadImage(png)
  const { c, ctx } = canvas2d(img.naturalWidth, img.naturalHeight)
  ctx.drawImage(img, 0, 0)
  const imageData = ctx.getImageData(0, 0, c.width, c.height)
  const { data, width, height } = imageData
  removeSpecks(data, width, height)
  ctx.putImageData(imageData, 0, 0)

  let minX = width, minY = height, maxX = -1, maxY = -1, kept = 0
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (data[(y * width + x) * 4 + 3] > 24) {
        kept++
        if (x < minX) minX = x
        if (x > maxX) maxX = x
        if (y < minY) minY = y
        if (y > maxY) maxY = y
      }
    }
  }
  if (maxX < 0 || kept < width * height * 0.005) return null

  const pad = Math.round(Math.max(maxX - minX, maxY - minY) * 0.04)
  const sx = Math.max(0, minX - pad)
  const sy = Math.max(0, minY - pad)
  const sw = Math.min(width, maxX + pad + 1) - sx
  const sh = Math.min(height, maxY + pad + 1) - sy
  const scale = Math.min(1, MAX_SIDE / Math.max(sw, sh))
  const out = canvas2d(sw * scale, sh * scale)
  out.ctx.drawImage(c, sx, sy, sw, sh, 0, 0, out.c.width, out.c.height)
  return toBlob(out.c)
}

/**
 * Keep the object, drop stray specks of background (textured tables, carpet).
 * Works on a coarse grid: finds connected areas and keeps the biggest one,
 * plus any other area at least 15% of its size (e.g. the second earbud).
 */
function removeSpecks(data: Uint8ClampedArray, width: number, height: number) {
  const cell = Math.max(1, Math.ceil(Math.max(width, height) / 200))
  const gw = Math.ceil(width / cell)
  const gh = Math.ceil(height / cell)
  const solid = new Uint32Array(gw * gh)
  for (let y = 0; y < height; y++) {
    const row = ((y / cell) | 0) * gw
    for (let x = 0; x < width; x++) {
      if (data[(y * width + x) * 4 + 3] > 128) solid[row + ((x / cell) | 0)]++
    }
  }
  const on = new Uint8Array(gw * gh)
  const minSolid = (cell * cell) / 4
  for (let i = 0; i < on.length; i++) on[i] = solid[i] >= minSolid ? 1 : 0

  // Label connected areas.
  const label = new Int32Array(gw * gh).fill(-1)
  const sizes: number[] = []
  const stack: number[] = []
  for (let start = 0; start < on.length; start++) {
    if (!on[start] || label[start] !== -1) continue
    const id = sizes.length
    let size = 0
    label[start] = id
    stack.push(start)
    while (stack.length) {
      const i = stack.pop()!
      size++
      const x = i % gw
      const y = (i / gw) | 0
      const next = [x > 0 ? i - 1 : -1, x < gw - 1 ? i + 1 : -1, y > 0 ? i - gw : -1, y < gh - 1 ? i + gw : -1]
      for (const n of next) {
        if (n >= 0 && on[n] && label[n] === -1) {
          label[n] = id
          stack.push(n)
        }
      }
    }
    sizes.push(size)
  }
  if (!sizes.length) return
  const largest = Math.max(...sizes)

  // Kept cells, grown by one cell so soft edges survive.
  const keep = new Uint8Array(gw * gh)
  for (let i = 0; i < label.length; i++) {
    if (label[i] < 0 || sizes[label[i]] < largest * 0.15) continue
    const x = i % gw
    const y = (i / gw) | 0
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const nx = x + dx
        const ny = y + dy
        if (nx >= 0 && ny >= 0 && nx < gw && ny < gh) keep[ny * gw + nx] = 1
      }
    }
  }

  for (let y = 0; y < height; y++) {
    const row = ((y / cell) | 0) * gw
    for (let x = 0; x < width; x++) {
      const a = (y * width + x) * 4 + 3
      if (!keep[row + ((x / cell) | 0)] || data[a] < 40) data[a] = 0
    }
  }
}

/** Fallback: keep the photo, cropped to a circle like the rings. */
async function circleCrop(photo: Blob): Promise<Blob> {
  const img = await loadImage(photo)
  const side = Math.min(img.naturalWidth, img.naturalHeight, MAX_SIDE)
  const src = Math.min(img.naturalWidth, img.naturalHeight)
  const { c, ctx } = canvas2d(side, side)
  ctx.beginPath()
  ctx.arc(side / 2, side / 2, side / 2, 0, Math.PI * 2)
  ctx.clip()
  ctx.drawImage(
    img,
    (img.naturalWidth - src) / 2,
    (img.naturalHeight - src) / 2,
    src,
    src,
    0,
    0,
    side,
    side,
  )
  return toBlob(c)
}

/**
 * Grab the part of the live camera picture that sits around the rings.
 * `ringFraction` is the outer ring's diameter as a share of the screen width.
 */
export function captureFrame(video: HTMLVideoElement, ringFraction = 0.79): Promise<Blob> {
  const vw = video.videoWidth
  const vh = video.videoHeight
  const ew = video.clientWidth
  const eh = video.clientHeight
  // The video fills the screen (object-fit: cover), so part of it is off-screen.
  const scale = Math.max(ew / vw, eh / vh)
  const offX = (ew - vw * scale) / 2
  const offY = (eh - vh * scale) / 2
  // A square a bit larger than the outer ring, centred on the crosshair.
  const sideOnScreen = Math.min(ew * ringFraction * 1.2, ew, eh)
  const side = sideOnScreen / scale
  const sx = (ew / 2 - offX) / scale - side / 2
  const sy = (eh / 2 - offY) / scale - side / 2
  const outSide = Math.min(MAX_SIDE, Math.round(side))
  const { c, ctx } = canvas2d(outSide, outSide)
  ctx.drawImage(video, sx, sy, side, side, 0, 0, outSide, outSide)
  return toBlob(c, 'image/jpeg', 0.92)
}

/** A photo chosen from the library: centre-crop to a square. */
export async function squarePhoto(file: Blob): Promise<Blob> {
  const img = await loadImage(file)
  const src = Math.min(img.naturalWidth, img.naturalHeight)
  const side = Math.min(src, MAX_SIDE)
  const { c, ctx } = canvas2d(side, side)
  ctx.drawImage(img, (img.naturalWidth - src) / 2, (img.naturalHeight - src) / 2, src, src, 0, 0, side, side)
  return toBlob(c, 'image/jpeg', 0.92)
}

/** Keep uploads comfortably under the server's 4 MB limit. */
export async function fitForUpload(image: Blob, maxBytes = 3.5 * 1024 * 1024): Promise<Blob> {
  let out = image
  for (let side = 900; out.size > maxBytes && side >= 300; side -= 200) {
    const img = await loadImage(image)
    const scale = side / Math.max(img.naturalWidth, img.naturalHeight)
    const { c, ctx } = canvas2d(img.naturalWidth * scale, img.naturalHeight * scale)
    ctx.drawImage(img, 0, 0, c.width, c.height)
    out = await toBlob(c)
  }
  return out
}
