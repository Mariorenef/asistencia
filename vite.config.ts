
// vite.config.ts o vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/asistencia/', // 👈 reemplazá por el nombre real de tu repo
  plugins: [react()],
})
