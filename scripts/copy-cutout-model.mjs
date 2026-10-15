// Copies the background-removal model and engine from node_modules into
// public/cutout/, so the app serves them itself (no third-party server needed).
// Runs automatically before `npm run dev`, `npm run phone` and `npm run build`.
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const src = join(root, 'node_modules/@imgly/background-removal-data/dist')
const out = join(root, 'public/cutout')

const KEEP = [
  '/models/small',
  '/onnxruntime-web/ort-wasm.wasm',
  '/onnxruntime-web/ort-wasm-simd.wasm',
  '/onnxruntime-web/ort-wasm-threaded.wasm',
  '/onnxruntime-web/ort-wasm-simd-threaded.wasm',
]

const all = JSON.parse(readFileSync(join(src, 'resources.json'), 'utf8'))
const resources = Object.fromEntries(KEEP.map((k) => [k, all[k]]))
const marker = join(out, 'resources.json')
const wanted = JSON.stringify(resources)

if (existsSync(marker) && readFileSync(marker, 'utf8') === wanted) {
  console.log('cutout model: already in place')
} else {
  rmSync(out, { recursive: true, force: true })
  mkdirSync(out, { recursive: true })
  for (const entry of Object.values(resources)) {
    for (const chunk of entry.chunks) cpSync(join(src, chunk.hash), join(out, chunk.hash))
  }
  writeFileSync(marker, wanted)
  console.log(`cutout model: copied ${KEEP.length} resources to public/cutout/`)
}
