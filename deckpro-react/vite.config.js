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
    sourcemap: false, // Disable for production
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    },
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'konva-vendor': ['konva', 'react-konva'],
          'ui-vendor': ['lucide-react', '@radix-ui/react-dialog', '@radix-ui/react-tabs'],
          'utils': ['clsx', 'tailwind-merge', 'zustand']
        }
      }
    },
    chunkSizeWarningLimit: 1000,
    reportCompressedSize: false
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'konva', 'react-konva']
  }
})
