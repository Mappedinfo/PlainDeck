import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { BRAND_THEME_COLOR } from './packages/plaindeck/src/core/brand'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const base = env.VITE_BASE_PATH || '/PlainDeck/'
  return {
    base,
    plugins: [
      react(),
      VitePWA({
        registerType: 'prompt',
        includeAssets: ['plaindeck-mark.svg'],
        manifest: {
          name: 'PlainDeck',
          short_name: 'PlainDeck',
          description: 'Local-first, Git-native visual slide editor',
          theme_color: BRAND_THEME_COLOR,
          background_color: BRAND_THEME_COLOR,
          display: 'standalone',
          start_url: base,
          scope: base,
          icons: [{ src: 'plaindeck-mark.svg', sizes: 'any', type: 'image/svg+xml' }]
        },
        workbox: { globPatterns: ['**/*.{js,css,html,svg,woff2}'] }
      })
    ]
  }
})
