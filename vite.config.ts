import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/*.png'],
      manifest: {
        name: 'Pulse',
        short_name: 'Pulse',
        description: 'Custom social feed aggregator',
        start_url: '/',
        display: 'standalone',
        background_color: '#0f172a',
        theme_color: '#f97316',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/hacker-news\.firebaseio\.com/,
            handler: 'NetworkFirst',
            options: { cacheName: 'hn-api', expiration: { maxEntries: 200, maxAgeSeconds: 300 } },
          },
          {
            urlPattern: /^https:\/\/www\.reddit\.com.*\.json/,
            handler: 'NetworkFirst',
            options: { cacheName: 'reddit-api', expiration: { maxEntries: 200, maxAgeSeconds: 300 } },
          },
          {
            urlPattern: /^https:\/\/r\.jina\.ai/,
            handler: 'NetworkFirst',
            options: { cacheName: 'jina-reader', expiration: { maxEntries: 50, maxAgeSeconds: 1800 } },
          },
          {
            urlPattern: /^https:\/\/api\.openai\.com/,
            handler: 'NetworkOnly',
          },
        ],
      },
    }),
  ],
})
