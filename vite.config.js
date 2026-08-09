import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

// Cambia el nombre de caché del Service Worker en CADA build. Así sw.js
// siempre difiere entre despliegues → el navegador detecta una versión nueva
// → main.jsx dispara el evento "mimalla:swupdate" → UpdatePrompt pide recargar.
function swCacheVersion() {
  return {
    name: 'sw-cache-version',
    closeBundle() {
      const file = join(process.cwd(), 'dist', 'sw.js')
      try {
        let code = readFileSync(file, 'utf8')
        code = code.replace(/mimalla-v[\w-]+/, `mimalla-v${Date.now()}`)
        writeFileSync(file, code)
        console.log(`[sw-cache-version] cache del SW actualizado`)
      } catch (err) {
        console.warn('[sw-cache-version] no se pudo actualizar el cache del SW:', err.message)
      }
    },
  }
}

export default defineConfig({
  plugins: [react(), swCacheVersion()],
  build: {
    target: 'es2020',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
        },
      },
    },
  },
})
