import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const repositoryRoot = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  root: resolve(repositoryRoot, 'admin'),
  publicDir: resolve(repositoryRoot, 'public'),
  envDir: repositoryRoot,
  plugins: [react()],
  server: {
    host: '127.0.0.1',
    port: 5181,
    strictPort: true,
  },
  build: {
    outDir: resolve(repositoryRoot, 'dist-admin'),
    emptyOutDir: true,
  },
})
