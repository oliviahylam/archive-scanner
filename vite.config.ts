import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'
import { VitePWA } from 'vite-plugin-pwa'
import { devArchiveApi } from './server/dev-plugin'

// `npm run phone` starts the dev server with a local HTTPS certificate,
// because phone browsers only allow the camera on secure (https) pages.
export default defineConfig(({ mode }) => ({
  // The background-removal engine is loaded only when someone scans, so its size is fine.
  build: { chunkSizeWarningLimit: 1500 },
  // Shown on the status page (#/status), so we can tell which version a phone runs.
  define: {
    __APP_VERSION__: JSON.stringify(process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? 'local'),
  },
  plugins: [
    react(),
    mode === 'phone' && basicSsl(),
    devArchiveApi(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/*.png', 'lots/*'],
      manifest: {
        name: 'The Archive — Scanner',
        short_name: 'Archive',
        description: 'Catalogue an object into the Archive.',
        theme_color: '#000000',
        background_color: '#000000',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,woff2,png,jpg,webp,svg}'],
        // The background-removal model in /cutout/ is large, so it isn't installed
        // up front. It's kept on the phone the first time it's used (below).
        globIgnores: ['cutout/**'],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        navigateFallbackDenylist: [/^\/api\//],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.hostname.endsWith('.blob.vercel-storage.com'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'lot-photos',
              expiration: { maxEntries: 500 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/cutout/'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'cutout-model',
              expiration: { maxEntries: 100 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
}))
