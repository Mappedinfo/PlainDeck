import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/PlainDeck/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['plaindeck-mark.svg'],
      manifest: {
        name: 'PlainDeck',
        short_name: 'PlainDeck',
        description: 'Local-first, Git-native visual slide editor',
        theme_color: '#171714',
        background_color: '#171714',
        display: 'standalone',
        start_url: '/PlainDeck/',
        scope: '/PlainDeck/',
        icons: [{ src: 'plaindeck-mark.svg', sizes: 'any', type: 'image/svg+xml' }]
      },
      workbox: { globPatterns: ['**/*.{js,css,html,svg,woff2}'] }
    })
  ]
})
