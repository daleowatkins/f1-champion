/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { adminApiPlugin } from './scripts/vite-admin-api'

const repoName = process.env.GITHUB_REPOSITORY_NAME ?? 'f1-champion'
const base =
  process.env.GITHUB_PAGES === 'true' ? `/${repoName}/` : '/'

export default defineConfig({
  base,
  plugins: [react(), tailwindcss(), adminApiPlugin()],
  test: {
    globals: true,
    environment: 'jsdom',
  },
})
