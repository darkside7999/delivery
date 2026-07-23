import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// El frontend corre en 5173 y proxya /api al backend (Express) en 8787.
// Vite observa src/ y hace HMR: cuando Claude crea o edita una feature en
// src/app-surface/features, la página se actualiza en vivo.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:8787',
    },
  },
})
