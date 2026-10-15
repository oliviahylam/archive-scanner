import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'
import { VitePWA } from 'vite-plugin-pwa'

// `npm run phone` starts the dev server with a local HTTPS certificate,
// because phone browsers only allow the camera on secure (https) pages.
export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    mode === 'phone' && basicSsl(),
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
      },
    }),
  ],
}))
