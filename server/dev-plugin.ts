import { Readable } from 'node:stream'
import type { Connect, Plugin } from 'vite'
import { handleAdd, handleList, memoryStore } from './archive-api'

/**
 * Local stand-in for /api/lots during `npm run dev` / `npm run preview`,
 * so the shared Archive can be tried without Vercel. Lots reset when the server restarts.
 */
export function devArchiveApi(): Plugin {
  const store = memoryStore()
  const middleware: Connect.NextHandleFunction = async (req, res, next) => {
    const url = new URL(req.url ?? '/', 'http://localhost')
    try {
      if (url.pathname === '/api/lots') {
        const request = new Request(url, {
          method: req.method,
          headers: req.headers as Record<string, string>,
          body: req.method === 'POST' ? (Readable.toWeb(req) as ReadableStream) : undefined,
          // @ts-expect-error Node needs this for streamed request bodies
          duplex: 'half',
        })
        const response = req.method === 'POST' ? await handleAdd(request, store) : await handleList(store)
        res.statusCode = response.status
        response.headers.forEach((v, k) => res.setHeader(k, v))
        res.end(Buffer.from(await response.arrayBuffer()))
        return
      }
      const image = url.pathname.match(/^\/api\/dev-images\/([\w-]+)$/)
      if (image) {
        const blob = store.image(image[1])
        if (!blob) return next()
        res.setHeader('content-type', blob.type)
        res.end(Buffer.from(await blob.arrayBuffer()))
        return
      }
    } catch (err) {
      res.statusCode = 500
      res.end(String(err))
      return
    }
    next()
  }
  return {
    name: 'dev-archive-api',
    configureServer: (server) => void server.middlewares.use(middleware),
    configurePreviewServer: (server) => void server.middlewares.use(middleware),
  }
}
