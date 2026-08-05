const { defineConfig } = require('vite');
const react = require('@vitejs/plugin-react');
const { VitePWA } = require('vite-plugin-pwa');

// root: 'frontend' — the Vite app's source (index.html, src/, public/) lives
// in ./frontend, but this config sits at the package root so Vercel sees a
// single package.json for the whole project instead of a nested workspace
// (a second package.json under frontend/ made Vercel's monorepo detection
// treat this as a "multiple services" project, which needs explicit
// rewrites/routing we don't actually want for a single Vite + Functions app).
module.exports = defineConfig({
  root: 'frontend',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/icon-192.svg', 'icons/icon-512.svg'],
      manifest: {
        name: 'ManwhaFinder',
        short_name: 'ManwhaFinder',
        description: 'Find similar manwha using AI-powered recommendations',
        theme_color: '#0f0f0f',
        background_color: '#0f0f0f',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: '/icons/icon-192.svg', sizes: '192x192', type: 'image/svg+xml' },
          { src: '/icons/icon-512.svg', sizes: '512x512', type: 'image/svg+xml' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png}'],
      },
    }),
  ],
  server: {
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
});
