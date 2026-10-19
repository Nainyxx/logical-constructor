import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  // относительные пути, чтобы сборка открывалась из файла в Electron
  base: './',
  plugins: [react()],
})
