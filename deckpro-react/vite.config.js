import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Listen on all addresses
    port: 3000, // Change this to your desired port
    strictPort: true,
    open: true,
    // For WSL2 compatibility
    watch: {
      usePolling: true
    }
  },
  build: {
    sourcemap: true
  }
})
