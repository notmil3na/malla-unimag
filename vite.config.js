import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

// Lista todos los archivos de dist/ (menos HTML) para precachearlos en el SW.
function listFiles(dir, prefix) {
  const out = []
  if (!existsSync(dir)) return out
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    const url = '/' + join(prefix, entry.name).replace(/\\/g, '/')
    if (entry.isDirectory()) out.push(...listFiles(full, join(prefix, entry.name)))
    else if (!entry.name.endsWith('.html')) out.push(url)
  }
  return out
}

// Cambia el nombre de caché del Service Worker en CADA build. Así sw.js
// siempre difiere entre despliegues → el navegador detecta una versión nueva
// → main.jsx dispara el evento "mimalla:swupdate" → UpdatePrompt pide recargar.
// Además llena PRECACHE con los assets con hash de este release, de modo que el
// SW nuevo descarga la versión completa en segundo plano y el recargo es al instante.
function swCacheVersion() {
  return {
    name: 'sw-cache-version',
    closeBundle() {
      const dist = join(process.cwd(), 'dist')
      const file = join(dist, 'sw.js')
      try {
        const assets = [
          ...new Set(
            listFiles(dist, '.')
              .filter((url) => url !== '/sw.js')
              .sort()
          ),
        ]
        let code = readFileSync(file, 'utf8')
        code = code.replace(
          'const PRECACHE = [];',
          `const PRECACHE = ${JSON.stringify(assets)};`
        )
        code = code.replace(/mimalla-v[\w-]+/, `mimalla-v${Date.now()}`)
        writeFileSync(file, code)
        console.log(`[sw-cache-version] cache del SW actualizado · ${assets.length} assets en precache`)
      } catch (err) {
        console.warn('[sw-cache-version] no se pudo actualizar el cache del SW:', err.message)
      }
    },
  }
}

export default defineConfig({
  plugins: [react(), swCacheVersion()],
  server: {
    proxy: {
      "/api": {
        target: "https://malla-unimag.vercel.app",
        changeOrigin: true,
      },
    },
  },
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
