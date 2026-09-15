import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // In dev, the client runs on 5173 and the API on 4000 (see server/index.js).
      // Proxy /api so the browser only ever talks to one origin.
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
  build: {
    // Built assets land where the Express server serves static files from,
    // so `npm run build` + `npm start` is all that's needed in production.
    outDir: '../server/public',
    emptyOutDir: true,
  },
})
