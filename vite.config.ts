import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['robots.txt', 'sitemap.xml', 'og.svg', 'icons/icon-192.png', 'icons/icon-512.png'],
      manifest: {
        name: 'Bookleaf',
        short_name: 'Bookleaf',
        description: 'Turn a quote into a page from a book.',
        theme_color: '#0b0c10',
        background_color: '#0b0c10',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' }
        ]
      }
    }),
  ],
})
