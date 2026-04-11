import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// For GitHub Pages the app lives at:
// https://YOUR_USERNAME.github.io/chekku-billing/
// The base path must match your repository name exactly.
// Change 'chekku-billing' below if your repo has a different name.
const REPO_NAME = 'rakaoil'

export default defineConfig({
  // base is / for standard hosting like Vercel/Netlify
  base: '/',

  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      base: '/',
      manifest: {
        name: 'J Oil Mill Billing',
        short_name: 'J Oil Mill Bill',
        description: 'Billing software for J Oil Mill',
        theme_color: '#7C5C3E',
        background_color: '#FDF6EE',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
            handler: 'NetworkFirst',
            options: { cacheName: 'supabase-cache', networkTimeoutSeconds: 10 }
          }
        ]
      }
    })
  ],

  server: { port: 3000 }
})
