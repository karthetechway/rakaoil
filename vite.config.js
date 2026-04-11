import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// For GitHub Pages the app lives at:
// https://YOUR_USERNAME.github.io/chekku-billing/
// The base path must match your repository name exactly.
// Change 'chekku-billing' below if your repo has a different name.
const REPO_NAME = 'rakaoil'

export default defineConfig({
  // base is /repo-name/ for GitHub Pages project sites
  // For a username.github.io repo (root site) set base: '/'
  base: `/${REPO_NAME}/`,

  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      base: `/${REPO_NAME}/`,
      manifest: {
        name: 'Chekku Oil Billing',
        short_name: 'Chekku Bill',
        description: 'Billing software for Chekku Oil Shop',
        theme_color: '#7C5C3E',
        background_color: '#FDF6EE',
        display: 'standalone',
        start_url: `/${REPO_NAME}/`,
        scope: `/${REPO_NAME}/`,
        icons: [
          { src: `/${REPO_NAME}/icon-192.png`, sizes: '192x192', type: 'image/png' },
          { src: `/${REPO_NAME}/icon-512.png`, sizes: '512x512', type: 'image/png' }
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
