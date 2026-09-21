import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { defineConfig } from 'vite'

export default defineConfig({
  base: '/Justify/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/icon-192.png', 'icons/icon-512.png'],
      manifest: {
        name: 'Justify — Offline Music Player',
        short_name: 'Justify',
        description: 'PWA offline music player untuk file audio lokal.',
        theme_color: '#7c3aed',
        background_color: '#09090b',
        display: 'standalone',
        orientation: 'any',
        scope: '/Justify/',
        start_url: '/Justify/',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,woff2,png,svg}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/images\.unsplash\.com\/.*/i,
            handler: 'CacheFirst',
            options: { cacheName: 'unsplash-covers', expiration: { maxEntries: 60, maxAgeSeconds: 2592000 } }
          }
        ]
      }
    })
  ]
})