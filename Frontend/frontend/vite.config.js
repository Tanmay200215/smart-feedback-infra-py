import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Uses VITE_API_BASE if provided. Otherwise, dev proxy to local FastAPI.
const useProxy = !process.env.VITE_API_BASE

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: useProxy
      ? {
          '/api': {
            target: 'http://localhost:8000',
            changeOrigin: true
          }
        }
      : undefined
  }
})
